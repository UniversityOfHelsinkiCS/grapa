import mockUser from '../mocs/user'

const userMiddleware = (req: any, _: any, next: any) => {
  if (req.path.includes('/login')) return next()

  req.user = mockUser

  return next()
}

export default userMiddleware
