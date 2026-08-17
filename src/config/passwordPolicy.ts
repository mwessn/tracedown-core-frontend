/**
 * Client-side mirror of the backend password policy.
 *
 * The authoritative rules live in the backend config (`api-gateway`'s
 * `security.conf`, `auth.passwordPolicy`, overridable via `PASSWORD_MIN_LENGTH`,
 * `PASSWORD_MIN_UPPERCASE`, `PASSWORD_MIN_DIGITS`, `PASSWORD_MIN_SPECIAL`). The
 * server always re-validates, so this copy is only for shaping inputs and hints —
 * it must be kept in sync with those defaults manually.
 */
interface PasswordPolicy {
  minLength: number;
  minUppercase: number;
  minDigits: number;
  minSpecial: number;
}

export const PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  minUppercase: 1,
  minDigits: 1,
  minSpecial: 1,
};

/** The policy rules, in the order they should be shown. */
export type PasswordRule = 'minLength' | 'minUppercase' | 'minDigits' | 'minSpecial';

/** How many of each character class a password is short by, per rule. */
interface PasswordViolation {
  rule: PasswordRule;
  /** The required minimum for the rule (for the "at least N" message). */
  required: number;
}

/**
 * Client-side clone of the backend `validatePassword` (api-gateway's
 * `PasswordValidator`). Returns the unmet rules so the form can block submission
 * and explain what is missing. The server re-validates and is authoritative; this
 * only spares the user a round-trip and must mirror the same checks.
 */
export function passwordViolations(
  password: string,
  policy: PasswordPolicy = PASSWORD_POLICY,
): PasswordViolation[] {
  const violations: PasswordViolation[] = [];
  const count = (test: (c: string) => boolean) => [...password].filter(test).length;

  if (password.length < policy.minLength) {
    violations.push({ rule: 'minLength', required: policy.minLength });
  }
  if (count(c => c !== c.toLowerCase() && c === c.toUpperCase()) < policy.minUppercase) {
    violations.push({ rule: 'minUppercase', required: policy.minUppercase });
  }
  if (count(c => c >= '0' && c <= '9') < policy.minDigits) {
    violations.push({ rule: 'minDigits', required: policy.minDigits });
  }
  // "Special" = anything that is not a letter or a digit, matching the backend's
  // `!it.isLetterOrDigit()`.
  if (count(c => !/[\p{L}\p{N}]/u.test(c)) < policy.minSpecial) {
    violations.push({ rule: 'minSpecial', required: policy.minSpecial });
  }
  return violations;
}
