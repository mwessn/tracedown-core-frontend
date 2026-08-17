/** Platform-raised operational alert (capacity, agent health, …). */
export interface SystemAlertSummary {
  id: string;
  alertType: string;
  subject: string;
  severity: string;
  data: Record<string, unknown> | null;
  /** Episode start — when this condition (re)appeared. */
  createdAt: string;
  lastSeenAt: string;
}
