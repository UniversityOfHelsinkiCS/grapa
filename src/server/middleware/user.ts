import { getUser, isAuthorized } from '../util/oidc'
import type { UserInfo } from '../types'

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

  const headers = mockHeaders

  // if user is not an admin or hy-employees, return 403
  if (!isAuthorized(headers)) {
    return next({ status: 403, message: 'Forbidden' })
  }

  req.user = getUser(headers)

  return next()
}

export default userMiddleware
