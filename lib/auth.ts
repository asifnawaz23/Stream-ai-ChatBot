/**
 * Client-side demo auth backed by localStorage. NOTE: this is a frontend-only
 * demo — credentials are stored in plain text in the browser and are never
 * sent to a server. Do not use this pattern for real authentication.
 */

const USER_KEY = "streamai.user";
const USERS_KEY = "streamai.users";

export interface AuthUser {
  name: string;
  loginAt: number;
}

interface StoredUser {
  name: string;
  password: string;
}

export type AuthResult = { ok: true } | { ok: false; error: string };

function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (user): user is StoredUser =>
            typeof user?.name === "string" && typeof user?.password === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Storage full or unavailable — fail silently.
  }
}

/** Register a new account. Fails if the username is already taken. */
export function signup(name: string, password: string): AuthResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Username is required." };
  if (!password) return { ok: false, error: "Password is required." };
  const users = getUsers();
  if (users.some((user) => user.name.toLowerCase() === trimmed.toLowerCase())) {
    return { ok: false, error: "That username is taken — try logging in." };
  }
  saveUsers([...users, { name: trimmed, password }]);
  return { ok: true };
}

/** Validate credentials against the registered accounts. */
export function login(name: string, password: string): AuthResult {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Username is required." };
  if (!password) return { ok: false, error: "Password is required." };
  const user = getUsers().find(
    (candidate) => candidate.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (!user) {
    return { ok: false, error: "No account with that username — sign up first." };
  }
  if (user.password !== password) {
    return { ok: false, error: "Incorrect password." };
  }
  return { ok: true };
}

export function setUser(name: string): void {
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ name, loginAt: Date.now() } satisfies AuthUser),
  );
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return typeof parsed?.name === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}
