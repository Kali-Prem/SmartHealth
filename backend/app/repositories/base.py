"""Base Repository providing asynchronous CRUD primitives over Firestore."""

from typing import Any

from backend.app.database import DatabaseClient, get_db


class BaseRepository:
    """Base class for all Firestore collection repositories."""

    collection_name: str

    def __init__(self, db: DatabaseClient | None = None) -> None:
        self.db = db or get_db()

    async def get_by_id(self, doc_id: str) -> dict[str, Any] | None:
        """Fetch a single document by ID."""
        return await self.db.get_document(self.collection_name, doc_id)

    async def list_all(self) -> list[dict[str, Any]]:
        """List all documents in the collection."""
        return await self.db.list_documents(self.collection_name)

    async def save(self, doc_id: str, data: dict[str, Any], merge: bool = False) -> None:
        """Create or update document."""
        await self.db.set_document(self.collection_name, doc_id, data, merge=merge)

    async def delete(self, doc_id: str) -> None:
        """Delete document by ID."""
        await self.db.delete_document(self.collection_name, doc_id)
