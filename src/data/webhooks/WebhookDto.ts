/** One org-level webhook delivery channel. */
export interface WebhookSummary {
  id: string;
  name: string;
  label: string | null;
  url: string;
  method: string;
  /** Request body template; must contain $TEXT (null for GET). */
  body: string | null;
  /** Delivery configuration JSON (auth headers, query params). */
  config: string | null;
  attemptCount: number;
  createdAt: string;
}

/** Request of POST /webhooks. */
export interface CreateWebhookRequest {
  name: string;
  url: string;
  method?: string;
  label?: string;
  body?: string;
  config?: string;
  attemptCount?: number;
}

/** Request of PATCH /webhooks/{id} — only set fields are applied. */
export type UpdateWebhookRequest = Partial<CreateWebhookRequest>;

/** One webhook bound to a resource (GET /webhooks/bindings/{type}/{id}). */
export interface WebhookBindingSummary {
  id: string;
  webhookId: string;
  webhookName: string;
  enabled: boolean;
  createdAt: string;
}
