import express from 'express'
import cors from 'cors'
import { Handlers as SentryHandlers } from '@sentry/node'

import { inDevelopment, inE2EMode } from '../../config'
import userMiddleware from '../middleware/user'
import initializeSentry from '../util/sentry'
import errorHandler from '../middleware/error'
import accessLogger from '../middleware/access'
import thesisRouter from './thesis'
import loginRouter from './login'
import userRouter from './user'
import usersRouter from './users'

const router = express()

initializeSentry(router)

router.use(SentryHandlers.requestHandler())
router.use(SentryHandlers.tracingHandler())

router.use(cors())
router.use(express.json())

if (inDevelopment || inE2EMode) router.use(userMiddleware)

router.use(accessLogger)

router.get('/ping', (_, res) => res.send('pong'))
router.get('/error', () => {
  throw new Error('Test error')
})
router.use('/user', userRouter)
router.use('/users', usersRouter)
router.use('/theses', thesisRouter)
router.use('/login', loginRouter)

router.use(SentryHandlers.errorHandler())
router.use(errorHandler)

export default router
