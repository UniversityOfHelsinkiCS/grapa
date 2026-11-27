import {
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  DataTypes,
} from 'sequelize'

import { sequelize } from '../connection.ts'

class ApplicationConfiguration extends Model<
  InferAttributes<ApplicationConfiguration>,
  InferCreationAttributes<ApplicationConfiguration>
> {
  declare id: string

  declare value: string
}

ApplicationConfiguration.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    underscored: true,
    sequelize,
  }
)

export default ApplicationConfiguration
