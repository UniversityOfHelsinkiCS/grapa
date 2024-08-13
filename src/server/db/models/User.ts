import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'

import { sequelize } from '../connection'

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: string

  declare username: string

  declare firstName: string

  declare lastName: string

  declare email: string

  declare language: string

  declare affiliation: string

  declare isAdmin: boolean

  declare isExternal: boolean

  declare employeeNumber: string | null

  declare studentNumber: string | null

  declare hasStudyRight: boolean | null

  declare departmentId: string | undefined

  declare iamGroups: string[]

  declare favoriteProgramIds: string[]
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
    },
    lastName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    affiliation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    departmentId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    language: {
      type: DataTypes.STRING,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isExternal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    iamGroups: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    employeeNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    studentNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hasStudyRight: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    favoriteProgramIds: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    underscored: true,
    sequelize,
  }
)

export default User
