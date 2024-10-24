import express from 'express'
import { LOGOUT_REDIRECT_URL } from '../util/config'

const logoutRouter = express.Router()

logoutRouter.post('/', async (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err)
  })

  res.send({ url: LOGOUT_REDIRECT_URL })
})

export default logoutRouter
