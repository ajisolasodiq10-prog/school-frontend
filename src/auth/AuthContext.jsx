import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, setSessionEndedHandler } from "../api/client.js";
import { clearToken, getStoredSession, setToken } from "../api/tokenStore.js";
import { loginRequest, logoutRequest, meRequest, refreshRequest } from "./authService.js";
import { ROLE_LABEL } from "./roles.js";

const AuthContext = createContext(null);
const MAX_TIMER = 2 ** 31 - 1;
const REFRESH_EARLY_MS = 60_000;

const SESSION_MESSAGES = {
  TOKEN_EXPIRED: "Your session has expired. Please log in again.",
  TOKEN_REVOKED: "Your session has ended. Please log in again.",
  TOKEN_INVALID: "Your session is no longer valid. Please log in again.",
  AUTH_REQUIRED: "Please log in to continue.",
  ACCOUNT_INACTIVE: "This account is not active. Please contact your school administrator.",
  ACCOUNT_NOT_ACTIVATED: "This account has not been activated yet. Please contact your school administrator.",
  SCHOOL_INACTIVE: "This school account is not active.",
};

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => ({
    status: getStoredSession() ? "loading" : "unauthenticated",
    user: null,
    profile: null,
    notice: "",
    error: "",
  }));
  const expiryTimer = useRef(null);

  const clearLocal = useCallback((notice = "") => {
    clearTimeout(expiryTimer.current);
    clearToken();
    setState({ status: "unauthenticated", user: null, profile: null, notice, error: "" });
  }, []);

  // Exchange the rotating refresh token for a new short-lived access token.
  const renewSession = useCallback(async (session) => {
    if (!session?.refreshToken) {
      throw new ApiError("Your session has expired. Please log in again.", { status: 401, code: "TOKEN_EXPIRED" });
    }
    const tokens = await refreshRequest(session.refreshToken);
    setToken(tokens.accessToken, tokens.accessTokenExpiresAt, tokens.refreshToken);
    return getStoredSession();
  }, []);

  // Refresh one minute before access-token expiry. The refresh token rotates on every use.
  const watchExpiry = useCallback((session) => {
    clearTimeout(expiryTimer.current);
    if (!session) return;
    const wait = Math.min(Math.max(session.expiresAt - Date.now() - REFRESH_EARLY_MS, 0), MAX_TIMER);
    expiryTimer.current = setTimeout(async () => {
      const current = getStoredSession();
      if (!current) {
        clearLocal(SESSION_MESSAGES.TOKEN_EXPIRED);
        return;
      }
      try {
        const renewed = await renewSession(current);
        watchExpiry(renewed);
      } catch (error) {
        if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
          setState((s) => ({ ...s, status: "error", error: "Could not renew your session because the account service is unavailable. Check the connection and retry." }));
        } else {
          clearLocal(SESSION_MESSAGES[error?.code] || "Your session has ended. Please log in again.");
        }
      }
    }, wait);
  }, [clearLocal, renewSession]);

  useEffect(() => {
    setSessionEndedHandler((error) => clearLocal(SESSION_MESSAGES[error.code] || error.message));
    return () => setSessionEndedHandler(null);
  }, [clearLocal]);

  // Restore after refresh/reload. If the access token expired while the tab was asleep,
  // renew it first using the saved refresh token.
  const restore = useCallback(async () => {
    let session = getStoredSession();
    if (!session) {
      setState((s) => ({ ...s, status: "unauthenticated" }));
      return;
    }
    setState((s) => ({ ...s, status: "loading", error: "" }));
    try {
      if (session.expiresAt <= Date.now() + REFRESH_EARLY_MS) {
        session = await renewSession(session);
      }
      const { user, profile } = await meRequest(session.token);
      watchExpiry(getStoredSession());
      setState({ status: "authenticated", user, profile, notice: "", error: "" });
    } catch (error) {
      if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
        setState((s) => ({ ...s, status: "error", error: error.message }));
      } else if (getStoredSession()) {
        clearLocal(SESSION_MESSAGES[error?.code] || error.message);
      }
    }
  }, [clearLocal, renewSession, watchExpiry]);

  useEffect(() => {
    restore();
    return () => clearTimeout(expiryTimer.current);
  }, [restore]);

  const login = useCallback(async (identifier, password, expectedRole) => {
    const tokens = await loginRequest(identifier, password);
    const { accessToken, accessTokenExpiresAt, refreshToken } = tokens || {};

    if (!accessToken || !accessTokenExpiresAt || !refreshToken) {
      throw new ApiError("The account service returned an incomplete sign-in response.", { code: "BAD_RESPONSE" });
    }

    setToken(accessToken, accessTokenExpiresAt, refreshToken);
    try {
      // The School Backend supplies the authoritative role/profile for this account.
      const { user, profile } = await meRequest(accessToken);
      if (user?.role !== expectedRole) {
        const own = ROLE_LABEL[user?.role] || "different";
        throw new ApiError(
          `These details belong to ${own === "administrator" ? "an" : "a"} ${own} account, not a ${ROLE_LABEL[expectedRole]} account. Please use the correct login page.`,
          { status: 403, code: "WRONG_PORTAL" }
        );
      }
      watchExpiry(getStoredSession());
      setState({ status: "authenticated", user, profile, notice: "", error: "" });
      return user;
    } catch (error) {
      clearToken();
      logoutRequest(refreshToken).catch(() => {});
      throw error;
    }
  }, [watchExpiry]);

  const logout = useCallback(async () => {
    const session = getStoredSession();
    clearLocal();
    if (!session?.refreshToken) return { serverRevoked: true };
    try {
      await logoutRequest(session.refreshToken);
      return { serverRevoked: true };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return { serverRevoked: true };
      setState((s) => ({
        ...s,
        notice: "You are signed out on this device. We could not reach the account service to end the session there, so it will end when its refresh token expires.",
      }));
      return { serverRevoked: false };
    }
  }, [clearLocal]);

  const dismissNotice = useCallback(() => setState((s) => ({ ...s, notice: "" })), []);

  const value = useMemo(() => ({
    status: state.status,
    user: state.user,
    profile: state.profile,
    role: state.user?.role ?? null,
    notice: state.notice,
    error: state.error,
    isAuthenticated: state.status === "authenticated",
    hasRole: (role) => state.status === "authenticated" && state.user?.role === role,
    login, logout, retry: restore, dismissNotice,
  }), [state, login, logout, restore, dismissNotice]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
