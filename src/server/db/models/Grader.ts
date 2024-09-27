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

class Grader extends Model<
  InferAttributes<Grader>,
  InferCreationAttributes<Grader>
> {
  declare id: string

  declare thesisId: string

  declare userId: string

  declare isPrimaryGrader: boolean

  declare user: NonAttribute<User>
}

Grader.init(
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
        model: 'theses',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    isPrimaryGrader: {
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

export default Grader
