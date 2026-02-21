# Roadmap: HackEurope Multimodal Allergy Tool

## Phase 1: Foundations & Infrastructure (Hours 0-6)
- [ ] **Task 1: Monorepo Scaffolding**
  - Initialize `apps/mobile` (Expo) and `apps/server` (FastAPI).
  - Create `docker-compose.yml` with PostgreSQL.
- [ ] **Task 2: Environmental Integration**
  - Implement Open-Meteo API client for historical pollen/AQI data.
- [ ] **Task 3: Data Modeling**
  - Define Pydantic schemas for FHIR R4 resources.

## Phase 2: Analysis Engines (Hours 6-18)
- [ ] **Task 1: Vocal Analysis Pipeline**
  - Implement `analyze_voice` using `librosa` (MFCC/Nasality).
- [ ] **Task 2: Ocular Analysis Pipeline**
  - Integrate Gemini 1.5 Flash Vision for clinical feature extraction.
- [ ] **Task 3: Mobile Input Screens**
  - Build voice recorder, camera interface, and history form.

## Phase 3: Integration & Safety (Hours 18-24)
- [ ] **Task 1: Diagnostic API**
  - Create `/diagnose` endpoint combining all data points.
- [ ] **Task 2: Safety Logic**
  - Implement guardrails for unilateral redness and high-risk symptoms.
- [ ] **Task 3: FHIR Generation**
  - Implement logic to convert results into structured FHIR JSON.

## Phase 4: Polish & Demo (Hours 24-30)
- [ ] **Task 1: Dashboard UI**
  - Build the result dashboard with clinical insights.
- [ ] **Task 2: Testing & Edge Cases**
  - Verify against low-light photos and noisy audio.
- [ ] **Task 3: Documentation**
  - Map results to SNOMED-CT for judges.
