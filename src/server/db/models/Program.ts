import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'

import { sequelize } from '../connection'
import { TranslatedName } from '../../types'

class Program extends Model<
  InferAttributes<Program>,
  InferCreationAttributes<Program>
> {
  declare id: string

  declare name: TranslatedName

  declare options: Record<string, unknown>

  declare level: string

  declare international: boolean

  declare companionFaculties: string[]

  declare enabled: boolean
}

Program.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    level: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    international: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    companionFaculties: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    enabled: {
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

export default Program
