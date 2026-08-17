export interface SilenceSummary {
  id: string;
  orgUserId: string;
  workspaceId: string | null;
  projectId: string | null;
  serviceId: string | null;
  channel: string;
  config: string | null;
  quietHours: string | null;
  /** Display name of the most specific silenced scope (null when scopeless). */
  resourceName: string | null;
}

/** Request of PATCH /silences/{id}. */
export interface UpdateSilenceRequest {
  channel?: string;
  config?: string;
  quietHours?: string;
}

export interface CreateSilenceRequest {
  channel: string;
  workspaceId?: string;
  projectId?: string;
  serviceId?: string;
  quietHours?: string;
}
