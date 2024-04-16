import { User } from '../models'

const user = {
  id: 'hy-hlo-123',
  username: 'testuser',
  firstName: 'Testi',
  lastName: 'Kayttaja',
  email: 'grp-toska@helsinki.fi',
  language: 'fi',
  isAdmin: true,
}

const seedUsers = async () => {
  await User.upsert({
    ...user,
  })
}

export default seedUsers
