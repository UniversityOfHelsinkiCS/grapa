import { getUser, isAuthorized } from '../util/oidc'
import type { UserInfo } from '../types'
import { inDevelopment, inE2EMode } from '../../config'

const parseIamGroups = (iamGroups: string) =>
  iamGroups?.split(';').filter(Boolean) ?? []

const mockHeaders: UserInfo = {
  uid: 'testUser',
  given_name: 'Testi',
  family_name: 'Kayttaja',
  email: 'grp-toska@helsinki.fi',
  preferredLanguage: 'fi',
  hyPersonSisuId: 'hy-hlo-1441871',
  hyGroupCn: ['grp-toska', 'hy-employees'],
}

const userMiddleware = (req: any, _: any, next: any) => {
  if (req.path.includes('/login')) return next()

  const headers =
    inDevelopment || inE2EMode
      ? mockHeaders
      : {
          uid: req.headers.uid,
          given_name: req.headers.given_name,
          family_name: req.headers.family_name,
          email: req.headers.email,
          preferredLanguage: req.headers.preferredlanguage,
          hyPersonSisuId: req.headers.hypersonsisuid,
          hyGroupCn: parseIamGroups(req.headers.hygroupcn),
        }

  // if user is not an admin or hy-employees, return 403
  if (!isAuthorized(headers)) {
    return next({ status: 403, message: 'Forbidden' })
  }

  req.user = getUser(headers)

  return next()
}

export default userMiddleware
