import { createI18n } from 'vue-i18n';
import en from '@/locale/en.json';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: { en },
});

export default i18n;
