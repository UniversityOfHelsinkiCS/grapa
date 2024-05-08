import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'

import { sequelize } from '../connection'

class Attachment extends Model<
  InferAttributes<Attachment>,
  InferCreationAttributes<Attachment>
> {
  declare id: string

  declare thesisId: string

  declare fileName: string

  declare originalName: string

  declare mimeType: string

  declare label: string
}

Attachment.init(
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
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    underscored: true,
    sequelize,
  }
)

export default Attachment
