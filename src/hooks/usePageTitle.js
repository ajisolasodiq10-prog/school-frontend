import { useEffect } from "react";
import { school } from "../config/siteConfig.js";

// Sets the browser tab title, e.g. "About Us | [School Name]".
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${school.shortName}` : school.name;
  }, [title]);
}
