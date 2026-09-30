const tokenCookieName = "auth_token";
const tokenLifetimeMs = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

export function setAuthCookie(res, token) {
  res.cookie(tokenCookieName, token, {
    ...cookieOptions(),
    maxAge: tokenLifetimeMs,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(tokenCookieName, cookieOptions());
}
