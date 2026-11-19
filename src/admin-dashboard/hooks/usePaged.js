import { useEffect, useState } from "react";

// Shows a long list a page at a time ("Show more"). Pass something that
// changes whenever the filters change (resetKey) to go back to the first page.
export default function usePaged(items, resetKey, size = 25) {
  const [count, setCount] = useState(size);
  useEffect(() => {
    setCount(size);
  }, [resetKey, size]);
  return {
    visible: items.slice(0, count),
    remaining: Math.max(0, items.length - count),
    showMore: () => setCount((c) => c + size),
  };
}
