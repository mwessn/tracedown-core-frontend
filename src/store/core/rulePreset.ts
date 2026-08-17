import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type { CreateRulePresetRequest, RulePresetSummary } from '@/data/presets/RulePresetDto';
import type { ActionDataResult, ActionResult } from '@/types/actions';

/**
 * Preset Library: Lace script starters for the service editor. Fetched per
 * modal open (small payload, no cache invalidation to get wrong).
 */
export const useRulePresetStore = defineStore('rulePreset', () => {
  const presets = ref<RulePresetSummary[]>([]);
  const loading = ref<boolean>(false);

  async function fetchPresets(workspaceId?: string): Promise<ActionResult> {
    loading.value = true;
    try {
      const query = workspaceId ? `?workspaceId=${workspaceId}` : '';
      const res = await http.get<RulePresetSummary[]>(`/rule-presets${query}`);
      if (!res.success || !res.data) {
        return { ok: false, message: res.errorInfo?.message };
      }
      presets.value = res.data;
      return { ok: true };
    } finally {
      loading.value = false;
    }
  }

  async function createPreset(request: CreateRulePresetRequest): Promise<ActionDataResult<RulePresetSummary>> {
    const res = await http.post<RulePresetSummary, CreateRulePresetRequest>('/rule-presets', request);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    presets.value = [...presets.value, res.data];
    return { ok: true, data: res.data };
  }

  async function deletePreset(presetId: string): Promise<ActionResult> {
    const res = await http.delete<{ ok: boolean }>(`/rule-presets/${presetId}`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    presets.value = presets.value.filter(p => p.id !== presetId);
    return { ok: true };
  }

  return { presets, loading, fetchPresets, createPreset, deletePreset };
});
