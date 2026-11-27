import type { NextFunction } from 'express'

import type { RequestWithUser } from '../types.ts'
import { User } from '../db/models/index.ts'
import { LOGIN_AS_HEADER_KEY } from '../../config.ts'

const loginAsMiddleware = async (
  req: RequestWithUser,
  _: Response,
  next: NextFunction
) => {
  const loginAsId = req.headers[LOGIN_AS_HEADER_KEY]
  if (typeof loginAsId === 'string' && req.user && req.user.isAdmin) {
    const loggedInAsUser = await User.findByPk(loginAsId)
    if (loggedInAsUser) {
      req.user = loggedInAsUser.toJSON()
      req.loginAs = true
    }
  }

  next()
}

export default loginAsMiddleware
