# Requirements: HackEurope Multimodal Allergy Tool

## Functional Requirements

### 1. Multimodal Data Collection
- **Voice Recording:** Capture 5-10 seconds of user speech via Expo.
- **Ocular Imaging:** Capture/upload a high-quality photo of the user's eyes.
- **History/Symptoms:** Form input for allergy history and current symptoms (e.g., fever, itching).

### 2. Backend Analysis Engine (FastAPI)
- **Audio Analysis:** Process voice using `librosa` to calculate nasality scores (MFCC, Spectral Centroid).
- **Vision Analysis:** Use Gemini 1.5 Flash Vision to identify:
  - Bilateral vs. Unilateral redness.
  - Presence of clear tearing vs. purulent discharge.
- **Environmental Context:** Fetch 48h historical pollen/air quality data from Open-Meteo.

### 3. Diagnostic Logic
- **Risk Scoring:** Combine voice, vision, history, and environmental data to calculate "Allergy" vs. "Infection" probability.
- **Safety Guardrails:** Flag "Unilateral Redness" or "Fever" as high-risk, requiring medical consultation.

### 4. Data Interoperability
- **FHIR Output:** Generate FHIR R4 `Observation` and `AllergyIntolerance` resources for the result.

## Technical Requirements
- **Monorepo:** Structure using `apps/mobile` (Expo) and `apps/server` (FastAPI).
- **Docker:** `docker-compose.yml` for PostgreSQL and backend services.
- **API:** RESTful API endpoints for diagnostics.

## Scoped Out (V2)
- Automated billing (ICD-10 to DRG).
- Wearable integration (HR/Respiratory).
- Multi-language support.
