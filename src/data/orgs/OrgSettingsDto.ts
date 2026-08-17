export interface OrgSettings {
  id: string;
  name: string;
  ownerId: string;
  totpRequired: boolean;
  /** Org-wide default IANA timezone (maintenance windows etc.). */
  defaultTimezone: string;
}

export interface UpdateOrgSettingsRequest {
  name?: string;
  totpRequired?: boolean;
  defaultTimezone?: string;
}
