import {
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  DataTypes,
  UUIDV4,
  type NonAttribute,
} from 'sequelize'

import { sequelize } from '../connection.ts'
import type User from './User.ts'

class SeminarSupervision extends Model<
  InferAttributes<SeminarSupervision>,
  InferCreationAttributes<SeminarSupervision>
> {
  declare id: string

  declare thesisId: string

  declare userId: string

  declare user: NonAttribute<User>
}

SeminarSupervision.init(
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
  },
  {
    underscored: true,
    sequelize,
  }
)

export default SeminarSupervision
