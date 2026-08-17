<template>
    <Teleport to="body">
      <div
        class="fixed top-0 left-0 z-999 full
               bg-black/50 flex justify-center
               items-center backdrop-blur-sm backdrop-brightness-75"
        @click="onBackdropClick"
        @wheel.prevent
        @touchmove.prevent
      >
        <div
          class="bg-background-secondary max-w-4xl w-full max-h-4/5 overflow-y-auto p-5 rounded-lg relative shadow-xl"
          :class="{ 'max-w-6/10': wide }"
          @click.stop
          @wheel.stop
          @touchmove.stop
        >
          <div class="flex justify-between items-center sticky top-0 bg-background-secondary z-10 p-2 rounded">
            <div class="text-text-primary font-bold text-lg">
              {{ modalName }}
            </div>
            <div
              class="cursor-pointer p-1 bg-background-primary rounded-lg"
              @click="emit('close')"
            >
              <FontAwesomeIcon
                :icon="faXmark"
                class="h-5 select-none"
              />
            </div>
          </div>
          <slot />
        </div>
      </div>
    </Teleport>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { onMounted, onUnmounted } from 'vue';

const props = withDefaults(
  defineProps<{
    modalName: string;
    wide?: boolean;
    persistent?: boolean;
  }>(),
  {
    wide: false,
    persistent: false,
  }
);

const emit = defineEmits(['close']);

const onBackdropClick = () => {
  if (!props.persistent) {
    emit('close');
  }
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && !props.persistent) {
    emit('close');
  }
};

// Disable background scroll while the modal is open
let previousBodyOverflow = '';
let previousHtmlOverflow = '';

onMounted(() => {
  previousBodyOverflow = document.body.style.overflow;
  previousHtmlOverflow = document.documentElement.style.overflow;
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  document.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  document.body.style.overflow = previousBodyOverflow;
  document.documentElement.style.overflow = previousHtmlOverflow;
  document.removeEventListener('keydown', onKeydown);
});
</script>
