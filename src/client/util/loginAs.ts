import { User } from '@backend/types'

import { LOGIN_AS_LOCAL_STORAGE_KEY } from '../../config'

export const loginAs = (user: User) => {
  localStorage.setItem(LOGIN_AS_LOCAL_STORAGE_KEY, JSON.stringify(user))
  window.location.reload()
}
