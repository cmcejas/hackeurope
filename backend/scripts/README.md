# Model evaluation scripts

**How to run:** see the [root README](../../README.md#how-to-run-the-tests). Summary:

1. Start the backend: `cd backend && npm run dev`
2. Run: `npm run evaluate-model`

## What it does

- **`model-test-cases.js`** — Defines test cases: each has a `name`, `allergyHistory` (symptoms text), and `expected` criteria (e.g. `sicknessProbabilityRange`, `shouldSeeDoctor`, `severityOneOf`).
- **`evaluate-model.js`** — For each case, sends `POST /analyze` with a placeholder image and the case’s symptoms, then checks the response against `expected` and prints pass/fail and overall accuracy.

## Custom test image

Default is a minimal 1×1 JPEG. To use a real eye photo:

```bash
export TEST_IMAGE_BASE64="$(base64 -w0 path/to/eye.jpg)"
npm run evaluate-model
```

## Adding or changing cases

Edit **`model-test-cases.js`**. Expected criteria:

- `sicknessProbabilityRange: [min, max]`
- `allergyProbabilityRange: [min, max]` (optional)
- `shouldSeeDoctor: true | false` (optional)
- `severityOneOf: ['mild','moderate',...]` (optional)
- `allergyProbabilityLteSickness: true` (default) — enforces allergy ≤ sickness

Then run `npm run evaluate-model` again.
