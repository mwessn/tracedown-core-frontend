import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type { ApiKeySummary, CreateApiKeyRequest } from '@/data/apikeys/ApiKeyDto';
import type { ActionDataResult, ActionResult } from '@/types/actions';
import type { Page } from '@/types/pfs';

/** Org API keys: list, show-once creation, revoke, delete. */
export const useApiKeyStore = defineStore('apiKey', () => {
  const keys = ref<ApiKeySummary[]>([]);
  const loading = ref<boolean>(false);

  async function fetchKeys(): Promise<ActionResult> {
    loading.value = true;
    try {
      const res = await http.get<Page<ApiKeySummary>>('/apikeys?pageSize=100');
      if (!res.success || !res.data) {
        return { ok: false, message: res.errorInfo?.message };
      }
      keys.value = res.data.items;
      return { ok: true };
    } finally {
      loading.value = false;
    }
  }

  async function createKey(request: CreateApiKeyRequest): Promise<ActionDataResult<ApiKeySummary>> {
    const res = await http.post<ApiKeySummary, CreateApiKeyRequest>('/apikeys', request);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    // The stored row never carries the plaintext — strip it from the list copy.
    keys.value = [...keys.value, { ...res.data, key: null }];
    return { ok: true, data: res.data };
  }

  async function revokeKey(keyId: string): Promise<ActionResult> {
    const res = await http.post<{ ok: boolean }, Record<string, never>>(`/apikeys/${keyId}/revoke`, {});
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    keys.value = keys.value.map(k => (k.id === keyId ? { ...k, revoked: true } : k));
    return { ok: true };
  }

  async function deleteKey(keyId: string): Promise<ActionResult> {
    const res = await http.delete<{ ok: boolean }>(`/apikeys/${keyId}`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    keys.value = keys.value.filter(k => k.id !== keyId);
    return { ok: true };
  }

  return { keys, loading, fetchKeys, createKey, revokeKey, deleteKey };
});
