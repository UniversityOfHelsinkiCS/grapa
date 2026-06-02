import express from 'express'
import { ServerPostRequest, ThesisData, User } from '../types'
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
import { validateThesisDataStudentMiddleware } from '../validators/thesis'

import { handleAttachmentByLabel } from './thesisAttachmentHelpers'

import {
  handleGradersChangeEventLog,
  handleStatusChangeEmail,
  handleStatusChangeEventLog,
  handleSupervisionsChangeEventLog,
  handleThesisCreationEmail,
} from './thesisHelpers'

import { cleanThesisUserData } from '../services/thesisService'
import { getProgram, getPrograms } from '../services/programService'
import { fetchThesisById, updateThesis } from '../services/thesisService'
import {
  getOwnActiveTheses,
  getStudentStudyRights,
} from '../services/studentService'

const studentRouter = express.Router()

studentRouter.use(withStudyRight)

studentRouter.get('/programs', async (req: RequestWithUser, res: any) => {
  const language = (req.query.language ?? 'en') as string

  const programsWithStudyRights = await getStudentStudyRights(req.user)

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

const validateThesisDataStudent = async (
  thesisData: ThesisData,
  user: User
) => {
  if (!thesisData.authors.map((author: any) => author.id).includes(user.id)) {
    throw Error('Student must be an author in thesis')
  }

  if (!['DRAFT', 'SUGGESTED'].includes(thesisData.status)) {
    throw Error(
      "Student's cannot create theses with other statuses than DRAFT or SUGGESTED"
    )
  }

  if (thesisData.approvers?.length > 0) {
    throw Error("Student's cannot add approvers")
  }

  if (thesisData.graders?.length > 0) {
    throw Error("Student's cannot add graders")
  }

  if (thesisData.programId) {
    const programId: string = thesisData.programId
    const program = await getProgram(programId, 'fi')
    const userStudyRights = await getStudentStudyRights(user)

    if (program == null) {
      throw Error('Program id does not exist')
    }
    if (!userStudyRights.includes(programId)) {
      throw Error('User does not have a valid studyright in the program')
    }
    if (!program.options.allowStudentStartedProcess) {
      throw Error('Program is not allowing thesis submissions from students')
    }
  } else {
    throw Error('Program id is required')
  }
}

studentRouter.post(
  '/theses',
  ethesisUserHandler,
  parseMutlipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisDataStudentMiddleware,
  async (req: ServerPostRequest, res: any) => {
    const thesisData = req.body

    try {
      validateThesisDataStudent(thesisData, req.user)
    } catch {
      res.status(400).send('Thesis data not valid')
      return
    }

    // Restrict students from creating theses with other statuses than DRAFT
    if (thesisData.status != 'DRAFT') {
      res
        .status(400)
        .send("Student's cannot create theses with other statuses than DRAFT")
      return
    }

    const theset = (await getOwnActiveTheses(req.user)).map(
      (thesis) => thesis.program_id
    )
    if (theset.includes(thesisData.programId)) {
      res
        .status(400)
        .send(
          "Student's cannot create more than one active thesis for studyright"
        )
      return
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

studentRouter.put(
  '/theses/:id',
  ethesisUserHandler,
  parseMutlipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisDataStudentMiddleware,
  async (req: ServerPostRequest, res: any) => {
    const { id } = req.params
    const user = req.user
    const thesisData = req.body

    // fetchThesisById checks user permissions for specific theses, but student routes
    // do the relevant checks by themselves, so isAdmin is just used to override those
    // checks
    //@ts-expect-error it only need isAdmin in this case
    const originalThesis = await fetchThesisById(id as string, {
      isAdmin: true,
    })

    if (!originalThesis) {
      res.status(404).send('Requested thesis not found')
      return
    }

    if (
      !originalThesis.authors.map((author) => author.id).includes(req.user.id)
    ) {
      res.status(401).send('Student must be an author in thesis')
      return
    }

    if (originalThesis.status != 'DRAFT') {
      res
        .status(400)
        .send("Student's cannot modify theses with other statuses than DRAFT")
      return
    }

    try {
      validateThesisDataStudent(thesisData, user)
    } catch {
      res.status(400).send('Thesis data not valid')
      return
    }

    let updatedThesis
    await sequelize.transaction(async (t) => {
      await updateThesis(id as string, thesisData, t)

      await handleAttachmentByLabel(req, id as string, 'researchPlan', t)
      await handleAttachmentByLabel(req, id as string, 'waysOfWorking', t)

      //@ts-expect-error it only need isAdmin in this case
      updatedThesis = await fetchThesisById(id as string, { isAdmin: true }, t)

      await handleStatusChangeEventLog(
        originalThesis,
        updatedThesis,
        req.user,
        t
      )
      await handleGradersChangeEventLog(
        originalThesis,
        updatedThesis,
        req.user,
        t
      )
      await handleSupervisionsChangeEventLog(
        originalThesis,
        updatedThesis,
        req.user,
        t
      )
      await handleStatusChangeEmail(originalThesis, updatedThesis, req.user)
    })

    res.send(updatedThesis)
  }
)

export default studentRouter
