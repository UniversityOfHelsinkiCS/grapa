import { getUser, isAuthorized } from '../util/oidc'
import type { UserInfo } from '../types'
import { E2E_USER_HEADER_KEY, inDevelopment, inE2EMode } from '../../config'
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
  // hyGroupCn: ['hy-ktdk-students'] // for testing student access
  hyGroupCn: ['grp-toska', 'hy-employees'],
}

// e2e tests send a seeded user's id, the rest comes from the DB
const getE2EUserHeaders = async (userId: unknown): Promise<UserInfo | null> => {
  if (!inE2EMode || typeof userId !== 'string') return null
  const user = await User.findByPk(userId)
  if (!user) return null
  return {
    uid: user.username,
    hyPersonSisuId: user.id,
    email: user.email,
    hyGroupCn: user.iamGroups,
    preferredLanguage: user.language,
    given_name: user.firstName,
    family_name: user.lastName,
  }
}

const userMiddleware = async (req: any, _: any, next: any) => {
  if (req.path.includes('/login')) return next()

  const e2eUserHeaders = await getE2EUserHeaders(
    req.headers[E2E_USER_HEADER_KEY]
  )

  const headers =
    // for development and e2e mode, use mock headers
    // but for integration (API) tests (inTest === true),
    // use the headers provided by the test
    e2eUserHeaders ??
    (inDevelopment || inE2EMode
      ? mockHeaders
      : {
          uid: req.headers.uid,
          given_name: req.headers.given_name,
          family_name: req.headers.family_name,
          email: req.headers.email,

          preferredLanguage: req.headers.preferredlanguage,
          hyPersonSisuId: req.headers.hypersonsisuid,
          hyGroupCn: parseIamGroups(req.headers.hygroupcn),
        })

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
