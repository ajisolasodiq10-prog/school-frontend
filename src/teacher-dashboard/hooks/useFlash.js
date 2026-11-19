import { useEffect, useState } from "react";

// A message that appears after an action ("Draft saved") and fades away.
// flash = { message, tone: "success" | "error" } or null.
export default function useFlash(duration = 8000) {
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => setFlash(null), duration);
    return () => clearTimeout(timer);
  }, [flash, duration]);

  return [flash, setFlash];
}
