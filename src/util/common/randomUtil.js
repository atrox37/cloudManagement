export function randomIds(ids) {
  const exists = new Set(Array.isArray(ids) ? ids : []);
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let minLen = 1;
  let maxLen = 5;
  const maxAttempts = 1000;

  while (true) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
      let candidate = "";
      for (let i = 0; i < len; i++) {
        candidate += chars[Math.floor(Math.random() * chars.length)];
      }
      if (!exists.has(candidate)) {
        return candidate;
      }
    }
    minLen = maxLen + 1;
    maxLen++;
  }
}
