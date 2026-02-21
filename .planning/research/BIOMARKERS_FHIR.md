# Research: Biomarkers & FHIR Mapping

## Ocular Biomarkers (SNOMED-CT)
- **Allergic Conjunctivitis:** `403434009` (Atopic keratoconjunctivitis)
- **Viral Conjunctivitis:** `15680521000119104` (Conjunctivitis of eye caused by virus)
- **General Conjunctivitis:** `900000000000003001`

## Vocal Biomarkers (SNOMED-CT)
- **Hypernasality:** `Hypernasal voice` (Concept name)
- **ICD-10-CM:** `R49.21`

## FHIR R4 Resource Mapping
- **Diagnostic Result:** `Observation` resource.
  - `code`: SNOMED code for the finding (e.g., Hypernasality).
  - `value`: Nasality score or presence/absence.
- **Allergy Status:** `AllergyIntolerance` resource.
  - `code`: Specific allergen or general allergy category.
  - `manifestation`: Link to `Observation` of eye/voice symptoms.

## Clinical Logic
- **Unilateral Redness:** Strong indicator of infection (Viral/Bacterial) -> Red Flag.
- **Bilateral Redness + Tearing:** High correlation with Allergic Conjunctivitis.
- **Pollen Correlation:** If symptoms align with 48h historical pollen spikes, increase Allergy confidence.
