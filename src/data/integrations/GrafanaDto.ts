/** Scrape scope within the project: all services (default) or a subset. */
export interface GrafanaScopeConfig {
  type: string;
  ids?: string[] | null;
}

export interface GrafanaIntegrationSummary {
  id: string;
  projectId: string;
  name: string;
  /** Bearer token — only present on create / regenerate responses. */
  token?: string | null;
  scope: GrafanaScopeConfig | null;
  labels: Record<string, string> | null;
  enabled: boolean;
  createdAt: string;
  /** Path of the Prometheus scrape endpoint on the metrics service. */
  scrapePath: string;
  /** Full scrape URL when the platform advertises a metrics base URL. */
  scrapeUrl?: string | null;
}

/** GET wrapper — a project without an integration returns `integration: null`. */
export interface GrafanaIntegrationState {
  integration: GrafanaIntegrationSummary | null;
}

export interface UpdateGrafanaIntegrationRequest {
  name?: string;
  scope?: GrafanaScopeConfig;
  labels?: Record<string, string>;
  enabled?: boolean;
}
