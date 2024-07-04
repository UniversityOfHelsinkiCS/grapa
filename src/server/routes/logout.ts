import express from 'express'
import { LOGOUT_REDIRECT_URL } from '../util/config'

const logoutRouter = express.Router()

logoutRouter.post('/', async (req, res, next) => {
  // eslint-disable-next-line consistent-return
  req.logout((err) => {
    if (err) return next(err)

    res.redirect(LOGOUT_REDIRECT_URL)
  })
})

export default logoutRouter
