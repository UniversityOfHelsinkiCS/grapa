import express from 'express'
import cors from 'cors'
import * as Sentry from '@sentry/node'

import errorHandler from '../middleware/error.ts'
import userMiddleware from '../middleware/user.ts'
import accessLogger from '../middleware/access.ts'
import loginAsMiddleware from '../middleware/loginAs.ts'
import hideStudentNumbersMiddleware from '../middleware/hideStudentNumbers.ts'
import employeesAndAdminOnly from '../middleware/employeesAndAdmin.ts'

import userRouter from './user.ts'
import usersRouter from './users.ts'
import loginRouter from './login.ts'
import studentRouter from './student.ts'
import thesisRouter from './thesis.ts'
import attachmentRouter from './attachment.ts'
import programRouter from './program.ts'
import programManagementRouter from './programManagement.ts'
import studyTrackManagementRouter from './studyTrackManagement.ts'
import departmentRouter from './department.ts'
import departmentAdminRouter from './departmentAdmin.ts'
import ethesisAdminRouter from './ethesisAdmins.ts'
import adminRouter from './admin.ts'

import logoutRouter from './logout.ts'

import { inDevelopment, inE2EMode, inTest, localOIDC } from '../../config.ts'
import { DEMO_DATA_ENABLED } from '../util/config.ts'
import initializeSentry from '../util/sentry.ts'
import sentryUserMiddleware from '../middleware/sentry.ts'

const router = express()

initializeSentry()

router.use(cors())
router.use(express.json())
router.use(express.urlencoded({ extended: true }))

// Before the user middleware, as seeding runs without a user. Not even loaded elsewhere.
if (DEMO_DATA_ENABLED)
  router.use('/test', (await import('./testing.ts')).default)

// only use user middleware in development (when oidc disabled), e2e tests and integration (API) tests
if (inE2EMode || inTest || (!localOIDC && inDevelopment))
  router.use(userMiddleware)

// @ts-expect-error req.user is added to the request
// as part of oidc passport authentication
router.use(loginAsMiddleware)

// @ts-expect-error req.user is added to the request
router.use(hideStudentNumbersMiddleware)

router.use(sentryUserMiddleware)
router.use(accessLogger)

router.get('/error', () => {
  throw new Error('Test error')
})

// These routes are available to all users, including students
router.use('/login', loginRouter)
router.use('/logout', logoutRouter)

// These have specific restrictions implemented for certain users
router.use('/user', userRouter)
router.use('/users', usersRouter)
router.use('/program-managements', programManagementRouter)
router.use('/study-track-managements', studyTrackManagementRouter)

// These routes are available to those who have active study rights
router.use('/student', studentRouter)

// These routes should be only available to employees and admin users
router.use(employeesAndAdminOnly)
router.use('/admin', adminRouter)
router.use('/theses', thesisRouter)
router.use('/attachments', attachmentRouter)
router.use('/programs', programRouter)
router.use('/departments', departmentRouter)
router.use('/department-admins', departmentAdminRouter)
router.use('/ethesis-admins', ethesisAdminRouter)

Sentry.setupExpressErrorHandler(router)

router.use(errorHandler)

export default router
