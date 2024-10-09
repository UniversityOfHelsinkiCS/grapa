import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'

import { sequelize } from '../connection'

class ProgramManagement extends Model<
  InferAttributes<ProgramManagement>,
  InferCreationAttributes<ProgramManagement>
> {
  declare id: string

  declare programId: string

  declare userId: string

  declare isThesisApprover: boolean
}

ProgramManagement.init(
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
    isThesisApprover: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    underscored: true,
    sequelize,
    indexes: [{ fields: ['program_id', 'user_id'], unique: true }],
  }
)

export default ProgramManagement
