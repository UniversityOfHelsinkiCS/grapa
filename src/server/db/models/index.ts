import User from './User.ts'
import SeminarSupervision from './SeminarSupervision.ts'
import Thesis from './Thesis.ts'
import Supervision from './Supervision.ts'
import Author from './Author.ts'
import StudyRight from './StudyRight.ts'
import Approver from './Approver.ts'
import Attachment from './Attachment.ts'
import Program from './Program.ts'
import StudyTrack from './StudyTrack.ts'
import Grader from './Grader.ts'
import ProgramManagement from './ProgramManagement.ts'
import StudyTrackManagement from './StudyTrackManagement.ts'
import Department from './Department.ts'
import DepartmentAdmin from './DepartmentAdmin.ts'
import EventLog from './EventLog.ts'
import EthesisAdmin from './EthesisAdmin.ts'

User.belongsToMany(Thesis, {
  through: Supervision,
  as: 'theses',
})

User.belongsToMany(Thesis, {
  through: SeminarSupervision,
  as: 'seminarSupervisedTheses',
})

Thesis.belongsToMany(User, {
  through: Supervision,
  as: 'supervisors',
})

Thesis.belongsToMany(User, {
  through: SeminarSupervision,
  as: 'seminarSupervisors',
})

User.hasMany(EthesisAdmin, { foreignKey: 'userId', as: 'ethesistAdmins' })
EthesisAdmin.belongsTo(User, { foreignKey: 'userId', as: 'user' })

// see GET /theses endpoint for more details on why
// we need both of theses associations
Thesis.hasMany(Supervision, { foreignKey: 'thesisId', as: 'supervisions' })
Thesis.hasMany(SeminarSupervision, {
  foreignKey: 'thesisId',
  as: 'seminarSupervisions',
})
Thesis.hasMany(Supervision, {
  foreignKey: 'thesisId',
  as: 'supervisionsForDepartmentFiltering',
})

Supervision.belongsTo(User, { as: 'user' })
Supervision.belongsTo(User, {
  as: 'userForDepartmentFiltering',
  foreignKey: 'userId',
})
Supervision.belongsTo(Thesis, { as: 'thesis' })

SeminarSupervision.belongsTo(User, { as: 'user' })
SeminarSupervision.belongsTo(Thesis, { as: 'thesis' })

ProgramManagement.belongsTo(User, { as: 'user', foreignKey: 'userId' })
ProgramManagement.belongsTo(Program, { as: 'program', foreignKey: 'programId' })
Program.hasMany(ProgramManagement, { foreignKey: 'programId' })

DepartmentAdmin.belongsTo(User, { as: 'user', foreignKey: 'userId' })
DepartmentAdmin.belongsTo(Department, {
  as: 'department',
  foreignKey: 'departmentId',
})
Department.hasMany(DepartmentAdmin, { foreignKey: 'departmentId' })

Grader.belongsTo(User, { as: 'user' })

Thesis.hasMany(Grader, { foreignKey: 'thesisId' })
Thesis.hasMany(Grader, { foreignKey: 'thesisId', as: 'graders' })

Grader.belongsTo(Thesis, { as: 'thesis' })

StudyRight.belongsTo(User, { as: 'user' })
StudyRight.belongsTo(Program, { as: 'program' })

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
Thesis.hasMany(Attachment, {
  as: 'milestoneAttachments',
  foreignKey: 'thesisId',
})

// Program and Thesis association
Thesis.belongsTo(Program, { as: 'program', foreignKey: 'programId' })
Program.hasMany(Thesis, { as: 'theses', foreignKey: 'programId' })

Program.hasMany(StudyTrack, { as: 'studyTracks', foreignKey: 'programId' })
StudyTrack.belongsTo(Program, { as: 'program', foreignKey: 'programId' })

StudyTrackManagement.belongsTo(User, { as: 'user', foreignKey: 'userId' })
StudyTrackManagement.belongsTo(StudyTrack, {
  as: 'studyTrack',
  foreignKey: 'studyTrackId',
})
StudyTrack.hasMany(StudyTrackManagement, { foreignKey: 'studyTrackId' })

EventLog.belongsTo(User, { as: 'user' })
EventLog.belongsTo(Thesis, { as: 'thesis' })
Thesis.hasMany(EventLog)

export {
  User,
  Thesis,
  SeminarSupervision,
  Supervision,
  Author,
  Attachment,
  Approver,
  Program,
  StudyTrack,
  Grader,
  ProgramManagement,
  StudyTrackManagement,
  Department,
  DepartmentAdmin,
  EventLog,
  EthesisAdmin,
  StudyRight,
}
