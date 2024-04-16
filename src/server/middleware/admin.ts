import { NextFunction, Response } from 'express'

const adminHandler = (req: any, _: Response, next: NextFunction) => {
  if (!req?.user.isAdmin) throw new Error('Unauthorized')

  return next()
}

export default adminHandler
