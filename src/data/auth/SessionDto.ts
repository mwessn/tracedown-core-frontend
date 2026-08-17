/** One active login session for the current user. */
export interface SessionSummary {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  /** True for the session making the request — it cannot be revoked here. */
  current: boolean;
}

/** Response of DELETE /auth/sessions (revoke all others). */
export interface RevokedCount {
  revoked: number;
}
