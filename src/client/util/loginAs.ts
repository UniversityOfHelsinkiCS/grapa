import { EmployeeUser as User } from '@backend/validators/userResponse'

import { LOGIN_AS_LOCAL_STORAGE_KEY } from '../../config'

export const loginAs = (user: User) => {
  localStorage.setItem(LOGIN_AS_LOCAL_STORAGE_KEY, JSON.stringify(user))
  window.location.reload()
}
