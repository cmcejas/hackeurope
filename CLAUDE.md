# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HackEurope is a multimodal allergy diagnostic tool that differentiates between allergic conjunctivitis and viral/bacterial infections using vocal biomarkers (nasality), ocular biomarkers (redness/tearing), and symptom history. The application outputs HL7 FHIR R4-compliant data with SNOMED-CT coding.

**Tech Stack:**
- Frontend: Expo (React Native) with file-based routing (expo-router)
- Backend: FastAPI (Python) with Pydantic for FHIR schemas
- Infrastructure: Docker Compose with PostgreSQL
- AI Analysis: librosa (audio), google-generativeai (Gemini 1.5 Flash Vision for ocular analysis)
- External APIs: Open-Meteo (pollen/air quality data)

## Architecture

### Monorepo Structure
The project follows a monorepo pattern:
- `/apps/mobile`: Expo mobile application (current root contains the Expo app)
- `/apps/server`: FastAPI backend (to be created)
- `/packages/shared`: (Optional) Shared types/constants

**Note:** The current repository structure has the Expo app at the root level. When scaffolding the monorepo, the existing app files should be moved to `/apps/mobile`.

### Expo App Structure
- Uses file-based routing via expo-router (v6)
- Routes are defined in the `app/` directory
- `app/_layout.tsx`: Root layout with Stack navigation
- `app/(tabs)/`: Tab-based navigation (currently hidden via `tabBarStyle: { display: 'none' }`)
- TypeScript paths configured with `@/*` alias pointing to root

### Data Flow
1. **Input Collection (Mobile):** Voice recording, eye photo, symptom history form
2. **Analysis (Backend):**
   - Audio: librosa calculates nasality scores (MFCC, Spectral Centroid)
   - Vision: Gemini 1.5 Flash Vision extracts clinical features (bilateral/unilateral redness, discharge type)
   - Environmental: Open-Meteo provides 48h historical pollen/AQI data
3. **Diagnostic Engine:** Combines multimodal inputs with safety guardrails (flags unilateral redness/fever)
4. **Output:** FHIR R4 Observation and AllergyIntolerance resources with SNOMED-CT coding

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start Expo dev server
npm start
# or
npx expo start

# Run on specific platform
npm run android   # Android emulator
npm run ios       # iOS simulator
npm run web       # Web browser
```

### Linting
```bash
npm run lint
```

### Docker
```bash
# Start PostgreSQL and FastAPI server
docker-compose up

# Stop services
docker-compose down
```

## Key Development Considerations

### FHIR & SNOMED-CT Integration
- All diagnostic outputs must conform to HL7 FHIR R4 specification
- Use Pydantic models for FHIR resource validation in the backend
- Map clinical findings to SNOMED-CT concept IDs:
  - Allergic conjunctivitis: 9826008
  - Bacterial conjunctivitis: 1532007
  - Viral conjunctivitis: 370465006
  - Pollen allergy: 21719001

### Expo Configuration
- React Compiler is enabled (`experiments.reactCompiler: true`)
- New Architecture is enabled (`newArchEnabled: true`)
- TypeScript strict mode is ON
- Uses gesture-handler v2.28.0 and reanimated v4.1.1

### Safety Guardrails
The diagnostic logic MUST flag high-risk scenarios:
- Unilateral eye redness (potential serious infection)
- Fever presence (suggests bacterial/viral infection)
- These cases should recommend immediate medical consultation

### Project Planning
The `.planning/` directory contains:
- `PROJECT.md`: Core vision and tech stack
- `REQUIREMENTS.md`: Functional and technical requirements
- `ROADMAP.md`: 4-phase development plan (30 hours total)
- `STATE.md`: Current development state
- Use these files as the source of truth for feature scope and priorities

## Environment Variables
The backend requires:
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google AI API key for vision analysis
- `OPENMETEO_API_URL`: (Optional) Open-Meteo endpoint
