// Lightweight AniList OAuth (implicit grant) helpers for personal use.
// No backend/session needed — the access token lives in the browser's
// localStorage, same as any other client-only personal tool.

const TOKEN_KEY = "anilistAccessToken";
const ANILIST_URL = "https://graphql.anilist.co";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getAuthorizeUrl() {
  const clientId = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID;
  if (!clientId) return null;
  const redirectUri = `${window.location.origin}/auth-callback`;
  return `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token`;
}

export async function anilistAuthed(query, variables) {
  const token = getToken();
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "AniList error");
  return json.data;
}

export const SAVE_ENTRY_MUTATION = `
  mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int) {
    SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress) {
      id
      status
      progress
    }
  }
`;

export const VIEWER_QUERY = `
  query {
    Viewer { id name }
  }
`;
