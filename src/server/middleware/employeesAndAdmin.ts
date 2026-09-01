import { NextFunction, Response } from 'express'
import logger from '../util/logger'

export const has_access = (user: {
  isAdmin: any
  iamGroups: string | string[]
}) => {
  return user.isAdmin || user.iamGroups.includes('hy-employees')
}

export const employeesAndAdminOnly = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const currentUser = req.user

  if (!currentUser || !currentUser.id || !has_access(currentUser)) {
    logger.log(
      'warn',
      `401 for ${req.method} ${req.path} as ${currentUser ? `${currentUser?.id}/${currentUser?.username}` : 'anonymous user'}`
    )
    res.status(401).send()
    return
  }

  return next()
}

export default employeesAndAdminOnly
