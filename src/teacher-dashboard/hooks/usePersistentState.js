import { useEffect, useState } from "react";

// Like useState, but the value is also kept in local storage so changes
// survive a page refresh. Only non-sensitive data should go through here.
export default function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // Ignore unreadable or blocked storage and fall back to the default value.
    }
    return typeof initialValue === "function" ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage full or blocked: changes last until refresh.
    }
  }, [key, state]);

  return [state, setState];
}
