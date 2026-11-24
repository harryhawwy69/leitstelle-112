import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './locales/de.json';

/** Deutsch ist Ausgangssprache; weitere Sprachen kommen als zusätzliche JSON-Dateien (ADR-0011). */
export async function initI18n(): Promise<void> {
  await i18next.use(initReactI18next).init({
    lng: 'de',
    fallbackLng: 'de',
    resources: { de: { translation: de } },
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}
