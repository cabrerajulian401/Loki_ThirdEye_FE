export function createLocalStorageService() {
  const k = (key) => `scout:${key}`;
  return {
    get(key) {
      try {
        const raw = localStorage.getItem(k(key));
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      localStorage.setItem(k(key), JSON.stringify(value));
    },
    remove(key) {
      localStorage.removeItem(k(key));
    },
  };
}
