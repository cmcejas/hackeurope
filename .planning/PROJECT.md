# Project: HackEurope - Multimodal Allergy Diagnostic Tool

## Overview
A multimodal health diagnostic application (Expo/FastAPI) that uses vocal biomarkers (nasality), ocular biomarkers (redness/tearing), and symptom history to differentiate between allergic conjunctivitis and viral/bacterial infections.

## Core Vision
To provide a scientifically grounded, accessible tool for allergy assessment, leveraging AI for clinical feature extraction and ensuring data interoperability through FHIR standards.

## Tech Stack
- **Frontend:** Expo (React Native/Web) with TailwindCSS (NativeWind) and Lucide-React.
- **Backend:** FastAPI (Python) with Pydantic for FHIR schemas.
- **Infrastructure:** Docker Compose (PostgreSQL).
- **AI/Analysis:** 
  - `librosa` for audio (nasality) analysis.
  - `google-generativeai` (Gemini 1.5 Flash Vision) for ocular feature extraction.
- **Data:** Open-Meteo API for pollen and air quality.
- **Standards:** HL7 FHIR R4, SNOMED-CT.

## Monorepo Structure
- `/apps/mobile`: Expo application.
- `/apps/server`: FastAPI backend.
- `/packages/shared`: (Optional) Shared types/constants.

## Success Criteria
- Multimodal input: History/Symptoms, Eye Photo, Voice Recording.
- Accurate differentiation between "Sick" (infection) and "Allergies".
- Generation of valid FHIR Observation and AllergyIntolerances.
- Local development environment running via Docker.
