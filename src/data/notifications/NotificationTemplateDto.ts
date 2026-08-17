/** One org notification template (Mustache-style ${var} text). */
export interface NotificationTemplateSummary {
  id: string;
  name: string;
  text: string;
  /** Projects the template is bound to (auto-added set). */
  projectIds: string[];
  createdAt: string;
}

/** Request of POST /notification-templates. */
export interface CreateNotificationTemplateRequest {
  name: string;
  text: string;
  projectIds?: string[];
}

/** Request of PATCH /notification-templates/{id}. */
export interface UpdateNotificationTemplateRequest {
  name?: string;
  text?: string;
}
