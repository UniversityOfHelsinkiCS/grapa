import express from 'express'
import { ServerPostRequest, ThesisData } from '../types'
import { sequelize } from '../db/connection'

import { EventLog } from '../db/models'

import { RequestWithUser } from '../types'
import withStudyRight from '../middleware/withStudyRight'

import {
  getPaginatedTheses,
  createThesis,
  getSingleThesis,
} from '../services/thesisService'

import ethesisUserHandler from '../middleware/ethesisUser'
import parseFormDataJson from '../middleware/parseFormDataJson'
import parseMutlipartFormData from '../middleware/attachment'
import { validateThesisData } from '../validators/thesis'

import { handleAttachmentByLabel } from './thesisAttachmentHelpers'
import { handleThesisCreationEmail } from './thesisHelpers'
import { cleanThesisUserData } from '../services/thesisService'
import { getProgram, getPrograms } from '../services/programService'

const studentRouter = express.Router()

studentRouter.use(withStudyRight)

studentRouter.get('/programs', async (req: RequestWithUser, res: any) => {
  const language = (req.query.language ?? 'en') as string

  // TODO: not hardcode this when we get the studyRight data from sis-importer
  const programsWithStudyRights: string[] = []
  if (req.user.iamGroups.includes('hy-ktdk-students')) {
    programsWithStudyRights.push('MH60_001')
  }

  const programs = await getPrograms(
    false,
    true,
    false,
    language,
    [],
    req.user.id
  )

  const result = programs.filter((program) => {
    return (
      program.options.allowStudentStartedProcess &&
      programsWithStudyRights.includes(program.id)
    )
  })

  res.send(result)
})

studentRouter.get('/theses', async (req: RequestWithUser, res: any) => {
  const result = await getPaginatedTheses({
    ...req.query,
    currentUser: req.user,
    onlyAuthored: true,
    sortOrder: req.query.sortOrder as 'asc' | 'desc',
    sortBy: req.query.sortBy as string,
    departmentId: req.query.departmentId as string,
    status: req.query.status as string,
    authorsPartial: req.query.authorsPartial as string,
    topicPartial: req.query.topicPartial as string,
    programNamePartial: req.query.programNamePartial as string,
    programId: req.query.programId as string,
    language: req.query.language as string,
    limit: req.query.limit as string,
    offset: req.query.offset as string,
    hideUserProperties: true,
  })

  // This should ideally be done in db, but to do that thesisHelpers would need major modifications
  const filtered_theses: ThesisData[] = result.theses.filter(
    (thesis) => thesis.program.options.allowStudentStartedProcess
  )

  //@ts-expect-error these are the same type
  result.theses = filtered_theses

  return res.send(result)
})

studentRouter.get('/theses/:id', async (req: RequestWithUser, res: any) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    return res.status(400).send('Thesis ID is required')
  }

  const thesisData = await getSingleThesis(id, req.user, { onlyAuthored: true })
  cleanThesisUserData(thesisData)

  if (!thesisData.program.options.allowStudentStartedProcess) {
    res.status(401).send()
    return
  }

  res.send(thesisData)
})

studentRouter.post(
  '/thesis',
  ethesisUserHandler,
  parseMutlipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisData,
  async (req: ServerPostRequest, res: any) => {
    const thesisData = req.body

    // Restrict students from creating theses with other statuses than DRAFT
    if (thesisData.status != 'DRAFT') {
      res
        .status(400)
        .send("Student's cannot create theses with other statuses than DRAFT")
      return
    }

    if (!thesisData.authors.map((author) => author.id).includes(req.user.id)) {
      res.status(400).send('Student must be an author in thesis')
      return
    }

    if (thesisData.programId) {
      const programId: string = thesisData.programId
      const program = await getProgram(programId, 'fi')

      if (program == null) {
        res.status(400).send('Program id does not exist')
        return
      }
      if (!program.options.allowStudentStartedProcess) {
        res
          .status(401)
          .send('Program is not allowing thesis submissions from students')
        return
      }
    } else {
      res.status(400).send('Program id is required')
    }

    const createdThesis = await sequelize.transaction(async (t) => {
      const newThesis = await createThesis(thesisData, t)

      await handleAttachmentByLabel(req, newThesis.id, 'researchPlan', t)
      await handleAttachmentByLabel(req, newThesis.id, 'waysOfWorking', t)

      await EventLog.create(
        {
          thesisId: newThesis.id,
          userId: req.user.id,
          type: 'THESIS_CREATED',
        },
        { transaction: t }
      )

      await handleThesisCreationEmail(thesisData, req.user)

      return newThesis.toJSON()
    })
    res.status(201).send(createdThesis)
  }
)

export default studentRouter
