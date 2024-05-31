import User from './User'
import Thesis from './Thesis'
import Supervision from './Supervision'
import Author from './Author'
import Attachment from './Attachment'

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

Author.belongsTo(User, { as: 'user' })
Thesis.belongsToMany(User, {
  through: Author,
  as: 'authors',
})

// Thesis.hasMany(Author, { as: 'authors' })

Attachment.belongsTo(Thesis, { as: 'thesis' })
Thesis.hasOne(Attachment, { as: 'researchPlan', foreignKey: 'thesisId' })
Thesis.hasOne(Attachment, { as: 'waysOfWorking', foreignKey: 'thesisId' })

export { User, Thesis, Supervision, Author, Attachment }
