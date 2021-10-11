const Cookie = require_toughCookie.Cookie;
 
function formatCookie(cookie) {
  return {
    name: cookie.key || cookie.name,
    value: cookie.value,
    path: cookie.path || undefined, 
    domain: cookie.domain || undefined, 
    expires:
      cookie.expires === 'Infinity'
        ? undefined
        : dayjs(cookie.expires).toISOString(),
    httpOnly: cookie.httpOnly,
    secure: cookie.secure
  };
}

function parseCookie(cookieString) {
  let cookie = Cookie.parse(cookieString);
  if (!cookie) {
    return undefined;
  }

  return formatCookie(cookie);
}

function splitAndParse(header, divider) {
  return header
    .split(divider)
    .filter(Boolean)
    .map(parseCookie)
    .filter(Boolean);
}

var require_cookies = function () {
 return {
  parseRequestCookies(cookieHeader) {
    return splitAndParse(cookieHeader, ';');
  },
  parseResponseCookies(cookieHeader) {
    return splitAndParse(cookieHeader, '\n');
  },
  formatCookie
 } 
};
