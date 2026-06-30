import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
  NonAttribute,
} from 'sequelize'
import type { ThesisStatus } from '../../types'

import { sequelize } from '../connection'
import Grader from './Grader'
import SeminarSupervision from './SeminarSupervision'
import Supervision from './Supervision'
import User from './User'
import Program from './Program'

class Thesis extends Model<
  InferAttributes<Thesis>,
  InferCreationAttributes<Thesis>
> {
  declare id: string

  declare programId: string

  declare studyTrackId: string | undefined

  declare topic: string

  declare status: ThesisStatus

  declare startDate: string

  declare milestone: number

  declare milestoneVersion: number

  declare targetDate: string | undefined

  declare ethesisDate: string | undefined

  declare waysOfWorkingValidUntil: string | null | undefined

  declare milestoneOrStatusUpdatedAt: Date | string | null | undefined

  declare isIdle: boolean

  declare authors: NonAttribute<User[]>

  declare graders: NonAttribute<Grader[]>

  declare supervisions: NonAttribute<Supervision[]>

  declare seminarSupervisions: NonAttribute<SeminarSupervision[]>

  declare program: NonAttribute<Program>
}

Thesis.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    programId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'programs',
        key: 'id',
      },
    },
    studyTrackId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'study_tracks',
        key: 'id',
      },
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    milestone: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    milestoneVersion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM,
      values: [
        'DRAFT',
        'SUGGESTED',
        'PLANNING',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
      ],
      allowNull: false,
    },
    startDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ethesisDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    waysOfWorkingValidUntil: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    milestoneOrStatusUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isIdle: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    underscored: true,
    sequelize,
  }
)

export default Thesis
