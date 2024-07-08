import { User } from '@backend/types'

export const loginAs = (user: User) => {
  localStorage.setItem('grapa-admin-logged-in-as', JSON.stringify(user))
  window.location.reload()
}
