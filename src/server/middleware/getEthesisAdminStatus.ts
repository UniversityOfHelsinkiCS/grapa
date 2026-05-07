import { NextFunction, Response } from 'express'
import { EthesisAdmin } from '../db/models'

const getEthesisAdminStatus = async (
  req: any,
  _: Response,
  next: NextFunction
) => {
  const currentUser = req.user
  if (!currentUser) {
    return next()
  }

  const ethesisAdmined = await EthesisAdmin.findOne({
    where: { userId: currentUser.id },
  })

  currentUser.ethesisAdmin = ethesisAdmined != null || currentUser.isAdmin

  return next()
}

export default getEthesisAdminStatus
