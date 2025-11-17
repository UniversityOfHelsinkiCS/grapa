import { Request, Response, NextFunction } from 'express'
import * as Sentry from '@sentry/node'
import { inProduction } from '../../config'
import { User } from '../types'

/**
 * Middleware to set Sentry user context for each request
 * This should be applied after user authentication middleware
 */
const sentryUserMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!inProduction) {
    return next()
  }

  const user = req.user as User

  // Set user
  Sentry.setUser(
    user
      ? {
          id: user.id,
          email: user.email,
          username: user.username,
        }
      : null
  )

  // Add request context
  Sentry.setContext('request', {
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  })

  next()
}

export default sentryUserMiddleware
