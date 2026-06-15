import express, { Response } from 'express'
import { RequestWithUser } from '../types'
import ethesisUserHandler from '../middleware/ethesisUser'
import { run as runUpdater } from '../updater'

const adminRouter = express.Router()

adminRouter.post(
  '/updater',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { isAdmin } = req.user

    if (!isAdmin) {
      return res.status(403).send({ error: 'Forbidden' })
    }

    try {
      const result = await runUpdater()
      if (result && !result.success) {
        return res.status(500).send({ error: 'Failed to run updater' })
      }
      return res.status(200).send({ message: 'Updater finished successfully' })
    } catch (error: any) {
      return res
        .status(500)
        .send({ error: error?.message || 'Failed to run updater' })
    }
  }
)

export default adminRouter
