import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'

import { sequelize } from '../connection'

class DepartmentAdmin extends Model<
  InferAttributes<DepartmentAdmin>,
  InferCreationAttributes<DepartmentAdmin>
> {
  declare id: string

  declare departmentId: string

  declare userId: string
}

DepartmentAdmin.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    departmentId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'departments',
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
    indexes: [{ fields: ['department_id', 'user_id'], unique: true }],
  }
)

export default DepartmentAdmin
