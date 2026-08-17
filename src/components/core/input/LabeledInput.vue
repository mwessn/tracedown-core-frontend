<template>
    <div>
      <label
        :for="inputId"
        class="block text-sm font-medium text-text-primary mb-1"
      >
        {{ label }}
      </label>
      <TextInput
        :id="inputId"
        v-bind="$attrs"
      />
    </div>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import TextInput from "@/components/core/input/TextInput.vue";

// Only `label` and `id` are ours — v-model and every TextInput prop (type,
// name, placeholder, autocomplete, required, …) fall through via $attrs, so we
// never re-declare them here.
defineOptions({ inheritAttrs: false });

const props = defineProps<{
  label: string;
  id?: string;
}>();

const generatedId = useId();
const inputId = computed(() => props.id ?? generatedId);
</script>
