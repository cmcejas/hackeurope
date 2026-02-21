# Google Pollen API Integration

## Overview

The backend now uses **Google's Pollen API** to provide comprehensive pollen forecast data for allergy diagnosis. This replaces the previous Open-Meteo implementation.

## Why Google Pollen API?

1. **Reliability**: Google's infrastructure ensures high availability
2. **Comprehensive Coverage**: Global coverage with localized pollen data
3. **Plant-Specific Data**: Identifies specific plants contributing to pollen (e.g., "Oak", "Ragweed")
4. **Forecast Data**: Provides multi-day forecasts (up to 5 days)
5. **UPI Standard**: Uses Universal Pollen Index (0-5 scale) - industry standard

## API Key Setup

### 1. Enable the API
1. Go to [Google Cloud Console - Pollen API](https://console.cloud.google.com/apis/library/pollen.googleapis.com)
2. Click "Enable"

### 2. Create Credentials
1. Navigate to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "API Key"
3. Copy the API key
4. (Recommended) Restrict the key to "Pollen API" only

### 3. Configure Environment
Add to your `.env` file:
```bash
GOOGLE_POLLEN_API_KEY=your_actual_api_key_here
```

## Data Provided

### Pollen Types
- **Tree pollen** - Includes oak, birch, maple, etc.
- **Grass pollen** - Common grasses
- **Weed pollen** - Ragweed, mugwort, etc.

### Universal Pollen Index (UPI)
- **0-1**: None
- **1-2**: Very Low / Low
- **2-3**: Moderate
- **3-4**: High
- **4-5**: Very High

### Plant Information
When plants are in season, the API provides:
- Plant display name (e.g., "Oak", "Ragweed")
- Plant type (tree, grass, weed)
- Current pollen index for that specific plant
- Season status

## API Response Structure

```json
{
  "source": "Google Pollen API",
  "period": "5 days",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "regionCode": "US",
  "pollen": {
    "level": "moderate",
    "maxIndex": 2.5,
    "types": {
      "tree": {
        "name": "Tree",
        "currentLevel": "MODERATE",
        "maxIndex": 2.5,
        "forecast": ["MODERATE", "MODERATE", "HIGH", "HIGH", "MODERATE"]
      },
      "grass": {
        "name": "Grass",
        "currentLevel": "LOW",
        "maxIndex": 1.5,
        "forecast": ["LOW", "LOW", "MODERATE", "MODERATE", "LOW"]
      },
      "weed": {
        "name": "Weed",
        "currentLevel": "NONE",
        "maxIndex": 0,
        "forecast": ["NONE", "NONE", "NONE", "NONE", "NONE"]
      }
    },
    "dominantTypes": [
      {
        "type": "Tree",
        "level": "MODERATE",
        "index": 2.5,
        "date": "2026-02-21"
      }
    ],
    "plantsInSeason": [
      {
        "name": "Oak",
        "type": "TREE",
        "level": "MODERATE",
        "index": 2.5
      },
      {
        "name": "Birch",
        "type": "TREE",
        "level": "LOW",
        "index": 1.8
      }
    ]
  },
  "allergyRiskScore": {
    "score": 50,
    "level": "moderate",
    "note": "Based on pollen levels only"
  }
}
```

## Allergy Risk Calculation

The system converts Google's UPI (0-5) to a risk score (0-100):

### UPI to Score Conversion
- **UPI 0-1 (None)**: 0 points → Score 0
- **UPI 1-2 (Low)**: 10 points → Score 20
- **UPI 2-3 (Moderate)**: 25 points → Score 50
- **UPI 3-4 (High)**: 40 points → Score 80
- **UPI 4-5 (Very High)**: 50 points → Score 100

### Risk Levels
- **low** (< 20): Minimal allergy risk
- **moderate** (20-40): Watch symptoms
- **high** (40-70): Strong allergy trigger
- **very_high** (> 70): Severe allergy risk

**Note**: Unlike Open-Meteo, Google Pollen API doesn't provide air quality data, so the score is purely pollen-based.

## Integration with Diagnosis

The pollen data is passed to Gemini Vision AI for comprehensive analysis:

### Example Clinical Interpretation

**Scenario 1: High Tree Pollen + Bilateral Symptoms**
```
Pollen: Tree (HIGH, Oak 4.2/5) + Grass (LOW)
Eyes: Bilateral redness, clear tearing
→ Diagnosis: Likely allergic conjunctivitis from tree pollen (Oak)
→ Recommendation: Antihistamine eye drops, avoid outdoor activities
```

**Scenario 2: Low Pollen + Unilateral Symptoms**
```
Pollen: All types (NONE)
Eyes: Unilateral redness, purulent discharge
→ Diagnosis: NOT allergy - likely bacterial infection
→ Recommendation: See doctor immediately
```

## Endpoints

### GET `/pollen?lat=X&lon=Y`
Fetch Google Pollen API data for a location.

**Example:**
```bash
curl "http://localhost:3001/pollen?lat=37.7749&lon=-122.4194"
```

### GET `/environmental?lat=X&lon=Y`
Legacy endpoint - redirects to `/pollen` for backwards compatibility.

### POST `/analyze`
Full diagnostic analysis with pollen context.

**Response includes:**
```json
{
  "allergyProbability": 75,
  "environmental": {
    "source": "Google Pollen API",
    "pollen": {
      "level": "high",
      "plantsInSeason": [...]
    }
  }
}
```

## Advantages Over Open-Meteo

| Feature | Google Pollen API | Open-Meteo |
|---------|-------------------|------------|
| **Coverage** | Global | Limited regions |
| **Plant Details** | ✅ Specific plants | ❌ Generic types |
| **Reliability** | ✅ Google infrastructure | ⚠️ DNS issues observed |
| **Forecast** | ✅ 5 days | ❌ Historical only |
| **UPI Standard** | ✅ Industry standard | ❌ Raw grains/m³ |
| **API Key** | Required (free tier available) | Not required |
| **Air Quality** | ❌ Not included | ✅ Included |

## Testing

### Live Test (San Francisco - Winter)
```bash
curl "http://localhost:3001/pollen?lat=37.7749&lon=-122.4194"
# Expected: Low pollen (winter season)
```

### Live Test (Los Angeles - Spring)
```bash
curl "http://localhost:3001/pollen?lat=34.0522&lon=-118.2437"
# Expected: Higher pollen if tested in spring
```

### Test with Full Analysis
```bash
curl -X POST http://localhost:3001/analyze \
  -F "imageBase64=data:image/jpeg;base64,..." \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194"
```

## Seasonal Patterns

### Winter (Dec-Feb)
- Tree: Low/None
- Grass: None
- Weed: None
- **Best time for allergy sufferers**

### Spring (Mar-May)
- Tree: **HIGH** (Oak, Birch, Maple)
- Grass: Moderate-High
- Weed: Low
- **Worst time for tree pollen allergies**

### Summer (Jun-Aug)
- Tree: Low
- Grass: **HIGH**
- Weed: Moderate
- **Worst time for grass allergies**

### Fall (Sep-Nov)
- Tree: Low
- Grass: Low-Moderate
- Weed: **HIGH** (Ragweed)
- **Worst time for ragweed allergies**

## API Limits & Pricing

- **Free Tier**: Check current Google Cloud pricing
- **Rate Limits**: Standard Google API limits apply
- **Cost**: Typically $X per 1000 requests (check latest pricing)

## FHIR R4 Mapping

Pollen data maps to FHIR `Observation` resources:

```json
{
  "resourceType": "Observation",
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "96093-4",
      "display": "Pollen exposure"
    }]
  },
  "valueQuantity": {
    "value": 2.5,
    "unit": "UPI",
    "system": "http://unitsofmeasure.org",
    "code": "{index}"
  },
  "component": [
    {
      "code": {
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "256259004",
          "display": "Pollen"
        }]
      },
      "valueCodeableConcept": {
        "text": "Oak (Tree pollen)"
      }
    }
  ]
}
```

## Troubleshooting

**API Key Not Working:**
- Verify the API is enabled in Google Cloud Console
- Check API key restrictions aren't blocking requests
- Ensure billing is enabled (required even for free tier)

**No Plant Data:**
- Plants are only shown when "in season" and at moderate+ levels
- Winter months typically show no plants in season

**"Pollen API key not configured":**
- Create `.env` file from `.env.example`
- Restart the server after adding the key

## Next Steps

1. **Caching**: Implement Redis cache to reduce API costs
2. **Personalization**: Track which plants trigger user's symptoms
3. **Alerts**: Notify users when pollen levels spike
4. **Historical Tracking**: Log pollen levels over time for correlation analysis
