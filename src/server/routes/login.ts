import express from 'express'
import passport from 'passport'

import { BASE_PATH } from '../../config'

const loginRouter = express.Router()

loginRouter.get('/', passport.authenticate('oidc'))

loginRouter.get(
  '/callback',
  passport.authenticate('oidc', {
    failureRedirect: `${BASE_PATH || ''}/noaccess`,
  }),
  (_, res) => {
    res.redirect(BASE_PATH || '/')
  }
)

export default loginRouter
