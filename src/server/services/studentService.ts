export const cleanUserProperties = (user: any) => {
  const allowed_keys = [
    'id',
    'username',
    'email',
    'firstName',
    'lastName',
    'affiliation',
  ]
  Object.keys(user).forEach((key) => {
    if (!allowed_keys.includes(key)) user[key] = null
  })
  return user
}
