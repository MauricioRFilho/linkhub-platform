/** Reserved usernames that conflict with app routes */
const RESERVED_USERNAMES = new Set([
  "admin", "api", "app", "auth", "billing",
  "blog", "callback", "cdn", "dashboard", "docs",
  "help", "login", "logout", "register", "settings",
  "signup", "status", "support", "terms", "privacy",
  "about", "contact", "pricing", "legal", "null",
  "undefined", "root", "system", "www", "mail",
]);

/** Username validation regex: 3-30 chars, alphanumeric + hyphens/underscores */
const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

/**
 * Validates a username against format rules and reserved words.
 * @returns Error message or null if valid
 */
export function validateUsername(username: string): string | null {
  const normalized = username.toLowerCase().trim();

  if (normalized.length < 3) {
    return "Nome de usuário deve ter pelo menos 3 caracteres.";
  }

  if (normalized.length > 30) {
    return "Nome de usuário deve ter no máximo 30 caracteres.";
  }

  if (!USERNAME_REGEX.test(normalized)) {
    return "Use apenas letras minúsculas, números, hifens e underscores. Deve começar e terminar com letra ou número.";
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return "Este nome de usuário não está disponível.";
  }

  return null;
}

/** Normalizes username input to lowercase, trimmed */
export function normalizeUsername(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, "-");
}
