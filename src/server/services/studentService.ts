import { User } from '../types'

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
  // TODO: not hardcode this when we get the studyRight data from sis-importer
  const programsWithStudyRights: string[] = []
  if (user.iamGroups.includes('hy-ktdk-students')) {
    programsWithStudyRights.push('MH60_001')
  }

  return programsWithStudyRights
}
