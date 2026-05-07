import {
  Strategy,
  TokenSet,
  UnknownObject,
  UserinfoResponse,
} from 'openid-client/passport'

import * as oiclient from 'openid-client'

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
  iamGroups.some((iamGroup) => ['grp-toska'].includes(iamGroup))

const getConfig = async () => {
  const client = await oiclient.discovery(
    new URL(OIDC_ISSUER),
    OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET
  )

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
  // Allow authentication for admins, employees and ktdk students
  return (
    user.isAdmin ||
    user.iamGroups.includes('hy-employees') ||
    user.iamGroups.includes('hy-ktdk-students')
  )
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

  const config = await getConfig()
  const options: StrategyOptions = {
    config,
    params,
    OIDC_REDIRECT_URI,
  }

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

  passport.use('oidc', new Strategy(options, verifyLogin))
}

export default setupAuthentication
