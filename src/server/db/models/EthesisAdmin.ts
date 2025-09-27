import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'

import { sequelize } from '../connection'

class EthesisAdmin extends Model<
  InferAttributes<EthesisAdmin>,
  InferCreationAttributes<EthesisAdmin>
> {
  declare id: string

  declare programId: string

  declare userId: string
}

EthesisAdmin.init(
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

export default EthesisAdmin
