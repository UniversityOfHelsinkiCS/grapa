import CustomUnauthorizedError from '../errors/UnauthorizedError.ts'
import type { NextFunction, Response } from 'express'

export const withStudyRight = (req: any, _: Response, next: NextFunction) => {
  const currentUser = req.user

  if (!currentUser || !currentUser.id || !currentUser.hasStudyRight) {
    throw new CustomUnauthorizedError('Unauthorized')
  }

  return next()
}

export default withStudyRight
