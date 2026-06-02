import { User } from '../types'

import { StudyRight } from '../db/models'
import { sequelize } from '../db/connection'
import { QueryTypes } from 'sequelize'

export const cleanUserProperties = (user: any) => {
  const allowed_keys = [
    'id',
    'username',
    'email',
    'firstName',
    'lastName',
    'affiliation',
  ]
  Object.keys(user).forEach((key) => {
    if (!allowed_keys.includes(key)) user[key] = null
  })
  return user
}

export const getStudentStudyRights = async (user: User) => {
  const studyRights = await StudyRight.findAll({
    where: {
      userId: user.id,
    },
    raw: true,
  })

  const programsWithStudyRights: string[] = studyRights.map((studyright) => {
    return studyright.programCode
  })

  return programsWithStudyRights
}

export const getOwnActiveTheses = async (user: User) => {
  return await sequelize.query(
    `select T.program_id, T.status, T.id, T.topic from authors 
     A left join theses T on A.thesis_id = T.id 
     where A.user_id = :user_id AND T.status = any('{IN_PROGRESS,SUGGESTED,ETHESIS_SENT,PLANNING}')`,
    {
      replacements: {
        user_id: user.id,
      },
      type: QueryTypes.SELECT,
    }
  )
}
