import { sequelize } from '../db/connection'
import { NextFunction, Response } from 'express'
import path from 'path'

export const maintenanceMode = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const [rows] = await sequelize.query(
    {
      query: 'select value from application_configuration where id=?',
      values: ['maintenance'],
    },
    { raw: true }
  )

  const status: boolean = rows.length > 0 ? rows[0].value == 'true' : false

  if (status) {
    res.sendFile(path.join(process.cwd(), 'src/server/assets/maintenance.html'))
    return
  }
  return next()
}

export default maintenanceMode
