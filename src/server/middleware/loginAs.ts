import { NextFunction } from 'express'

import { RequestWithUser } from '../types'
import { User } from '../db/models'
import { LOGIN_AS_HEADER_KEY } from '../../config'

const loginAsMiddleware = async (
  req: RequestWithUser,
  _: Response,
  next: NextFunction
) => {
  const loginAsId = req.headers[LOGIN_AS_HEADER_KEY]
  if (typeof loginAsId === 'string' && req.user.isAdmin) {
    const loggedInAsUser = await User.findByPk(loginAsId)
    if (loggedInAsUser) {
      req.user = loggedInAsUser.toJSON()
      req.loginAs = true
    }
  }

  next()
}

export default loginAsMiddleware
