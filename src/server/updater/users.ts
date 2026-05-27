import { sequelize } from '../db/connection'
import { QueryTypes } from 'sequelize'
import { User, StudyRight } from '../db/models'
import { mangleData } from './mangleData'
import { safeBulkCreate } from './util'

const parsePreferredLanguageUrnToLanguage = (urn: string) => {
  const fallBackLanguage = 'en'
  if (!urn) return fallBackLanguage
  const possibleLanguages = ['fi', 'en', 'sv']
  const splitArray = urn.split(':')
  const language = splitArray[splitArray.length - 1]
  return possibleLanguages.includes(language) ? language : fallBackLanguage
}

interface SisuUser {
  id: string
  preferredLanguageUrn: string
  eduPersonPrincipalName: string
  firstNames: string
  lastName: string
  primaryEmail: string
  employeeNumber: string
  studentNumber: string
  hasStudyRight: boolean
  studyRights: object
}

const usersHandler = async (users: SisuUser[]) => {
  const parsedUsers = users.map((user) => ({
    id: user.id,
    language: parsePreferredLanguageUrnToLanguage(user.preferredLanguageUrn),
    username: user.eduPersonPrincipalName
      ? user.eduPersonPrincipalName.split('@')[0]
      : user.id,
    firstName: user.firstNames,
    lastName: user.lastName,
    email: user.primaryEmail,
    studentNumber: user.studentNumber,
    employeeNumber: user.employeeNumber,
    hasStudyRight: user.hasStudyRight,
    studyRights: user.studyRights,
    raw: user,
  }))

  // const programs = await Program.findAll()
  const programsQuery = await sequelize.query(
    'SELECT DISTINCT id FROM programs',
    {
      type: QueryTypes.SELECT,
    }
  )

  //@ts-expect-error it is there
  const programs = new Set(programsQuery.map((program) => program.id))

  const parsedStudyRights = []

  for (const user_index in users) {
    const user = users[user_index]
    if (user.studyRights) {
      for (const index in user.studyRights) {
        //@ts-expect-error it's just a json object
        const studyRight = user.studyRights[index]
        parsedStudyRights.push({
          id: studyRight.id,
          programId: programs.has(studyRight.code) ? studyRight.code : null,
          programCode: studyRight.code,
          userId: user.id,
          startDate: studyRight.start_date,
          endDate: studyRight.end_date,
        })
      }
    }
  }

  // By default updates all fields on duplicate id
  await safeBulkCreate({
    entityName: 'User',
    entities: parsedUsers,
    bulkCreate: async (e, opt) => User.bulkCreate(e, opt),
    fallbackCreate: async (e, opt) => User.upsert(e, opt),
    options: {
      updateOnDuplicate: [
        'id',
        'language',
        'username',
        'firstName',
        'lastName',
        'email',
        'studentNumber',
        'employeeNumber',
        'hasStudyRight',
      ],
      conflictAttributes: ['id'],
    },
  })

  // By default updates all fields on duplicate id
  await safeBulkCreate({
    entityName: 'StudyRight',
    entities: parsedStudyRights,
    bulkCreate: async (e, opt) => StudyRight.bulkCreate(e, opt),
    fallbackCreate: async (e, opt) => StudyRight.upsert(e, opt),
    options: {
      updateOnDuplicate: [
        'id',
        'programId',
        'programCode',
        'userId',
        'startDate',
        'endDate',
      ],
      conflictAttributes: ['id'],
    },
  })
}

export const fetchUsers = async () => {
  await mangleData({ url: 'persons', limit: 10_000, handler: usersHandler })
}
