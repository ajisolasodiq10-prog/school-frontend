// Keeps the short-lived access token and rotating refresh token in this browser tab.
// sessionStorage is used so a page refresh preserves the session, but closing the tab clears it.
const KEY = "schoolAuth.v1";
let memory = null;

function readStorage() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.token === "string" &&
      typeof parsed?.expiresAt === "number" &&
      (parsed.refreshToken === undefined || typeof parsed.refreshToken === "string")
    ) return parsed;
  } catch {
    // Storage blocked or corrupted: treat as signed out.
  }
  return null;
}

export function getStoredSession() {
  if (!memory) memory = readStorage();
  // Keep an expired access token only when a refresh token is available to renew the session.
  if (memory && memory.expiresAt <= Date.now() && !memory.refreshToken) {
    clearToken();
    return null;
  }
  return memory;
}

export function getToken() {
  const session = getStoredSession();
  return session && session.expiresAt > Date.now() ? session.token : null;
}

// accessTokenExpiresAt is an ISO date returned by the Account Management Backend.
export function setToken(token, accessTokenExpiresAt, refreshToken) {
  const expiresAt = typeof accessTokenExpiresAt === "number"
    ? accessTokenExpiresAt
    : Date.parse(accessTokenExpiresAt);

  if (!token || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw new Error("The account service returned an invalid or expired access token.");
  }

  memory = { token, expiresAt, refreshToken };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // The in-memory copy still works until the page is refreshed.
  }
}

export function clearToken() {
  memory = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}
