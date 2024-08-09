import {
  Issuer,
  Strategy,
  TokenSet,
  UnknownObject,
  UserinfoResponse,
} from 'openid-client'
import passport from 'passport'

import { inE2EMode } from '../../config'
import {
  OIDC_ISSUER,
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
  OIDC_REDIRECT_URI,
} from './config'
import type { UserInfo, User as UserType } from '../types'
import { User } from '../db/models/index'

const params = {
  claims: {
    id_token: {
      uid: { essential: true },
      hyPersonSisuId: { essential: true },
    },
    userinfo: {
      email: { essential: true },
      hyGroupCn: { essential: true },
      preferredLanguage: null,
      given_name: null,
      family_name: null,
    },
  },
}

const checkAdmin = (iamGroups: string[]) =>
  iamGroups.some((iamGroup) =>
    ['hy-ypa-opa-ote', 'grp-toska'].includes(iamGroup)
  )

const getClient = async () => {
  const issuer = await Issuer.discover(OIDC_ISSUER)

  const client = new issuer.Client({
    client_id: OIDC_CLIENT_ID,
    client_secret: OIDC_CLIENT_SECRET,
    redirect_uris: [OIDC_REDIRECT_URI],
    response_types: ['code'],
  })

  return client
}

export const getUser = (userinfo: UserInfo): UserType => {
  const {
    uid: username,
    hyPersonSisuId: id,
    email,
    hyGroupCn: iamGroups,
    preferredLanguage: language,
    given_name: firstName,
    family_name: lastName,
  } = userinfo as unknown as UserInfo

  return {
    username,
    id: id || username,
    email,
    iamGroups,
    language,
    firstName,
    lastName,
    isAdmin: checkAdmin(iamGroups),
  }
}

export const isAuthorized = (userinfo: UserInfo) => {
  const user = getUser(userinfo)
  return user.isAdmin || user.iamGroups.includes('hy-employees')
}

const verifyLogin = async (
  _tokenSet: TokenSet,
  userinfo: UserinfoResponse<UnknownObject, UnknownObject>,
  done: (err: any, user?: unknown) => void
) => {
  // if user is not an admin or hy-employees, return 403
  if (!isAuthorized(userinfo as unknown as UserInfo)) {
    done(null, false)
    return
  }

  const user = getUser(userinfo as unknown as UserInfo)

  const [updatedUser] = await User.upsert(user)

  done(null, updatedUser.toJSON())
}

const setupAuthentication = async () => {
  if (inE2EMode) return

  const client = await getClient()

  passport.serializeUser((user, done) => {
    const { id, iamGroups, isAdmin } = user as UserType

    return done(null, { id, iamGroups, isAdmin })
  })

  passport.deserializeUser(
    async ({ id, iamGroups }: { id: string; iamGroups: string[] }, done) => {
      const user = await User.findByPk(id)

      if (!user) return done(new Error('User not found'))

      return done(null, { ...user.dataValues, iamGroups })
    }
  )

  passport.use('oidc', new Strategy({ client, params }, verifyLogin))
}

export default setupAuthentication
