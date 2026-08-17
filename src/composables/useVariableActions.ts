import { useI18n } from 'vue-i18n';
import { useNotificationStore } from '@/store/ui/notifications';
import type { CreateVariableRequest, VariableSummary } from '@/data/variables/VariableDto';
import type { ActionResult } from '@/types/actions';

/**
 * The store operations a variables view must supply. Both variable stores
 * (resource hierarchy and org-level) return the same ActionResult shapes;
 * the adapter closes over whatever scoping arguments the store needs.
 */
export interface VariableStoreAdapter {
  create: (request: CreateVariableRequest) => Promise<ActionResult>;
  update: (variableId: string, value: string) => Promise<ActionResult>;
  remove: (variableId: string) => Promise<ActionResult>;
  reveal: (variableId: string) => Promise<ActionResult>;
}

/**
 * Shared mutation handlers for the variables tabs: create/save/delete toast
 * success or the store-resolved error; toggle/reveal only surface failures.
 * Must be called from component `setup` (uses i18n).
 */
export function useVariableActions(adapter: VariableStoreAdapter) {
  const { t } = useI18n();
  const notifications = useNotificationStore();

  function notifyOutcome(result: ActionResult, successKey: string): boolean {
    if (result.ok) {
      notifications.show(t(successKey), 'success');
    } else if (result.message) {
      notifications.show(result.message, 'error');
    }
    return result.ok;
  }

  /** Resolves `true` on success so callers can close/reset their create form. */
  async function handleCreate(request: CreateVariableRequest): Promise<boolean> {
    return notifyOutcome(await adapter.create(request), 'variables.created');
  }

  async function handleSave(variableId: string, value: string): Promise<void> {
    notifyOutcome(await adapter.update(variableId, value), 'variables.updated');
  }

  async function handleDelete(variableId: string): Promise<void> {
    notifyOutcome(await adapter.remove(variableId), 'variables.deleted');
  }

  async function handleToggle(variable: VariableSummary): Promise<void> {
    const value = variable.value === 'true' ? 'false' : 'true';
    const result = await adapter.update(variable.id, value);
    if (!result.ok && result.message) notifications.show(result.message, 'error');
  }

  async function handleReveal(variableId: string): Promise<void> {
    const result = await adapter.reveal(variableId);
    if (!result.ok && result.message) notifications.show(result.message, 'error');
  }

  return { handleCreate, handleSave, handleDelete, handleToggle, handleReveal };
}
