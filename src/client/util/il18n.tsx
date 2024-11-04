import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../locales/en.json'
import fi from '../locales/fi.json'
import { SELECTED_LANGUAGE_STORAGE_KEY } from '../../config'

declare global {
  interface Window {
    __i18n__: typeof i18n
  }
}

const initializeI18n = () =>
  i18n.use(initReactI18next).init({
    resources: {
      en,
      fi,
    },
    lng: localStorage.getItem(SELECTED_LANGUAGE_STORAGE_KEY) || 'fi',
    fallbackLng: 'fi',
    defaultNS: 'common',
  })

window.__i18n__ = i18n

export default initializeI18n
