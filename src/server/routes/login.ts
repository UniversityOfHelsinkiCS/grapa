import express from 'express'
import passport from 'passport'

import { PUBLIC_URL } from '../../config'

const loginRouter = express.Router()

loginRouter.get('/', passport.authenticate('oidc'))

loginRouter.get(
  '/callback',
  passport.authenticate('oidc', { failureRedirect: PUBLIC_URL || '/' }),
  (_, res) => {
    res.redirect(PUBLIC_URL || '/')
  }
)

export default loginRouter
