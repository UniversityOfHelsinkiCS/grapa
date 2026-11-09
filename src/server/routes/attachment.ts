import express from 'express'
import fs from 'fs'
import { Attachment } from '../db/models'
import ethesisUserHandler from '../middleware/ethesisUser'
import getEthesisAdminStatus from '../middleware/getEthesisAdminStatus'
import { fetchThesisById } from '../services/thesisService'
import { User as UserType } from '../types'

const PATH_TO_FOLDER = '/opt/app-root/src/uploads/'

const attachmentRoute = express.Router()

attachmentRoute.get(
  '/:filename',
  ethesisUserHandler,
  getEthesisAdminStatus,
  async (req, res) => {
    const { filename } = req.params

    const metadata = await Attachment.findOne({
      where: { filename },
      attributes: ['filename', 'originalname', 'thesisId'],
    })

    const thesis =
      metadata?.thesisId &&
      (await fetchThesisById(
        metadata.thesisId,
        req.user as unknown as UserType
      ))

    if (!thesis) {
      res.status(404).send()
      return
    }

    try {
      const file_path = `${PATH_TO_FOLDER}${metadata.filename}`
      const stat = fs.statSync(file_path)
      const file = fs.createReadStream(file_path)

      res.setHeader('Content-Length', stat.size)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${metadata.originalname.replace(/,/g, '')}`
      )
      file.pipe(res)
    } catch {
      res.status(500)
      res.send('Internal Server Error')
    }
  }
)

export default attachmentRoute
