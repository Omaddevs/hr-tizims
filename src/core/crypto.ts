/** Demo password hashing. Production must use bcrypt/argon2 on the server. */
export function hashPassword(plain: string): string {
  const salted = `tizims.uz:v1:${plain}`;
  let h = 2166136261;
  for (let i = 0; i < salted.length; i++) {
    h ^= salted.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a_${(h >>> 0).toString(16)}`;
}

export function verifyPassword(plain: string, passwordHash: string) {
  return hashPassword(plain) === passwordHash;
}
