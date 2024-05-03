import User from './User'
import Thesis from './Thesis'
import Supervision from './Supervision'
import Author from './Author'

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

// Thesis.belongsToMany(User, {
//  through: Author,
//  as: 'authors',
// });

Author.belongsTo(User, { as: 'user' })

Thesis.hasMany(Author, { as: 'authors' })

export { User, Thesis, Supervision, Author }
