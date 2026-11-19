// ---------------------------------------------------------------------------
// SCORING STRUCTURE
// The numbers come from the School Settings page in the Admin Dashboard (saved in the school
// database, 40 / 60 by default). They are updated when the dashboard loads the settings, so
// the values below always match what the administrator saved.
// ---------------------------------------------------------------------------
import { subscribeToSettings } from "../../config/schoolSettings.js";

export let CA_MAX = 40;
export let EXAM_MAX = 60;
export let TOTAL_MAX = CA_MAX + EXAM_MAX;
// Grade bands, as a percentage of TOTAL_MAX. Highest grade first.
export let gradeBands = [];

subscribeToSettings((settings) => {
  CA_MAX = settings.caMax;
  EXAM_MAX = settings.examMax;
  TOTAL_MAX = CA_MAX + EXAM_MAX;
  gradeBands = settings.gradeBands.map(({ grade, min }) => ({ grade, min }));
});

export const TERMS = ["First Term", "Second Term", "Third Term"];
