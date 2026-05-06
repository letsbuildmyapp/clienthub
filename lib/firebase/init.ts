// Firebase init with mock fallback. If env vars are present, this would wire up
// the real SDK; for the demo we run entirely on the in-memory mock so prospects
// can clone and `npm run dev` with zero config. The mock persists to localStorage.

export const usingMock = (() => {
  if (typeof process === "undefined") return true;
  return !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
})();
