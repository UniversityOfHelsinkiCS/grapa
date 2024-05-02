import User from './User'
import Thesis from './Thesis'
import Supervision from './Supervision'

User.belongsToMany(Thesis, {
  through: Supervision,
  as: 'theses',
})

Thesis.belongsToMany(User, {
  through: Supervision,
  as: 'supervisors',
})

Supervision.belongsTo(User, { as: 'user' })

Thesis.hasMany(Supervision, { as: 'supervisions' })

Supervision.belongsTo(Thesis, { as: 'thesis' })

export { User, Thesis, Supervision }
