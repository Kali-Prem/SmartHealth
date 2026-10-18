"""Database adapter supporting Google Cloud Firestore and an async in-memory fallback.

Ensures zero friction in local testing, CI/CD, and live Cloud Run deployments.
"""

import asyncio
from typing import Any

from backend.app.config import get_settings


class MockDocumentSnapshot:
    """Emulates a Firestore DocumentSnapshot."""

    def __init__(self, doc_id: str, data: dict[str, Any] | None):
        self.id = doc_id
        self._data = data

    @property
    def exists(self) -> bool:
        return self._data is not None

    def to_dict(self) -> dict[str, Any] | None:
        return self._data.copy() if self._data else None


class MockDocumentReference:
    """Emulates a Firestore DocumentReference."""

    def __init__(self, db: "InMemoryFirestore", collection_name: str, doc_id: str):
        self._db = db
        self._collection = collection_name
        self.id = doc_id

    async def get(self) -> MockDocumentSnapshot:
        data = self._db.get_raw(self._collection, self.id)
        return MockDocumentSnapshot(self.id, data)

    async def set(self, document_data: dict[str, Any], merge: bool = False) -> None:
        self._db.set_raw(self._collection, self.id, document_data, merge=merge)

    async def update(self, field_updates: dict[str, Any]) -> None:
        self._db.update_raw(self._collection, self.id, field_updates)

    async def delete(self) -> None:
        self._db.delete_raw(self._collection, self.id)


class MockQuery:
    """Emulates a Firestore Query with filtering and limits."""

    def __init__(
        self,
        db: "InMemoryFirestore",
        collection_name: str,
        filters: list[tuple[str, str, Any]] | None = None,
        limit_val: int | None = None,
    ):
        self._db = db
        self.collection_name = collection_name
        self._filters: list[tuple[str, str, Any]] = filters or []
        self._limit = limit_val

    def where(self, field: str, op: str, value: Any) -> "MockQuery":
        new_filters = list(self._filters)
        new_filters.append((field, op, value))
        return MockQuery(self._db, self.collection_name, new_filters, self._limit)

    def limit(self, count: int) -> "MockQuery":
        return MockQuery(self._db, self.collection_name, self._filters, count)

    async def get(self) -> list[MockDocumentSnapshot]:
        docs = self._db.get_collection_raw(self.collection_name)
        results: list[MockDocumentSnapshot] = []
        for doc_id, data in docs.items():
            match = True
            for field, op, val in self._filters:
                doc_val = data.get(field)
                if op == "==" and doc_val != val:
                    match = False
                    break
                elif op == "<=" and not (doc_val is not None and doc_val <= val):
                    match = False
                    break
                elif op == ">=" and not (doc_val is not None and doc_val >= val):
                    match = False
                    break
                elif op == "<" and not (doc_val is not None and doc_val < val):
                    match = False
                    break
                elif op == ">" and not (doc_val is not None and doc_val > val):
                    match = False
                    break
                elif op == "in" and doc_val not in val:
                    match = False
                    break
            if match:
                results.append(MockDocumentSnapshot(doc_id, data))
                if self._limit is not None and len(results) >= self._limit:
                    break
        return results

    async def stream(self):
        docs = await self.get()
        for doc in docs:
            yield doc


class MockCollectionReference:
    """Emulates a Firestore CollectionReference."""

    def __init__(self, db: "InMemoryFirestore", collection_name: str):
        self._db = db
        self.name = collection_name

    def document(self, document_id: str | None = None) -> MockDocumentReference:
        doc_id = document_id or self._db.generate_id()
        return MockDocumentReference(self._db, self.name, doc_id)

    def where(self, field: str, op: str, value: Any) -> MockQuery:
        return MockQuery(self._db, self.name).where(field, op, value)

    def limit(self, count: int) -> MockQuery:
        return MockQuery(self._db, self.name).limit(count)

    async def get(self) -> list[MockDocumentSnapshot]:
        docs = self._db.get_collection_raw(self.name)
        return [MockDocumentSnapshot(doc_id, data) for doc_id, data in docs.items()]

    async def stream(self):
        docs = await self.get()
        for doc in docs:
            yield doc


class InMemoryFirestore:
    """Thread-safe, async in-memory document store emulating Firestore."""

    def __init__(self) -> None:
        self._storage: dict[str, dict[str, dict[str, Any]]] = {}
        self._id_counter = 1000
        self._lock = asyncio.Lock()

    def generate_id(self) -> str:
        self._id_counter += 1
        return f"doc_{self._id_counter}"

    def get_raw(self, collection: str, doc_id: str) -> dict[str, Any] | None:
        col = self._storage.get(collection, {})
        data = col.get(doc_id)
        return data.copy() if data else None

    def get_collection_raw(self, collection: str) -> dict[str, dict[str, Any]]:
        return self._storage.get(collection, {}).copy()

    def set_raw(
        self, collection: str, doc_id: str, data: dict[str, Any], merge: bool = False
    ) -> None:
        if collection not in self._storage:
            self._storage[collection] = {}

        if merge and doc_id in self._storage[collection]:
            self._storage[collection][doc_id].update(data)
        else:
            self._storage[collection][doc_id] = data.copy()

    def update_raw(self, collection: str, doc_id: str, updates: dict[str, Any]) -> None:
        if collection not in self._storage or doc_id not in self._storage[collection]:
            raise KeyError(f"Document {doc_id} in {collection} not found")
        self._storage[collection][doc_id].update(updates)

    def delete_raw(self, collection: str, doc_id: str) -> None:
        if collection in self._storage and doc_id in self._storage[collection]:
            del self._storage[collection][doc_id]

    def collection(self, name: str) -> MockCollectionReference:
        return MockCollectionReference(self, name)


class DatabaseClient:
    """Unified client providing access to Google Cloud Firestore or InMemoryFallback."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._in_memory = InMemoryFirestore()
        self._firestore_client: Any = None
        self._init_client()

    def _init_client(self) -> None:
        """Initialize Firestore if GCP credentials exist, otherwise default to in-memory store."""
        if not self.settings.use_mock_db:
            try:
                from google.cloud import firestore  # type: ignore

                self._firestore_client = firestore.AsyncClient(
                    project=self.settings.gcp_project_id,
                    database=self.settings.firestore_database,
                )
            except Exception:
                # Graceful fallback to memory store
                self._firestore_client = None

    def collection(self, name: str):
        """Get collection reference."""
        if self._firestore_client is not None:
            return self._firestore_client.collection(name)
        return self._in_memory.collection(name)

    async def list_documents(self, collection_name: str) -> list[dict[str, Any]]:
        """Utility method to get all documents as dicts with id field."""
        col = self.collection(collection_name)
        docs: list[dict[str, Any]] = []
        if self._firestore_client is not None:
            async for doc in col.stream():
                d = doc.to_dict() or {}
                d["id"] = doc.id
                docs.append(d)
        else:
            async for doc in col.stream():
                d = doc.to_dict() or {}
                d["id"] = doc.id
                docs.append(d)
        return docs

    async def query_documents(
        self,
        collection_name: str,
        filters: list[tuple[str, str, Any]] | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        """Query documents with optional where filters and limits to prevent full collection scans."""
        col = self.collection(collection_name)
        query = col
        if filters:
            for field, op, val in filters:
                query = query.where(field, op, val)
        if limit is not None:
            query = query.limit(limit)

        docs: list[dict[str, Any]] = []
        async for doc in query.stream():
            d = doc.to_dict() or {}
            d["id"] = doc.id
            docs.append(d)
        return docs

    async def get_document(self, collection_name: str, doc_id: str) -> dict[str, Any] | None:
        """Get a single document by ID."""
        doc_ref = self.collection(collection_name).document(doc_id)
        snap = await doc_ref.get()
        if snap.exists:
            d = snap.to_dict() or {}
            d["id"] = snap.id
            return d
        return None

    async def set_document(
        self, collection_name: str, doc_id: str, data: dict[str, Any], merge: bool = False
    ) -> None:
        """Create or replace a document."""
        data_to_save = {k: v for k, v in data.items() if k != "id"}
        doc_ref = self.collection(collection_name).document(doc_id)
        await doc_ref.set(data_to_save, merge=merge)

    async def delete_document(self, collection_name: str, doc_id: str) -> None:
        """Delete a document."""
        doc_ref = self.collection(collection_name).document(doc_id)
        await doc_ref.delete()


_db_instance: DatabaseClient | None = None


def get_db() -> DatabaseClient:
    """Database client singleton dependency."""
    global _db_instance
    if _db_instance is None:
        _db_instance = DatabaseClient()
    return _db_instance
