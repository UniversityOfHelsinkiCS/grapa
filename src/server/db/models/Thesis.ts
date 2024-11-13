import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
  NonAttribute,
} from 'sequelize'
import type { ThesisStatus } from '@backend/types'

import { sequelize } from '../connection'
import Grader from './Grader'
import Supervision from './Supervision'
import User from './User'

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

  declare targetDate: string | undefined

  declare authors: NonAttribute<User[]>

  declare graders: NonAttribute<Grader[]>

  declare supervisions: NonAttribute<Supervision[]>
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
    status: {
      type: DataTypes.ENUM,
      values: ['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
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
  },
  {
    underscored: true,
    sequelize,
  }
)

export default Thesis
