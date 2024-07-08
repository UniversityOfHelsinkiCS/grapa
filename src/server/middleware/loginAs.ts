import { NextFunction } from 'express'

import { RequestWithUser } from '../types'
import { User } from '../db/models'

const loginAsMiddleware = async (
  req: RequestWithUser,
  _: Response,
  next: NextFunction
) => {
  const loginAsId = req.headers['x-admin-logged-in-as']
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
