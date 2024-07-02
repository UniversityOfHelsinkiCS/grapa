import express from 'express'

const logoutRouter = express.Router()

logoutRouter.get('/logout', async (req, res, next) => {
  // eslint-disable-next-line consistent-return
  req.logout((err) => {
    if (err) return next(err)
  })

  res.status(200).end()
})

export default logoutRouter
