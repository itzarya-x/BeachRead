function buildUsernameFallback(email: string): string {
  return email.split('@')[0] || 'beachreader';
}

export function normalizeUsername(value: string, emailFallback = 'beachreader'): string {
  const fallback = buildUsernameFallback(emailFallback);
  const cleaned = (value.trim().toLowerCase() || fallback)
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .replace(/-{2,}/g, '-');

  const sliced = cleaned.slice(0, 30).replace(/[._-]+$/g, '');
  if (sliced.length >= 3) return sliced;

  return `${fallback.replace(/[^a-z0-9]+/g, '').slice(0, 24) || 'beachreader'}-id`;
}
