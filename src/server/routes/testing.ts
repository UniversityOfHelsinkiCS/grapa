import express from 'express'

import { setClock } from '../test/manual/clock.ts'
import { NOW, type Language } from '../test/manual/demoData.ts'
import { seedManual, truncateAll } from '../test/manual/seed.ts'

// Only mounted in e2e mode
const testingRouter = express.Router()

const LANGUAGES: Language[] = ['fi', 'sv', 'en']

testingRouter.post('/seed-manual', async (req, res) => {
  const lang = req.body?.lang ?? 'fi'
  if (!LANGUAGES.includes(lang)) {
    return res.status(400).send({ error: `Unknown language ${lang}` })
  }
  setClock(NOW)
  const ids = await seedManual(lang)
  return res.send({ now: NOW, ...ids })
})

testingRouter.post('/reset', async (_req, res) => {
  setClock(null)
  await truncateAll()
  return res.sendStatus(204)
})

export default testingRouter
