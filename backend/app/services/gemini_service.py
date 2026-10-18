"""Gemini AI Service with Multilingual Support, Caching and Offline Fallback.

Adheres strictly to project rules:
- Async execution
- In-memory TTL caching (cachetools)
- Safe prompt sanitization
- Handles Gemini API errors / offline states gracefully
- Generates grounded public health advisories in English & Hindi
"""

import hashlib
import time
from typing import Any

from cachetools import TTLCache

from backend.app.config import get_settings
from backend.app.security import sanitize_text

# TTL Cache: 500 items, expires after configured TTL (default 1 hour)
_gemini_cache: TTLCache = TTLCache(maxsize=500, ttl=3600)

SYSTEM_PROMPT_EN = """You are SmartHealth Copilot, an AI public health advisor for District Health Administrators (Chief Medical Officers and DHOs) managing PHCs/CHCs in India.
Your mission:
- Provide clear, actionable, evidence-based public health guidance in accordance with Indian Ministry of Health & Family Welfare (MoHFW) and National Health Mission (NHM) guidelines.
- Emphasize disease surveillance (IDSP), essential drug availability (EDL/eVIN), cold-chain integrity, maternal & child health (RCH), and immunization coverage (UIP).
- Be factual, concise, and prioritize immediate life-saving public health interventions.
- Structure responses with key facts, root causes, and bulleted action items.
"""

SYSTEM_PROMPT_HI = """आप SmartHealth Copilot हैं, भारत में प्राथमिक एवं सामुदायिक स्वास्थ्य केंद्रों (PHC/CHC) के प्रबंधन हेतु जिला स्वास्थ्य अधिकारियों (CMO/DHO) के लिए एक AI जनस्वास्थ्य सलाहकार।
आपका उद्देश्य:
- राष्ट्रीय स्वास्थ्य मिशन (NHM) एवं स्वास्थ्य व परिवार कल्याण मंत्रालय के दिशा-निर्देशों के अनुसार स्पष्ट, व्यावहारिक और तथ्यपरक स्वास्थ्य सलाह प्रदान करना।
- रोग निगरानी (IDSP), आवश्यक दवाओं की आपूर्ति (EDL/eVIN), कोल्ड चेन, मातृ एवं शिशु स्वास्थ्य (RCH), और टीकाकरण कवरेज पर ध्यान देना।
- तुरंत कार्रवाई योग्य कदम और सुस्पष्ट समाधान हिंदी में प्रस्तुत करना।
"""


class GeminiService:
    """Manages Gemini LLM requests with caching, district grounding, and error recovery."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._client: Any | None = None
        self._init_client()

    def _init_client(self) -> None:
        """Initialize Google GenAI client if API key is provided."""
        api_key = self.settings.gemini_api_key
        if api_key and api_key != "mock-gemini-key":
            try:
                from google import genai  # type: ignore

                self._client = genai.Client(api_key=api_key)
            except Exception:
                self._client = None
        else:
            self._client = None

    def _compute_cache_key(self, query: str, language: str, context_str: str) -> str:
        """Create a deterministic hash key for cached queries."""
        raw = f"{query.strip().lower()}:{language}:{context_str}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    async def ask_copilot(
        self,
        query: str,
        language: str = "en",
        district_context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Ask Gemini Copilot a district health query with grounded context.

        Args:
            query: User's natural language question.
            language: 'en' or 'hi'.
            district_context: Live summary of centres, stockouts, or outbreaks.

        Returns:
            Dict containing reply, sources, suggested_actions, and cached status.
        """
        start_time = time.time()
        clean_query = sanitize_text(query)
        context_str = str(sorted(district_context.items())) if district_context else ""
        cache_key = self._compute_cache_key(clean_query, language, context_str)

        # Check Cache
        if cache_key in _gemini_cache:
            cached_data = _gemini_cache[cache_key].copy()
            cached_data["cached"] = True
            cached_data["processing_time_ms"] = round((time.time() - start_time) * 1000, 2)
            return cached_data

        system_instruction = SYSTEM_PROMPT_HI if language == "hi" else SYSTEM_PROMPT_EN

        # Format context into prompt
        prompt_content = f"Question: {clean_query}\n"
        if district_context:
            prompt_content += f"\nCurrent District Operational Context:\n{district_context}\n"

        reply: str
        sources: list[str] = [
            "National Health Mission (NHM) Operational Guidelines",
            "Integrated Disease Surveillance Programme (IDSP)",
            "District SmartHealth Live Sensor & Stock Telemetry",
        ]
        suggested_actions: list[str]

        # Call Gemini API if available, else use grounded intelligent fallback
        if self._client is not None:
            try:
                model_name = self.settings.gemini_model
                response = self._client.models.generate_content(
                    model=model_name,
                    contents=prompt_content,
                    config={
                        "system_instruction": system_instruction,
                        "temperature": 0.2,
                    },
                )
                reply = response.text or ""
            except Exception as exc:
                # Handle API failure with contextual fallback
                reply = self._generate_fallback_reply(
                    clean_query, language, district_context, str(exc)
                )
        else:
            reply = self._generate_fallback_reply(clean_query, language, district_context, None)

        if language == "hi":
            suggested_actions = [
                "संबंधित PHC को तुरंत अलर्ट एवं निर्देश भेजें",
                "औषधि भंडार एवं कोल्ड चेन की तत्काल समीक्षा करें",
                "क्षेत्रीय ANM एवं आशा कार्यकर्ताओं की बैठक आयोजित करें",
            ]
        else:
            suggested_actions = [
                "Issue direct alert and advisory to MOIC of affected PHC",
                "Initiate inter-facility stock rebalancing for deficit medicines",
                "Deploy rapid response team (RRT) for contact tracing",
            ]

        result = {
            "reply": reply,
            "language": language,
            "sources": sources,
            "suggested_actions": suggested_actions,
            "cached": False,
            "processing_time_ms": round((time.time() - start_time) * 1000, 2),
        }

        # Save to cache
        _gemini_cache[cache_key] = result
        return result

    def _generate_fallback_reply(
        self,
        query: str,
        language: str,
        district_context: dict[str, Any] | None,
        error_note: str | None = None,
    ) -> str:
        """Provide intelligent, rule-based clinical response when Gemini API is offline."""
        q_lower = query.lower()

        # Outbreak / Fever / Dengue / Diarrhea
        if any(
            w in q_lower
            for w in ["dengue", "malaria", "fever", "diarrhea", "outbreak", "डेंगू", "बुखार", "हैजा"]
        ):
            if language == "hi":
                return (
                    "### आईडीएसपी (IDSP) प्रकोप नियंत्रण प्रोटोकॉल:\n"
                    "1. **तत्काल सर्वेक्षण**: प्रभावित क्षेत्रों में आशा (ASHA) कार्यकर्ताओं द्वारा घर-घर जाकर बुखार के मामलों की सक्रिय पहचान करें।\n"
                    "2. **नैदानिक परीक्षण**: प्राथमिक स्वास्थ्य केंद्र में एनएस1 (NS1) एंटीजन और आईजीएम (IgM) एलिसा परीक्षण किट की उपलब्धता सुनिश्चित करें।\n"
                    "3. **वेक्टर नियंत्रण**: लार्वा रोधी छिड़काव और फॉगिंग तुरंत शुरू की जाए।\n"
                    "4. **आईवी फ्लूइड्स एवं दवाएं**: ओआरएस और पैरासिटामोल का पर्याप्त बफर स्टॉक बनाए रखें।\n"
                    "5. **जनजागरूकता**: स्थानीय भाषा में मच्छरों से बचाव और स्वच्छ पेयजल उपयोग का प्रसार करें।"
                )
            return (
                "### IDSP Outbreak Response Protocol:\n"
                "1. **Active Case Search**: Mobilize ASHA & ANM cadres for door-to-door fever surveys in affected villages.\n"
                "2. **Diagnostic Readiness**: Verify availability of rapid diagnostic kits (NS1/IgM ELISA for Dengue, RDTs for Malaria) at the local PHC.\n"
                "3. **Vector / Source Reduction**: Coordinate with municipal/panchayat teams for anti-larval spraying and source elimination.\n"
                "4. **Clinical Buffer**: Ensure adequate supply of ORS, IV fluids (Ringer Lactate, Normal Saline), and Paracetamol.\n"
                "5. **Referral Protocol**: Instruct MOIC to flag severe warning signs (hematocrit spike, platelet drop <50k, hypotension) for early CHC/District Hospital referral."
            )

        # Medicine / Stockout / Antivenom / Vaccine
        if any(
            w in q_lower
            for w in ["stock", "antivenom", "vaccine", "medicine", "dawa", "दवा", "वैक्सीन"]
        ):
            if language == "hi":
                return (
                    "### औषधि भंडार एवं पुनर्संतुलन निर्देशिका:\n"
                    "1. **आपातकालीन पुनर्संतुलन**: निकटतम सीएचसी या अतिरिक्त स्टॉक वाले पीएचसी से तुरंत दवा ट्रांसफर की अनुमति दें।\n"
                    "2. **एंटी-वेनम बफर**: प्रत्येक पीएचसी में न्यूनतम 10 वाइल पॉलीवैलेंट स्नेक एंटी-वेनम और 2-8°C कोल्ड चेन तापमान अनिवार्य है।\n"
                    "3. **ई-औषधि/डीवीडीएमएस पोर्टल**: जिला स्टोर पर तुरंत मांग पत्र (Indenting) दर्ज करें।\n"
                    "4. **उच्च प्राथमिकता**: यदि किसी केंद्र पर शून्य स्टॉक है, तो ब्लॉक एम्बुलेंस के माध्यम से 4 घंटे के भीतर आपातकालीन स्टॉक भेजें।"
                )
            return (
                "### Inventory & Medicine Supply Directives:\n"
                "1. **Inter-Facility Rebalancing**: Authorize immediate lateral stock transfer from adjacent surplus PHCs within the block.\n"
                "2. **Critical Antivenom Buffer**: Maintain a minimum mandatory buffer of 10 polyvalent snake antivenom vials per 24x7 PHC.\n"
                "3. **Cold Chain Monitoring**: Ensure ILR temperature stays strictly within 2°C to 8°C with functional data-logger telemetry.\n"
                "4. **DVDMS Indent Escalation**: Submit expedited replenishment indents to the District Drug Warehouse with emergency procurement flags."
            )

        # Maternal / Child Health / Delivery
        if any(
            w in q_lower for w in ["mch", "pregnant", "anc", "delivery", "infant", "गर्भवती", "प्रसव"]
        ):
            if language == "hi":
                return (
                    "### मातृ एवं शिशु स्वास्थ्य (RCH) दिशानिर्देश:\n"
                    "1. **उच्च जोखिम गर्भावस्था (HRP)**: गंभीर एनीमिया (Hb < 7 g/dL) और उच्च रक्तचाप की महिलाओं को 'लाल स्टिकर' से चिह्नित कर विशेषज्ञ निगरानी में रखें।\n"
                    "2. **108/102 एम्बुलेंस लिंकेज**: समय पर संस्थागत प्रसव हेतु जननी सुरक्षा योजना (JSY) के तहत वाहन समन्वय सुनिश्चित करें।\n"
                    "3. **पूर्ण टीकाकरण (FIC)**: पेंटावेलेंट और एमआर ड्रॉपआउट को कम करने के लिए टीकाकरण सत्रों का माइक्रो-प्लान अपडेट करें।"
                )
            return (
                "### Maternal & Child Health (RCH) Directives:\n"
                "1. **High-Risk Pregnancy (HRP) Tracking**: Tag all severe anaemia (Hb < 7 g/dL) and pre-eclampsia cases with red alert cards for specialist CHC follow-up.\n"
                "2. **108/102 Referral Linkage**: Confirm proactive vehicle dispatch under Janani Shishu Suraksha Karyakram (JSSK) for zero out-of-pocket delivery costs.\n"
                "3. **Immunization Dropout Tracking**: Audit Pentavalent-1 vs Pentavalent-3 dropout gaps during monthly Block ANM review meetings."
            )

        # General district health administrator summary
        if language == "hi":
            return (
                "### जिला स्वास्थ्य प्रशासन विश्लेषण:\n"
                "जिला स्वास्थ्य केंद्र सामान्य रूप से क्रियान्वित हैं। वर्तमान प्राथमिकताओं में:\n"
                "- रोग निगरानी (IDSP) के तहत बुखार और मौसमी बीमारियों के मामलों पर नजर रखना।\n"
                "- आवश्यक दवा सूची (EDL) के 100% उपलब्धता लक्ष्य को पूरा करना।\n"
                "- सभी पीएचसी/सीएचसी में बायो-मेडिकल वेस्ट और अग्निशमन सुरक्षा की समीक्षा।"
            )
        return (
            "### District Health Administration Brief:\n"
            "Key operational priorities for the district health network:\n"
            "1. **Surveillance Vigilance**: Monitor daily syndromic reporting across all primary and community facilities via IDSP.\n"
            "2. **Essential Drug List (EDL)**: Maintain >=95% availability of critical medications with zero stockouts in emergency trays.\n"
            "3. **Cold Chain Uptime**: Review automated temperature data-loggers across ILRs and deep freezers for 100% vaccine efficacy.\n"
            "4. **Staffing Optimization**: Coordinate medical officer cross-deputations to cover vacant PHC posts during peak OPD hours."
        )

    async def generate_outbreak_advisory(
        self,
        disease: str,
        centre_name: str,
        cases_count: int,
        language: str = "en",
    ) -> dict[str, Any]:
        """Generate structured outbreak containment protocol and localized advisory."""
        prompt = (
            f"Generate a containment protocol and public notice for an outbreak of {disease} "
            f"with {cases_count} cases detected at {centre_name}. Output in {language}."
        )

        chat_result = await self.ask_copilot(prompt, language=language)
        llm_reply = chat_result.get("reply", "")

        if language == "hi":
            title = f"{centre_name} में {disease.title()} प्रकोप नियंत्रण एवं जनस्वास्थ्य सलाह"
            summary = (
                f"{centre_name} में पिछले 7 दिनों में {disease} के {cases_count} पुष्ट मामले दर्ज किए गए हैं, जो सामान्य सीमा से अधिक हैं। "
                f"सलाहकार संक्षिप्त: {llm_reply[:150]}..."
            )
            clinical = [
                "संदिग्ध रोगियों का त्वरित रक्त/मल परीक्षण और निगरानी।",
                "ओआरएस, आईवी फ्लुइड्स और विशिष्ट एंटीबायोटिक्स/एंटीवायरल की उपलब्धता।",
                "गंभीर निर्जलीकरण या जटिलताओं वाले रोगियों को सीएचसी/जिला अस्पताल में रेफर करना।",
            ]
            containment = [
                "प्रभावित परिधि के 500 मीटर में आशा कार्यकर्ताओं द्वारा गहन सर्वे।",
                "पेयजल स्रोतों की सुपर-क्लोरीनेशन जांच और शुद्धिकरण।",
                "मच्छर जनन स्थलों पर एंटी-लार्वा स्प्रे और फॉगिंग।",
            ]
            public_notice = (
                f"सावधानी सूचना: {centre_name} क्षेत्र के सभी नागरिक केवल उबला हुआ पानी पिएं, "
                f"खुले में रखा भोजन न खाएं और बुखार अथवा उल्टी-दस्त होने पर तुरंत नजदीकी स्वास्थ्य केंद्र में संपर्क करें।"
            )
        else:
            title = f"{disease.title()} Outbreak Containment Protocol for {centre_name}"
            summary = f"{cases_count} confirmed cases of {disease} recorded over 7 days at {centre_name}, breaching baseline threshold."
            clinical = [
                "Establish dedicated isolation beds and triage protocol at OPD.",
                "Ensure stock of diagnostic RDT kits, fluids, and emergency drugs.",
                "Mandate 24-hour observation for pediatric and geriatric patients.",
            ]
            containment = [
                "Deploy Rapid Response Team (RRT) for 500-meter perimeter case contact tracing.",
                "Conduct mandatory super-chlorination of community overhead tanks and wells.",
                "Initiate fogging and larvicidal treatment in water-stagnant zones.",
            ]
            public_notice = (
                f"Public Health Notice: Residents in {centre_name} catchment are advised to consume only boiled water, "
                f"prevent water stagnation in coolers/tires, and report to the nearest PHC immediately upon onset of symptoms."
            )

        return {
            "title": title,
            "summary": summary,
            "clinical_management": clinical,
            "containment_protocol": containment,
            "public_advisory_message": public_notice,
            "language": language,
        }

    async def explain_lateral_rebalance(
        self,
        target_name: str,
        target_block: str,
        drug_name: str,
        donor_name: str,
        donor_block: str,
        distance_km: float,
        transit_time_mins: int,
        quantity: int,
        unit: str,
        donor_remaining: int,
        language: str = "en",
    ) -> str:
        """Provide clinical rationale and transport logistics explanation for a lateral peer transfer."""
        cache_key = f"rebalance_{target_name}_{donor_name}_{drug_name}_{quantity}_{language}"
        if cache_key in _gemini_cache:
            return _gemini_cache[cache_key]

        prompt = (
            f"You are a District Health Logistics Officer in India. Explain the following lateral medicine redistribution recommendation in 3 concise, professional sentences:\n"
            f"- Deficit Facility: {target_name} ({target_block} Block)\n"
            f"- Medicine Needed: {drug_name} (Current stock: 0 {unit})\n"
            f"- Donor Facility: {donor_name} ({donor_block} Block)\n"
            f"- Haversine Distance: {distance_km} km\n"
            f"- Estimated Transit Time: {transit_time_mins} minutes\n"
            f"- Transfer Quantity: {quantity} {unit}\n"
            f"- Donor Safety Reserve: {donor_remaining} {unit} retained (ensuring donor will NOT face stockout)\n"
            f"Requirements:\n"
            f"1. Explain the clinical necessity for {target_name}.\n"
            f"2. Confirm logistical feasibility and transit time.\n"
            f"3. Affirm donor facility safety.\n"
            f"Respond in {'Hindi (Devanagari script)' if language == 'hi' else 'English'}."
        )

        explanation: str
        if self._client is not None:
            try:
                response = self._client.models.generate_content(
                    model=self.settings.gemini_model,
                    contents=prompt,
                    config={"temperature": 0.2},
                )
                explanation = response.text or ""
            except Exception:
                explanation = self._generate_fallback_rebalance_explanation(
                    target_name,
                    target_block,
                    drug_name,
                    donor_name,
                    donor_block,
                    distance_km,
                    transit_time_mins,
                    quantity,
                    unit,
                    donor_remaining,
                    language,
                )
        else:
            explanation = self._generate_fallback_rebalance_explanation(
                target_name,
                target_block,
                drug_name,
                donor_name,
                donor_block,
                distance_km,
                transit_time_mins,
                quantity,
                unit,
                donor_remaining,
                language,
            )

        _gemini_cache[cache_key] = explanation
        return explanation

    def _generate_fallback_rebalance_explanation(
        self,
        target_name: str,
        target_block: str,
        drug_name: str,
        donor_name: str,
        donor_block: str,
        distance_km: float,
        transit_time_mins: int,
        quantity: int,
        unit: str,
        donor_remaining: int,
        language: str = "en",
    ) -> str:
        """Deterministic clinical justification for peer redistribution when LLM is offline."""
        if language == "hi":
            return (
                f"नैदानिक अनुशंसा: {donor_name} ({donor_block} ब्लॉक) से {quantity} {unit} {drug_name} का तत्काल पार्श्व स्थानांतरण "
                f"{target_name} ({target_block} ब्लॉक) में तीव्र औषधि अभाव को हल करता है। यह केंद्र केवल {distance_km} किमी दूर स्थित है "
                f"तथा सड़क मार्ग से अनुमानित पारगमन समय लगभग {transit_time_mins} मिनट है। स्थानांतरण के पश्चात भी दाता केंद्र के पास {donor_remaining} {unit} "
                f"का सुरक्षित भंडार शेष रहेगा, जिससे स्थानीय उपचार सेवाओं में कोई बाधा नहीं आएगी।"
            )
        return (
            f"Clinical Recommendation: Lateral transfer of {quantity} {unit} of {drug_name} from {donor_name} ({donor_block} Block) "
            f"to {target_name} ({target_block} Block) immediately resolves the acute supply deficit. The donor facility is situated {distance_km} km away "
            f"via direct road corridor with an estimated transit time of {transit_time_mins} minutes. The donor facility safely retains {donor_remaining} {unit}, "
            f"guaranteeing uninterrupted routine clinical care."
        )


_gemini_service_instance: GeminiService | None = None


def get_gemini_service() -> GeminiService:
    """Gemini service singleton dependency."""
    global _gemini_service_instance
    if _gemini_service_instance is None:
        _gemini_service_instance = GeminiService()
    return _gemini_service_instance
