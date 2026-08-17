/** One org domain (GET /domains). */
export interface DomainSummary {
  id: string;
  domain: string;
  challenge: string;
  verificationType: string;
  status: string;
  verifiedAt: string | null;
  wildcardEnabled: boolean;
  exceptions: string[];
  lastCheckedAt: string | null;
  /** Previously verified but the token disappeared — unverified limits apply. */
  lapsed: boolean;
}

/** Request of POST /domains. */
export interface CreateDomainRequest {
  domain: string;
  verificationType?: string;
  wildcardEnabled?: boolean;
}

/** Response of POST /domains/{id}/verify. */
export interface VerifyDomainResponse {
  verified: boolean;
  status: string;
  error?: string | null;
}
