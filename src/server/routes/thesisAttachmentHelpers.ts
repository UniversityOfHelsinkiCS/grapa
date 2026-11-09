import { Transaction } from 'sequelize'
import fs from 'fs'

import { Attachment, Thesis } from '../db/models'
import { ProgramOptions, ServerPostRequest, ServerPutRequest } from '../types'
import CustomValidationError from '../errors/ValidationError'
import { getMilestoneCount } from '../../shared/utils/thesisUtils'
import logger from '../util/logger'

const PATH_TO_FOLDER = '/opt/app-root/src/uploads/'

export const removeFile = (filename?: string | null) => {
  if (!filename) return

  try {
    fs.unlinkSync(`${PATH_TO_FOLDER}${filename}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(`Failed to remove file ${filename}: ${error}`)
    }
  }
}

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
    await Attachment.destroy({
      where: { thesisId, label },
      transaction,
    })

    removeFile(existingAttachment.filename)
  } else if (newFile && existingAttachment) {
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
    removeFile(existingAttachment.filename)
  } else if (newFile && !existingAttachment) {
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

  existingAttachments.forEach((attachment) => removeFile(attachment.filename))
}

const getActiveMilestoneWhere = (thesis: Thesis) => {
  const options = thesis.program?.options as ProgramOptions | undefined
  const milestoneCount = getMilestoneCount(options, thesis.milestoneVersion)
  const activeMilestone = (thesis.milestone ?? 0) + 1

  if (
    !options?.allowMilestoneAttachments ||
    thesis.status !== 'IN_PROGRESS' ||
    !milestoneCount ||
    activeMilestone < 1 ||
    activeMilestone > milestoneCount
  ) {
    throw new CustomValidationError(
      'Milestone files can only be changed for the milestone being worked on',
      {}
    )
  }

  return { thesisId: thesis.id, label: 'milestone', milestone: activeMilestone }
}

export const saveMilestoneAttachment = async (
  thesis: Thesis,
  file: Express.Multer.File | undefined
) => {
  try {
    const where = getActiveMilestoneWhere(thesis)
    if (file?.mimetype !== 'application/pdf') {
      throw new CustomValidationError('A PDF file is required', {})
    }

    const fileData = {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
    }
    const existing = await Attachment.findOne({ where })

    if (existing) {
      const previousFilename = existing.filename
      await existing.update(fileData)
      removeFile(previousFilename)
    } else {
      await Attachment.create({ ...where, ...fileData })
    }
  } catch (error) {
    removeFile(file?.filename)
    throw error
  }
}

export const deleteMilestoneAttachment = async (thesis: Thesis) => {
  const existing = await Attachment.findOne({
    where: getActiveMilestoneWhere(thesis),
  })

  await existing?.destroy()
  removeFile(existing?.filename)
}
