# Pollen & Air Quality API Integration

## Overview

The backend now integrates **48-hour historical environmental data** from Open-Meteo's Air Quality API to provide context for allergy diagnosis. This replaces the previous Google Pollen API implementation.

## Why Open-Meteo?

1. **Historical Data**: Provides 48-hour lookback (Google Pollen API only offers forecasts)
2. **No API Key Required**: Free, public API with no authentication
3. **Comprehensive Data**: Includes both pollen counts and air quality metrics
4. **Allergy-Relevant**: Tracks 6 major allergen types (alder, birch, grass, mugwort, olive, ragweed)

## Data Collected

### Pollen Types (grains/m³)
- Alder
- Birch
- Grass
- Mugwort
- Olive
- Ragweed

### Air Quality Metrics (µg/m³)
- PM10 (Particulate Matter)
- PM2.5 (Fine Particulate Matter)
- Carbon Monoxide (CO)
- Nitrogen Dioxide (NO₂)
- Sulphur Dioxide (SO₂)
- Ozone (O₃)

## API Response Structure

```json
{
  "period": "48 hours",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "pollen": {
    "level": "moderate",
    "maxValue": 125.5,
    "types": {
      "grass": {
        "name": "Grass",
        "average": 75.2,
        "max": 125.5,
        "recentAverage": 98.3,
        "trend": "increasing"
      }
      // ... other pollen types
    },
    "dominantTypes": [
      { "type": "grass", "max": 125.5 },
      { "type": "birch", "max": 80.2 }
    ]
  },
  "airQuality": {
    "pm25": {
      "name": "PM2.5",
      "average": 12.5,
      "max": 25.3,
      "recentAverage": 15.8,
      "trend": "increasing"
    }
    // ... other metrics
  },
  "allergyRiskScore": {
    "score": 45,
    "level": "moderate"
  }
}
```

## Allergy Risk Calculation

The `allergyRiskScore` combines:

### Pollen Contribution (0-50 points)
- **none**: 0 points
- **low** (<50 grains/m³): 10 points
- **moderate** (50-150): 25 points
- **high** (150-1000): 40 points
- **very_high** (>1000): 50 points

### Air Quality Contribution (0-50 points)
Poor air quality exacerbates allergic reactions:
- PM2.5 > 35 µg/m³: +15 points
- PM10 > 50 µg/m³: +10 points
- Ozone > 100 µg/m³: +15 points
- NO₂ > 100 µg/m³: +10 points

### Final Risk Level
- **low**: < 20 points
- **moderate**: 20-40 points
- **high**: 40-70 points
- **very_high**: > 70 points

## Integration with Diagnosis

The environmental data is passed to Gemini Vision AI along with the eye photo for comprehensive analysis. The AI considers:

1. **Pollen Levels**: High grass pollen + bilateral red eyes → likely allergic conjunctivitis
2. **Air Quality**: Poor AQ can worsen eye irritation even without allergies
3. **Trending**: Rising pollen levels suggest worsening symptoms ahead
4. **Dominant Allergens**: Helps identify specific allergy triggers (e.g., "grass allergy")

## Endpoints

### POST `/analyze`
Main diagnostic endpoint - includes environmental data in response.

**Request:**
```bash
curl -X POST http://localhost:3001/analyze \
  -F "imageBase64=data:image/jpeg;base64,..." \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

**Response includes:**
```json
{
  "sicknessProbability": 25,
  "allergyProbability": 80,
  "symptoms": ["bilateral redness", "clear tearing"],
  "eyeAnalysis": "...",
  "environmental": { /* 48h data */ },
  "location": { "latitude": 37.7749, "longitude": -122.4194 },
  "timestamp": "2026-02-21T12:00:00.000Z"
}
```

### GET `/environmental?lat=X&lon=Y`
Test endpoint to fetch environmental data without diagnosis.

**Example:**
```bash
curl "http://localhost:3001/environmental?lat=37.7749&lon=-122.4194"
```

## Clinical Relevance

### Why 48 Hours?
- Allergic reactions can have delayed onset (12-24 hours after exposure)
- Cumulative pollen exposure matters for symptom severity
- Allows detection of trends (increasing vs. decreasing pollen)

### Safety Guardrails
The system flags high-risk scenarios:
- **Unilateral redness** → potential serious infection (not allergy)
- **Purulent discharge** → bacterial/viral infection
- **High pollen + bilateral symptoms** → likely allergic conjunctivitis

## FHIR R4 Compliance

Environmental data can be mapped to FHIR `Observation` resources with LOINC codes:
- **96093-4**: Pollen exposure
- **94758-3**: Air quality index
- **35200-5**: Allergen exposure

## Development

### Testing Locally
```bash
# Start the server
cd backend
npm install
npm start

# Test environmental endpoint (San Francisco)
curl "http://localhost:3001/environmental?lat=37.7749&lon=-122.4194"

# Test full analysis
curl -X POST http://localhost:3001/analyze \
  -F "imageBase64=$(base64 -i test_eye.jpg)" \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

### No API Key Required
Unlike the previous Google Pollen API, Open-Meteo requires no authentication. This simplifies deployment and removes API quota concerns.

## Future Enhancements

1. **Cache Environmental Data**: Reduce API calls by caching recent lookups
2. **Symptom Correlation**: Track if high pollen days correlate with worse symptoms
3. **Personalized Triggers**: Identify which specific pollens affect the user most
4. **Forecast Integration**: Combine historical data with forecasts for preventive advice
