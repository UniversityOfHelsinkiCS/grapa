import express from 'express'

const logoutRouter = express.Router()

logoutRouter.post('/', async (req, res, next) => {
  // eslint-disable-next-line consistent-return
  req.logout((err) => {
    if (err) return next(err)

    res.redirect('/')
  })
})

export default logoutRouter
