import { inDevelopment } from '../../config'
import { adminIams } from '../util/config'

const parseIamGroups = (iamGroups: string) =>
  iamGroups?.split(';').filter(Boolean) ?? []

const checkAdmin = (iamGroups: string[]) =>
  iamGroups.some((iam) => adminIams.includes(iam))

const mockHeaders = {
  uid: 'testUser',
  username: 'testuser',
  givenName: 'Testi',
  sn: 'Kayttaja',
  mail: 'grp-toska@helsinki.fi',
  preferredlanguage: 'fi',
  hypersonsisuid: 'hy-hlo-1441871',
  hygroupcn: 'grp-toska;hy-employees',
}

const userMiddleware = (req: any, _: any, next: any) => {
  if (req.path.includes('/login')) return next()

  const headers = inDevelopment ? mockHeaders : req.headers

  const {
    uid: username,
    mail: email,
    preferredlanguage: language,
    givenName: firstName,
    sn: lastName,
    hypersonsisuid: id,
    hygroupcn,
  } = headers

  const iamGroups = parseIamGroups(hygroupcn)

  const acualUser = {
    id: id || username,
    username,
    firstName,
    lastName,
    email,
    language,
    iamGroups,
    isAdmin: checkAdmin(iamGroups),
  }

  req.user = acualUser

  return next()
}

export default userMiddleware
