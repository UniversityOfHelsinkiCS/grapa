import express from 'express'
import fs from 'fs'
import { Attachment } from '../db/models'
import ethesisUserHandler from '../middleware/ethesisUser'

const PATH_TO_FOLDER = '/opt/app-root/src/uploads/'

const attachmentRoute = express.Router()

attachmentRoute.get('/:filename', ethesisUserHandler, async (req, res) => {
  const { filename } = req.params

  const metadata = await Attachment.findOne({
    where: { filename },
    attributes: ['filename', 'originalname'],
  })

  try {
    const stat = fs.statSync(`${PATH_TO_FOLDER}/${metadata.filename}`)
    const file = fs.createReadStream(`${PATH_TO_FOLDER}${metadata.filename}`)
    res.setHeader('Content-Length', stat.size)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${metadata.originalname.replace(/,/g, '')}`
    )
    file.pipe(res)
  } catch {
    res.status(500)
    res.send('500')
  }
})

export default attachmentRoute
