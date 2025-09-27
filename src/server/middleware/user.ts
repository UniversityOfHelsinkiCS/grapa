import { getUser, isAuthorized } from '../util/oidc'
import type { UserInfo } from '../types'
import { inDevelopment, inE2EMode } from '../../config'
import { User } from '../db/models'

const parseIamGroups = (iamGroups: string) =>
  iamGroups?.split(';').filter(Boolean) ?? []

const mockHeaders: UserInfo = {
  uid: 'testUser',
  given_name: 'Testi',
  family_name: 'Kayttaja',
  email: 'grp-toska@helsinki.fi',
  preferredLanguage: 'fi',
  hyPersonSisuId: 'hy-hlo-123',
  hyGroupCn: ['grp-toska', 'hy-employees'],
}

const userMiddleware = async (req: any, _: any, next: any) => {
  if (req.path.includes('/login')) return next()

  const headers =
    // for development and e2e mode, use mock headers
    // but for integration (API) tests (inTest === true),
    // use the headers provided by the test
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

  const userFromHeaders = getUser(headers)
  const userFromDb = (await User.findByPk(userFromHeaders.id))?.toJSON()

  req.user = { ...userFromDb, ...userFromHeaders }

  return next()
}

export default userMiddleware
