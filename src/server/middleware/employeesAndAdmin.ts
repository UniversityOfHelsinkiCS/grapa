import CustomUnauthorizedError from '../errors/UnauthorizedError'
import { NextFunction, Response } from 'express'

export const employeesAndAdminOnly = async (
  req: any,
  _: Response,
  next: NextFunction
) => {
  const currentUser = req.user

  const has_access = (user: { isAdmin: any; iamGroups: string | string[] }) => {
    return user.isAdmin || user.iamGroups.includes('hy-employees')
  }

  if (!currentUser || !currentUser.id || !has_access(currentUser)) {
    throw new CustomUnauthorizedError('Unauthorized')
  }

  return next()
}

export default employeesAndAdminOnly
