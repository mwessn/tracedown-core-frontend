/** One API key row; `key` is the plaintext, present only in the create response. */
export interface ApiKeySummary {
  id: string;
  name: string;
  key?: string | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revoked: boolean;
  createdBy: string;
  createdAt: string;
}

/** Request of POST /apikeys. */
export interface CreateApiKeyRequest {
  name: string;
  expiresInDays?: number;
}
