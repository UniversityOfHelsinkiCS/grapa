import express from 'express'
import cors from 'cors'
import * as Sentry from '@sentry/node'

import userMiddleware from '../middleware/user'
import initializeSentry from '../util/sentry'
import errorHandler from '../middleware/error'
import accessLogger from '../middleware/access'
import thesisRouter from './thesis'
import loginRouter from './login'
import userRouter from './user'
import usersRouter from './users'
import attachmentRouter from './attachment'
import programRouter from './program'
import { inDevelopment, inE2EMode, inTest } from '../../config'

const router = express()

initializeSentry()

router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: true }))
if (inDevelopment || inE2EMode || inTest) router.use(userMiddleware)

router.use(accessLogger)

router.get('/ping', (_, res) => res.send('pong'))
router.get('/error', () => {
  throw new Error('Test error')
})
router.use('/user', userRouter)
router.use('/users', usersRouter)
router.use('/theses', thesisRouter)
router.use('/login', loginRouter)
router.use('/attachments', attachmentRouter)
router.use('/programs', programRouter)

Sentry.setupExpressErrorHandler(router)

router.use(errorHandler)

export default router
