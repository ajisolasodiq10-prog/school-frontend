// Earlier builds saved fictional sample data in this browser. Remove it once,
// so nothing fictional can reappear.
const LEGACY_PREFIXES = ["adminDemo.v1.", "teacherDemo.v1.", "schoolSettings.v1"];

export function purgeLegacySampleData() {
  try {
    Object.keys(localStorage)
      .filter((key) => LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix)))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage blocked: nothing was saved there.
  }
}
