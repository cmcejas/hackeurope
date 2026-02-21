# Phase 1 Plan: Foundations & Infrastructure

**Goal:** Establish the project's monorepo structure, set up the development environment with Docker, and implement the initial backend infrastructure (FHIR models and Open-Meteo integration).

## Tasks

### 1. Monorepo Scaffolding
- [ ] **1.1 Reorganize Directory Structure**
  - Create `apps/mobile` and `apps/server` directories.
  - Move existing Expo files (`app/`, `package.json`, `tsconfig.json`, etc.) to `apps/mobile`.
  - Initialize a new FastAPI project in `apps/server` using `uv` or `pip`.
- [ ] **1.2 Configure Docker & Root**
  - Refine `docker-compose.yml` to ensure correct volume mapping and environment variables.
  - Add a root-level `package.json` for monorepo management (if needed) or simple scripts to start services.

### 2. Backend Infrastructure & Environmental Integration
- [ ] **2.1 Initialize FastAPI Structure**
  - Create `app/api/v1`, `app/core`, `app/schemas`, and `app/services` directories in `apps/server`.
  - Set up a base FastAPI app with basic error handling and CORS configuration.
- [ ] **2.2 Implement Open-Meteo Client**
  - Create `app/services/pollen.py` using `httpx`.
  - Implement a function to fetch 48h historical pollen (Birch, Grass, Ragweed) and AQI data based on latitude/longitude.
- [ ] **2.3 FHIR Data Modeling**
  - Implement Pydantic models in `app/schemas/fhir.py` for:
    - `Observation` (for nasality and eye findings).
    - `AllergyIntolerance` (for user history).
    - Nested components: `CodeableConcept`, `Coding`, `Quantity`, `Reference`.

## Verification Plan

### Automated Tests
- [ ] **Backend Unit Tests:**
  - Test `pollen.py` client with `pytest` and `respx` (to mock API responses).
  - Validate FHIR Pydantic models with sample FHIR JSON data.
- [ ] **Integration Tests:**
  - Verify `docker-compose up` starts both PostgreSQL and the FastAPI server.
  - Test the `/health` endpoint of the FastAPI server.

### Manual Verification
- [ ] **Monorepo Check:** Ensure `npx expo start` works within `apps/mobile`.
- [ ] **API Check:** Use Swagger UI (`/docs`) to verify the Open-Meteo service can be invoked (once a test endpoint is added).
