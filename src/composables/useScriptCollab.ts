/**
 * Lightweight collaborative script editing.
 *
 * While the editor is focused (the user is actively editing), the client joins a
 * per-service `svc-edit:{id}` channel and broadcasts debounced full-text updates
 * to everyone else focused on the same script; incoming updates are applied
 * verbatim (last-writer-wins — deliberately simple, no OT/CRDT). Presence is
 * tracked so the UI can show who else is editing. All ephemeral: nothing is
 * persisted here, and it degrades to nothing when the socket is unavailable.
 */

import { computed, onScopeDispose, ref, type Ref } from 'vue';
import { getLiveConnection } from '@/requests/runtime';
import { useAuthStore } from '@/store/core/auth';

const DEBOUNCE_MS = 400;

interface ScriptCollab {
  /** Display names of other people currently editing the same script. */
  peers: Ref<string[]>;
  /** The editor gained focus — join and start syncing. */
  focus(): void;
  /** The editor lost focus — flush, leave, stop syncing. */
  blur(): void;
  /** A local text change happened — debounced-broadcast to peers. */
  pushLocal(): void;
}

export function useScriptCollab(opts: {
  channelId: () => string | undefined;
  getText: () => string;
  applyRemote: (text: string) => void;
}): ScriptCollab {
  const auth = useAuthStore();
  const conn = getLiveConnection();
  const editorId = Math.random().toString(36).slice(2);
  const myName = () => auth.user?.displayName || 'Someone';

  const peerNames = ref<Record<string, string>>({});
  const peers = computed(() => Object.values(peerNames.value));

  let channel: string | null = null;
  let focused = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function relay(event: string, data: Record<string, unknown>) {
    if (!channel) return;
    conn.send({ type: 'relay', channel, event, data: { editorId, ...data } });
  }

  function setPeer(id: string, name: unknown) {
    peerNames.value = { ...peerNames.value, [id]: (typeof name === 'string' && name) || 'Someone' };
  }

  const off = conn.onEvent((e) => {
    if (!channel || e.channel !== channel) return;
    const from = e.data.editorId as string | undefined;
    if (!from || from === editorId) return; // ignore our own echo
    switch (e.event) {
      case 'script':
        setPeer(from, e.data.name);
        if (typeof e.data.script === 'string') opts.applyRemote(e.data.script);
        break;
      case 'join':
        setPeer(from, e.data.name);
        // Greet the newcomer and hand them our current text, so they sync to us.
        if (focused) {
          relay('presence', { name: myName() });
          relay('script', { name: myName(), script: opts.getText() });
        }
        break;
      case 'presence':
        setPeer(from, e.data.name);
        break;
      case 'leave': {
        const next = { ...peerNames.value };
        delete next[from];
        peerNames.value = next;
        break;
      }
    }
  });

  function focus() {
    const id = opts.channelId();
    if (!id || focused) return;
    channel = `svc-edit:${id}`;
    focused = true;
    conn.ensureStarted();
    conn.subscribe(channel);
    relay('join', { name: myName() });
  }

  function blur() {
    if (!focused) return;
    // Send the last edit while still subscribed, then leave.
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    relay('script', { name: myName(), script: opts.getText() });
    relay('leave', {});
    focused = false;
    if (channel) conn.unsubscribe(channel);
    peerNames.value = {};
    channel = null;
  }

  function pushLocal() {
    if (!focused) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      relay('script', { name: myName(), script: opts.getText() });
    }, DEBOUNCE_MS);
  }

  onScopeDispose(() => {
    blur();
    off();
  });

  return { peers, focus, blur, pushLocal };
}
