/** One org audit-log entry (GET /audit-log). */
export interface AuditLogEntry {
  id: string;
  userId: string | null;
  /** Actor identity resolved server-side; null for system actions. */
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  /** What the entity was called at the time of the change; null for system-wide actions. */
  entityDisplayName: string | null;
  diff: string | null;
  comment: string | null;
  createdAt: string;
}
