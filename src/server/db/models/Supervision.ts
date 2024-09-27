import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
  NonAttribute,
} from 'sequelize'

import { sequelize } from '../connection'
import User from './User'

class Supervision extends Model<
  InferAttributes<Supervision>,
  InferCreationAttributes<Supervision>
> {
  declare id: string

  declare thesisId: string

  declare userId: string

  declare percentage: number

  declare isPrimarySupervisor: boolean

  declare user: NonAttribute<User>
}

Supervision.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    thesisId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'theses',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    percentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 100,
      },
    },
    isPrimarySupervisor: {
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

export default Supervision
