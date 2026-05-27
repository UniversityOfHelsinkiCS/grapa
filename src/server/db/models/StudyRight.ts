import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'

import { sequelize } from '../connection'

class StudyRight extends Model<
  InferAttributes<StudyRight>,
  InferCreationAttributes<StudyRight>
> {
  declare id: string

  declare programId: string

  declare userId: string

  declare startDate: string

  declare endDate: string

  declare programCode: string
}

StudyRight.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    programId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'programs',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    programCode: {
      type: DataTypes.STRING,
      allowNull: false,
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
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    underscored: true,
    sequelize,
  }
)

export default StudyRight
