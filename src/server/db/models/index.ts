import User from './User'
import Thesis from './Thesis'
import Supervision from './Supervision'
import Author from './Author'
import Approver from './Approver'
import Attachment from './Attachment'
import Program from './Program'
import StudyTrack from './StudyTrack'
import Grader from './Grader'
import ProgramManagement from './ProgramManagement'
import Department from './Department'
import DepartmentAdmin from './DepartmentAdmin'
import EventLog from './EventLog'

User.belongsToMany(Thesis, {
  through: Supervision,
  as: 'theses',
})

Thesis.belongsToMany(User, {
  through: Supervision,
  as: 'supervisors',
})

// see GET /theses endpoint for more details on why
// we need both of theses associations
Thesis.hasMany(Supervision, { foreignKey: 'thesisId', as: 'supervisions' })
Thesis.hasMany(Supervision, {
  foreignKey: 'thesisId',
  as: 'supervisionsForFiltering',
})

Supervision.belongsTo(User, { as: 'user' })
Supervision.belongsTo(Thesis, { as: 'thesis' })

ProgramManagement.belongsTo(User, { as: 'user' })
ProgramManagement.belongsTo(Program, { as: 'program' })
Program.hasMany(ProgramManagement)

DepartmentAdmin.belongsTo(User, { as: 'user' })
DepartmentAdmin.belongsTo(Department, { as: 'department' })
Department.hasMany(DepartmentAdmin)

Grader.belongsTo(User, { as: 'user' })

Thesis.hasMany(Grader, { foreignKey: 'thesisId' })
Thesis.hasMany(Grader, { foreignKey: 'thesisId', as: 'graders' })

Grader.belongsTo(Thesis, { as: 'thesis' })

Author.belongsTo(User, { as: 'user' })
Thesis.belongsToMany(User, {
  through: Author,
  as: 'authors',
})

Approver.belongsTo(User, { as: 'user' })
Thesis.belongsToMany(User, {
  through: Approver,
  as: 'approvers',
})

Attachment.belongsTo(Thesis, { as: 'thesis' })
Thesis.hasOne(Attachment, { as: 'researchPlan', foreignKey: 'thesisId' })
Thesis.hasOne(Attachment, { as: 'waysOfWorking', foreignKey: 'thesisId' })

Program.hasMany(StudyTrack, { as: 'studyTracks' })
StudyTrack.belongsTo(Program, { as: 'program' })

EventLog.belongsTo(User, { as: 'user' })
EventLog.belongsTo(Thesis, { as: 'thesis' })
Thesis.hasMany(EventLog)

export {
  User,
  Thesis,
  Supervision,
  Author,
  Attachment,
  Approver,
  Program,
  StudyTrack,
  Grader,
  ProgramManagement,
  Department,
  DepartmentAdmin,
  EventLog,
}
