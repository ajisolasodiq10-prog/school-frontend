// Shared API client. Uses the browser's native fetch.
//
// - Base URL comes from VITE_API_BASE_URL (see .env.example).
// - Protected requests send "Authorization: Bearer <token>".
// - Every failure becomes an ApiError with a safe, readable message.
// - When the backend says the session is over (expired, revoked, invalid, account or
//   school deactivated) the handler registered with setSessionEndedHandler() runs.
// - Passwords and tokens are never logged.
import { getToken } from "./tokenStore.js";

const RAW_BASE = import.meta.env?.VITE_API_BASE_URL ?? "";
const RAW_ACCOUNT_BASE = import.meta.env?.VITE_ACCOUNT_API_BASE_URL ?? "";
export const API_BASE_URL = String(RAW_BASE).trim().replace(/\/+$/, "");
// Account Management serves its browser endpoints under /api/v1; the suffix is added when missing.
const accountBase = String(RAW_ACCOUNT_BASE).trim().replace(/\/+$/, "");
export const ACCOUNT_API_BASE_URL = accountBase && !/\/api\/v1$/i.test(accountBase) ? `${accountBase}/api/v1` : accountBase;
const TIMEOUT_MS = 15000;

// Backend error codes (see the backend's authenticate middleware and auth service).
export const SESSION_ENDED_CODES = new Set([
  "AUTH_REQUIRED",
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "TOKEN_REVOKED",
  "ACCOUNT_INACTIVE",
  "ACCOUNT_NOT_ACTIVATED",
  "SCHOOL_INACTIVE",
]);

export class ApiError extends Error {
  constructor(message, { status = 0, code = "UNKNOWN", details, retryAfter } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

let sessionEndedHandler = null;
export function setSessionEndedHandler(fn) {
  sessionEndedHandler = fn;
}

function buildUrl(baseUrl, path, query) {
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.append(key, String(value));
  });
  const text = params.toString();
  return text ? `${url}?${text}` : url;
}

// The backend's own messages are written for people, so 4xx messages are shown as they are.
// For 5xx the message is replaced so nothing about the server leaks to the screen.
function toApiError(response, body) {
  const status = response.status;
  if (status >= 500) {
    return new ApiError("The server had a problem. Please try again in a moment.", { status, code: body?.code || "SERVER_ERROR" });
  }
  const retry = Number(response.headers.get("Retry-After"));
  return new ApiError(typeof body?.message === "string" && body.message ? body.message : "The request could not be completed.", {
    status,
    code: body?.code || "REQUEST_FAILED",
    details: body?.details,
    retryAfter: Number.isFinite(retry) && retry > 0 ? retry : undefined,
  });
}

// options: { body, query, auth = true, token, signal }
//   auth:false  -> no Authorization header (login)
//   token       -> use this token instead of the stored one (logout after local sign-out)
export async function request(method, path, options = {}) {
  const { body, query, auth = true, token, signal, baseUrl } = options;
  const requestBaseUrl = String(baseUrl ?? API_BASE_URL).trim().replace(/\/+$/, "");
  // The school backend serves everything under /api. Callers may write "/students" or
  // "/api/students"; the prefix is added when it is missing. (Requests to another server, such
  // as the account service, pass their own baseUrl and are left alone.)
  if (baseUrl === undefined && !/^\/api(\/|$)/.test(path)) path = `/api${path.startsWith("/") ? "" : "/"}${path}`;

  if (!requestBaseUrl) {
    throw new ApiError("The app is not connected to a server. Set VITE_API_BASE_URL (see .env.example).", { code: "CONFIG_ERROR" });
  }

  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const bearer = auth ? token ?? getToken() : null;
  if (auth && !bearer) {
    throw new ApiError("Authentication required.", { status: 401, code: "AUTH_REQUIRED" });
  }
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort(), { once: true });

  let response;
  try {
    response = await fetch(buildUrl(requestBaseUrl, path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your internet connection and try again.", { code: "NETWORK_ERROR" });
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  const text = await response.text().catch(() => "");
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const error = toApiError(response, data);
    // Only a request that carried the stored token can end the stored session.
    if (auth && token === undefined && SESSION_ENDED_CODES.has(error.code)) sessionEndedHandler?.(error);
    throw error;
  }
  if (text && data === null) {
    throw new ApiError("The server sent a response the app could not read.", { status: response.status, code: "BAD_RESPONSE" });
  }
  return data;
}

export const get = (path, options) => request("GET", path, options);
export const post = (path, body, options) => request("POST", path, { ...options, body });
export const patch = (path, body, options) => request("PATCH", path, { ...options, body });
export const put = (path, body, options) => request("PUT", path, { ...options, body });
export const del = (path, options) => request("DELETE", path, options);
