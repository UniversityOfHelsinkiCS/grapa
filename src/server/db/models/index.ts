import User from './User'
import Thesis from './Thesis'
import Supervision from './Supervision'
import Author from './Author'
import Attachment from './Attachment'
import Program from './Program'
import StudyTrack from './StudyTrack'
import Grader from './Grader'
import ProgramManagement from './ProgramManagement'

User.belongsToMany(Thesis, {
  through: Supervision,
  as: 'theses',
})

Thesis.belongsToMany(User, {
  through: Supervision,
  as: 'supervisors',
})

Thesis.hasMany(Supervision, { foreignKey: 'thesisId' })
Thesis.hasMany(Supervision, { foreignKey: 'thesisId', as: 'supervisions' })

Supervision.belongsTo(User, { as: 'user' })
Supervision.belongsTo(Thesis, { as: 'thesis' })

ProgramManagement.belongsTo(User, { as: 'user' })
ProgramManagement.belongsTo(Program, { as: 'program' })

Grader.belongsTo(User, { as: 'user' })

Thesis.hasMany(Grader, { foreignKey: 'thesisId' })
Thesis.hasMany(Grader, { foreignKey: 'thesisId', as: 'graders' })

Grader.belongsTo(Thesis, { as: 'thesis' })

Author.belongsTo(User, { as: 'user' })
Thesis.belongsToMany(User, {
  through: Author,
  as: 'authors',
})

// Thesis.hasMany(Author, { as: 'authors' })

Attachment.belongsTo(Thesis, { as: 'thesis' })
Thesis.hasOne(Attachment, { as: 'researchPlan', foreignKey: 'thesisId' })
Thesis.hasOne(Attachment, { as: 'waysOfWorking', foreignKey: 'thesisId' })

Program.hasMany(StudyTrack, { as: 'studyTracks' })
StudyTrack.belongsTo(Program, { as: 'program' })

export {
  User,
  Thesis,
  Supervision,
  Author,
  Attachment,
  Program,
  StudyTrack,
  Grader,
  ProgramManagement,
}
