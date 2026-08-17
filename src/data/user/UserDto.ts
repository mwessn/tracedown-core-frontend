
export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  totpEnabled: boolean;
  selectedOrgId: string | null;
}

/**
 * Response of GET /me/export — the versioned personal data export envelope.
 * Section contents are downloaded verbatim, so they stay untyped here.
 */
export interface UserDataExport {
  exportVersion: number;
  generatedAt: string;
  [section: string]: unknown;
}
