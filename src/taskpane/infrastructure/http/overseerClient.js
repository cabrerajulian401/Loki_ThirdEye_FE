import { ok, err, CODES } from "../../application/result";

function codeForStatus(status) {
  if (status === 401) return CODES.AUTH_EXPIRED;
  if (status === 404) return CODES.NOT_FOUND;
  if (status === 409) return CODES.CONFLICT;
  if (status === 400) return CODES.BAD_REQUEST;
  if (status >= 500) return CODES.UPSTREAM;
  return CODES.BAD_REQUEST;
}

/**
 * @param {{baseUrl: string, getToken: () => string|null}} deps
 */
export function createOverseerClient({ baseUrl, getToken }) {
  async function request(method, path, body) {
    const headers = { Authorization: `Bearer ${getToken()}` };
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let res;
    try {
      res = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
    } catch (e) {
      return err(CODES.NETWORK, e.message);
    }

    if (!res.ok) {
      return err(codeForStatus(res.status), `${method} ${path} failed with ${res.status}`);
    }

    try {
      const data = await res.json();
      return ok(data);
    } catch (e) {
      return ok({});
    }
  }

  return {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    patch: (path, body) => request("PATCH", path, body),
  };
}
