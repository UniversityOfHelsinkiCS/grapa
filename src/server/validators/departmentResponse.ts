import { z } from 'zod'

export const TranslatedNameSchema = z.object({
  fi: z.string().optional(),
  sv: z.string().optional(),
  en: z.string().optional(),
})

export const DepartmentDataSchema = z.object({
  id: z.string(),
  name: TranslatedNameSchema,
  enabled: z.boolean().optional(),
})

export type TranslatedName = z.infer<typeof TranslatedNameSchema>
export type TranslationLanguage = keyof TranslatedName
export type DepartmentData = z.infer<typeof DepartmentDataSchema>
