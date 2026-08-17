<template>
    <router-view />

    <!-- Notifications -->
    <ToastContainer />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { watch } from "vue";
import { appConfig } from "@/app.config";
import ToastContainer from "@/components/layout/notifications/ToastContainer.vue";

type AppLocale = 'en';
const APP_LOCALES: AppLocale[] = ['en'];

const i18n = useI18n();
const route = useRoute();

const urlLang = new URLSearchParams(window.location.search).get('lang');
if (urlLang && APP_LOCALES.includes(urlLang as AppLocale)) {
  i18n.locale.value = urlLang as AppLocale;
}

watch(
  () => i18n.locale,
  (value) => {
    document.querySelector('html')?.setAttribute('lang', value.value);
  },
  { immediate: true }
);

watch(
  () => route.meta?.title,
  (newTitle) => {
    if (newTitle) {
      document.title = `${appConfig.appName} – ${i18n.t(newTitle as string)}`;
    } else {
      document.title = appConfig.appName;
    }
  },
  { immediate: true }
);

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setHreflangLinks() {
  document.querySelectorAll('link[hreflang]').forEach(el => el.remove());

  const base = window.location.origin + window.location.pathname;
  for (const locale of APP_LOCALES) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', locale);
    link.setAttribute('href', `${base}?lang=${locale}`);
    document.head.appendChild(link);
  }
}

watch(
  () => i18n.locale.value,
  () => {
    setMeta('description', `${appConfig.appName} — ${i18n.t('meta.description')}`);
    setHreflangLinks();
  },
  { immediate: true }
);
</script>
