import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { UiMessage, UiMessageType } from '@/types/ui/common';
import { generateId } from '@/lib/utils';

export const useNotificationStore = defineStore('notifications', () => {
  const messages = ref<UiMessage[]>([]);
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const baseDurationMs = 3000;
  const maxDurationMs = 15000;
  const durationPerChar = 100;
  const maxMessages = 5;

  function adaptedDuration(text: string): number {
    const duration = baseDurationMs + text.length * durationPerChar;
    return Math.min(duration, maxDurationMs);
  }

  function show(text: string, type: UiMessageType = 'warning') {
    if (text.length === 0) return;

    const last = messages.value[messages.value.length - 1];
    if (last && last.text === text && last.type === type) return;

    if (messages.value.length >= maxMessages) {
      const removed = messages.value.splice(0, 1)[0];
      clearTimer(removed.id);
    }

    const id = generateId('core');
    const duration = adaptedDuration(text);
    const message: UiMessage = { id, text, type };

    messages.value.push(message);

    timers.set(id, setTimeout(() => {
      timers.delete(id);
      const index = messages.value.indexOf(message);
      if (index !== -1) {
        messages.value.splice(index, 1);
      }
    }, duration));
  }

  function clearTimer(id: string) {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
  }

  function hide(id: string) {
    clearTimer(id);
    const index = messages.value.findIndex(it => it.id === id);
    if (index !== -1) {
      messages.value.splice(index, 1);
    }
  }

  function hideAll() {
    for (const timer of timers.values()) {
      clearTimeout(timer);
    }
    timers.clear();
    messages.value = [];
  }

  return { messages, show, hide, hideAll };
});
