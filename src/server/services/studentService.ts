import { User } from '../types'

import { StudyRight } from '../db/models'

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
