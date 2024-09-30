import express from 'express'
import cors from 'cors'
import * as Sentry from '@sentry/node'

import errorHandler from '../middleware/error'
import userMiddleware from '../middleware/user'
import accessLogger from '../middleware/access'
import loginAsMiddleware from '../middleware/loginAs'

import userRouter from './user'
import usersRouter from './users'
import loginRouter from './login'
import thesisRouter from './thesis'
import attachmentRouter from './attachment'
import programRouter from './program'
import programManagementRouter from './programManagement'
import departmentRouter from './department'
import departmentAdminRouter from './departmentAdmin'

import logoutRouter from './logout'

import { inDevelopment, inE2EMode, inTest } from '../../config'
import initializeSentry from '../util/sentry'
import eventLogRoute from './eventLogRouter'

const router = express()

initializeSentry()

router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: true }))
// only use user middleware in development, e2e tests and integration (API) tests
if (inDevelopment || inE2EMode || inTest) router.use(userMiddleware)

// @ts-expect-error req.user is added to the request
// as part of oidc passport authentication
router.use(loginAsMiddleware)
router.use(accessLogger)

router.get('/ping', (_, res) => res.send('pong'))
router.get('/error', () => {
  throw new Error('Test error')
})
router.use('/user', userRouter)
router.use('/users', usersRouter)
router.use('/theses', thesisRouter)
router.use('/login', loginRouter)
router.use('/logout', logoutRouter)
router.use('/attachments', attachmentRouter)
router.use('/programs', programRouter)
router.use('/program-managements', programManagementRouter)
router.use('/departments', departmentRouter)
router.use('/department-admins', departmentAdminRouter)
router.use('/event-log', eventLogRoute)

Sentry.setupExpressErrorHandler(router)

router.use(errorHandler)

export default router
