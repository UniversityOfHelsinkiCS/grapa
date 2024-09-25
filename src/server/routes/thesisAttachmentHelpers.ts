import { Transaction } from 'sequelize'
import fs from 'fs'

import { Attachment } from '../db/models'
import { ServerPostRequest, ServerPutRequest } from '../types'

const PATH_TO_FOLDER = '/opt/app-root/src/uploads/'

export const handleAttachmentByLabel = async (
  req: ServerPostRequest | ServerPutRequest,
  thesisId: string,
  label: 'researchPlan' | 'waysOfWorking',
  transaction: Transaction
) => {
  const newFile = req.files[label] ? req.files[label][0] : null
  const fileMetadataFromClient = req.body[label]

  const existingAttachment = await Attachment.findOne({
    where: { thesisId, label },
    transaction,
  })

  if (!newFile && !fileMetadataFromClient && existingAttachment) {
    // delete reserachPlan from DB and the disk
    await Attachment.destroy({
      where: { thesisId, label },
      transaction,
    })

    fs.unlinkSync(`${PATH_TO_FOLDER}${existingAttachment.filename}`)
  } else if (newFile && existingAttachment) {
    // update existing attachment
    await Attachment.update(
      {
        filename: newFile.filename,
        originalname: newFile.originalname,
        mimetype: newFile.mimetype,
      },
      {
        where: { thesisId, label },
        transaction,
      }
    )
    // delete existing files from disk
    fs.unlinkSync(`${PATH_TO_FOLDER}${existingAttachment.filename}`)
  } else if (newFile && !existingAttachment) {
    // create new attachment
    await Attachment.create(
      {
        thesisId,
        filename: newFile.filename,
        originalname: newFile.originalname,
        mimetype: newFile.mimetype,
        label,
      },
      { transaction }
    )
  }

  // NOTE: Do nothing if no new file and but fileMetadataFromClient is present.
  // This means that the file was not changed
}

export const deleteThesisAttachments = async (
  thesisId: string,
  t: Transaction
) => {
  const existingAttachments = await Attachment.findAll({
    where: { thesisId },
  })

  await Attachment.destroy({
    where: { thesisId },
    transaction: t,
  })

  existingAttachments.forEach((attachment) => {
    fs.unlinkSync(`${PATH_TO_FOLDER}${attachment.filename}`)
  })
}
