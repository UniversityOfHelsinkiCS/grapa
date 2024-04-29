import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'
import type { ThesisStatus } from '@backend/types'

import { sequelize } from '../connection'

class Thesis extends Model<
  InferAttributes<Thesis>,
  InferCreationAttributes<Thesis>
> {
  declare id: string

  declare programId: string

  declare topic: string

  declare status: ThesisStatus

  declare startDate: string

  declare targetDate: string | undefined
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
    },
    topic: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      values: ['PLANNING', 'STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
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
