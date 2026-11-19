// Authentication is split across two backends:
// - Account Management signs in, refreshes and revokes sessions.
// - School Management verifies access tokens and returns the school-side user/profile.
import { ACCOUNT_API_BASE_URL, get, post } from "../api/client.js";

const SCHOOL_CODE = String(import.meta.env?.VITE_SCHOOL_CODE ?? "").trim();

function requireAccountApi() {
  if (!ACCOUNT_API_BASE_URL) {
    throw new Error("Account service is not configured. Set VITE_ACCOUNT_API_BASE_URL in the frontend .env file.");
  }
}

export async function loginRequest(identifier, password) {
  requireAccountApi();
  const body = { identifier, password };
  if (SCHOOL_CODE) body.schoolCode = SCHOOL_CODE;

  // Account Management: POST /api/v1/auth/login
  const res = await post("/auth/login", body, {
    auth: false,
    baseUrl: ACCOUNT_API_BASE_URL,
  });
  return res.data;
}

// School Management resolves the trusted role and profile from its own user records.
export async function meRequest(token) {
  const res = await get("/api/auth/me", token ? { token } : undefined);
  return res.data;
}

export async function refreshRequest(refreshToken) {
  requireAccountApi();
  const res = await post("/auth/refresh", { refreshToken }, {
    auth: false,
    baseUrl: ACCOUNT_API_BASE_URL,
  });
  return res.data;
}

export async function logoutRequest(refreshToken) {
  if (!refreshToken) return;
  requireAccountApi();
  await post("/auth/logout", { refreshToken }, {
    auth: false,
    baseUrl: ACCOUNT_API_BASE_URL,
  });
}
