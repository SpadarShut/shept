import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import { getLocales } from "expo-localization"

import en from "./locales/en"
import be from "./locales/be"

const systemLanguageCode = getLocales()[0]?.languageCode ?? "en"
export const systemLng = systemLanguageCode === "be" ? "be" : "en"

await i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    be: { translation: be },
  },
  lng: systemLng,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
})
