import fs from 'node:fs'
import path from 'node:path'

// Like i18next in the app: 'namespace:key:subkey' or 'namespace:key.subkey', without a namespace the key is in common
export const createTranslate = (lang: string) => {
  const file = path.resolve(
    import.meta.dirname,
    '../../src/client/locales',
    `${lang}.json`
  )
  const translations = JSON.parse(fs.readFileSync(file, 'utf8'))
  return (key: string): string => {
    const [namespace, ...rest] = key.includes(':')
      ? key.split(':')
      : ['common', key]
    const label = rest
      .flatMap((part) => part.split('.'))
      .reduce((node, part) => node?.[part], translations[namespace])
    if (typeof label !== 'string')
      throw new Error(`No ${lang} translation for ${key}`)
    return label
  }
}

export type Translate = ReturnType<typeof createTranslate>
