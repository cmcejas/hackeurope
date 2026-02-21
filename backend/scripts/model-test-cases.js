/**
 * Test cases for Gemini model evaluation.
 * Each case has:
 *   - name: short label
 *   - allergyHistory: user-provided symptoms/history (fed into the prompt)
 *   - expected: criteria to check (all must pass for the case to be "correct")
 *
 * Expected criteria:
 *   - sicknessProbabilityRange: [min, max] inclusive
 *   - allergyProbabilityRange: [min, max] optional
 *   - shouldSeeDoctor: boolean (optional)
 *   - severityOneOf: string[] (optional) e.g. ['mild','moderate']
 *   - allergyProbabilityLteSickness: true to enforce allergy <= sickness (optional, default true)
 */

export const testCases = [
  {
    name: 'No symptoms',
    allergyHistory: 'No symptoms. Eyes feel fine.',
    expected: {
      sicknessProbabilityRange: [0, 30],
      shouldSeeDoctor: false,
      allergyProbabilityLteSickness: true,
    },
  },
  {
    name: 'Classic allergic conjunctivitis (bilateral, itching, seasonal)',
    allergyHistory: 'Both eyes red and itchy for 2 days. Worse when outside. Runny nose. Spring time. I have pollen allergy.',
    expected: {
      sicknessProbabilityRange: [40, 100],
      allergyProbabilityRange: [30, 100],
      severityOneOf: ['mild', 'moderate', 'severe'],
      allergyProbabilityLteSickness: true,
    },
  },
  {
    name: 'Unilateral red eye (should flag doctor)',
    allergyHistory: 'Only my left eye is red and painful. Some yellow discharge. Started yesterday.',
    expected: {
      sicknessProbabilityRange: [50, 100],
      shouldSeeDoctor: true,
      allergyProbabilityLteSickness: true,
    },
  },
  {
    name: 'Mild bilateral itching, no discharge',
    allergyHistory: 'Both eyes a bit itchy and watery. No pus or stickiness. Had hay fever before.',
    expected: {
      sicknessProbabilityRange: [20, 80],
      allergyProbabilityRange: [10, 90],
      shouldSeeDoctor: false,
      allergyProbabilityLteSickness: true,
    },
  },
  {
    name: 'Purulent discharge (should recommend doctor)',
    allergyHistory: 'Eye is red with yellow-green discharge that sticks lashes together. Worsened over 2 days.',
    expected: {
      sicknessProbabilityRange: [60, 100],
      shouldSeeDoctor: true,
      allergyProbabilityLteSickness: true,
    },
  },
  {
    name: 'Dry eyes only (low sickness)',
    allergyHistory: 'Eyes feel dry and tired from screen use. No redness or itching.',
    expected: {
      sicknessProbabilityRange: [0, 40],
      allergyProbabilityRange: [0, 30],
      shouldSeeDoctor: false,
      allergyProbabilityLteSickness: true,
    },
  },
  {
    name: 'High allergy context (pollen season, history)',
    allergyHistory: 'Seasonal allergies. Tree pollen high. Itchy eyes and sneezing. Bilateral.',
    expected: {
      sicknessProbabilityRange: [30, 100],
      allergyProbabilityRange: [20, 100],
      allergyProbabilityLteSickness: true,
    },
  },
];
