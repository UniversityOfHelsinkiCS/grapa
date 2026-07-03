import express from 'express'
import { GraderData, ServerPostRequest, ThesisData, User } from '../types'
import { sequelize } from '../db/connection'

import { EventLog, Thesis, Program } from '../db/models'

import { RequestWithUser } from '../types'
import withStudyRight from '../middleware/withStudyRight'
import { getPrimaryStudyTrackId } from '../util/studyTracks'

import {
  getPaginatedTheses,
  createThesis,
  getSingleThesis,
} from '../services/thesisService'

import ethesisUserHandler from '../middleware/ethesisUser'
import parseFormDataJson from '../middleware/parseFormDataJson'
import parseMultipartFormData from '../middleware/attachment'
import { validateThesisDataStudentMiddleware } from '../validators/thesis'

import { handleAttachmentByLabel } from './thesisAttachmentHelpers'

import {
  handleGradersChangeEventLog,
  handleStatusChangeEventLog,
  handleSupervisionsChangeEventLog,
} from '../services/thesisHelpers'

import {
  handleStatusChangeEmail,
  handleThesisCreationEmail,
} from '../services/thesisNotificationService'

import { cleanThesisUserData } from '../services/thesisService'
import { getProgram, getPrograms } from '../services/programService'
import { fetchThesisById, updateThesis } from '../services/thesisService'
import {
  getOwnActiveTheses,
  getStudentStudyRights,
} from '../services/studentService'

import { deleteThesisAttachments } from './thesisAttachmentHelpers'
import { type Transaction } from 'sequelize'

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
    missingSecondGrader: req.query.missingSecondGrader === 'true',
    lastMilestone: req.query.lastMilestone === 'true',
    ethesisReadyStudentStarted: req.query.ethesisReadyStudentStarted === 'true',
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
  if (!['DRAFT', 'SUGGESTED'].includes(thesisData.status)) {
    throw Error(
      "Student's cannot create theses with other statuses than DRAFT or SUGGESTED"
    )
  }

  if (!thesisData.authors.map((author: any) => author.id).includes(user.id)) {
    throw Error('Student must be an author in thesis')
  }

  if (thesisData.approvers?.length > 0) {
    throw Error("Student's cannot add approvers")
  }

  // if (thesisData.graders?.length > 0) {
  //   throw Error("Student's cannot add graders")
  // }

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
  parseMultipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisDataStudentMiddleware,
  async (req: ServerPostRequest, res: any) => {
    const thesisData = req.body

    if (thesisData.studyTrackId && thesisData.programId) {
      const program = await Program.findByPk(thesisData.programId)
      const options = (program as any)?.options
      thesisData.studyTrackId =
        getPrimaryStudyTrackId(options, thesisData.studyTrackId) || undefined
    }

    try {
      await validateThesisDataStudent(thesisData, req.user)
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

    const theses = (await getOwnActiveTheses(req.user)).map(
      (thesis) => thesis.program_id
    )
    if (theses.includes(thesisData.programId)) {
      res
        .status(400)
        .send(
          "Student's cannot create more than one active thesis for studyright"
        )
      return
    }

    thesisData.graders = thesisData.supervisions
      .filter((s) => s.isPrimarySupervisor)
      .map((s) => {
        return {
          isPrimaryGrader: true,
          isExternal: false,
          user: s.user,
        }
      }) as unknown as GraderData[]

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

studentRouter.delete(
  '/theses/:id',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: ServerDeleteRequest, res) => {
    const deleteThesis = async (id: string, transaction: Transaction) => {
      await Thesis.destroy({ where: { id }, transaction })
    }

    const { id } = req.params

    //@ts-expect-error it only need isAdmin in this case
    const thesis = await fetchThesisById(id as string, {
      isAdmin: true,
    })

    if (!thesis) res.status(404).send('Thesis not found')

    if (thesis.status != 'DRAFT')
      res
        .status(401)
        .send("Student's cannot delete theses with other statuses than DRAFT")

    if (!(thesis.authors.filter((a) => a.id == req.user.id).length > 0))
      res.status(401).send("Student's cannot delete theses they did not author")

    await sequelize.transaction(async (t) => {
      await deleteThesisAttachments(id as string, t)
      await deleteThesis(id as string, t)

      await EventLog.create(
        {
          userId: req.user.id,
          type: 'THESIS_DELETED',
          data: thesis.toJSON(),
        },
        { transaction: t }
      )
    })

    res.status(204).send(`Deleted thesis with id ${id}`)
  }
)

studentRouter.put(
  '/theses/:id',
  ethesisUserHandler,
  parseMultipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisDataStudentMiddleware,
  async (req: ServerPostRequest, res: any) => {
    const { id } = req.params
    const user = req.user

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

    let thesisData = req.body
    let options = (originalThesis as any).program?.options

    if (thesisData.studyTrackId && thesisData.programId) {
      if (thesisData.programId !== originalThesis.programId) {
        const program = await Program.findByPk(thesisData.programId)
        options = (program as any)?.options
      }
      thesisData.studyTrackId =
        getPrimaryStudyTrackId(options, thesisData.studyTrackId) || undefined
    }

    // this is only to be used when making minor modifications to the original thesis from backend
    // and data used for the modification is validated separately!
    let bypassChecks = false

    // Enforce that milestones can only be changed when IN_PROGRESS
    if (originalThesis.status !== 'IN_PROGRESS') {
      thesisData.milestone = originalThesis.milestone
    }

    const isMilestoneUpdate =
      originalThesis.milestone != thesisData.milestone &&
      !isNaN(thesisData.milestone)

    const isIdleUpdate =
      originalThesis.isIdle !== thesisData.isIdle &&
      typeof thesisData.isIdle === 'boolean'

    if (isMilestoneUpdate || isIdleUpdate) {
      thesisData = {
        ...originalThesis,
        ...(isMilestoneUpdate && { milestone: thesisData.milestone }),
        ...(isIdleUpdate && { isIdle: thesisData.isIdle }),
      }
      bypassChecks = true
    }

    if (!bypassChecks && originalThesis.status != 'DRAFT') {
      res
        .status(400)
        .send("Student's cannot modify theses with other statuses than DRAFT")
      return
    }

    if (!bypassChecks) {
      try {
        await validateThesisDataStudent(thesisData, user)
      } catch {
        res.status(400).send('Thesis data not valid')
        return
      }
    }

    if (thesisData.status == 'SUGGESTED') {
      const theses = (await getOwnActiveTheses(req.user)).map(
        (thesis) => thesis.program_id
      )
      if (theses.includes(thesisData.programId)) {
        res
          .status(400)
          .send(
            "Student's cannot create more than one active thesis for studyright"
          )
        return
      }
    }

    if (!bypassChecks && ['DRAFT', 'SUGGESTED'].includes(thesisData.status)) {
      thesisData.graders = thesisData.supervisions
        .filter((s) => s.isPrimarySupervisor)
        .map((s) => {
          return {
            isPrimaryGrader: true,
            isExternal: false,
            user: s.user,
          }
        }) as unknown as GraderData[]
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
