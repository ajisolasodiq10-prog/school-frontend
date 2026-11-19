import { useEffect, useState } from "react";
import { loadPublicNews } from "../api/publicApi.js";

// The news and events shown on the public website (public announcements from the database).
// While loading, or if the school server cannot be reached, the list is empty and the page shows
// its "no news yet" message.
export default function usePublicNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    loadPublicNews()
      .then((items) => { if (!cancelled) setNews(items); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return { news, loading };
}
