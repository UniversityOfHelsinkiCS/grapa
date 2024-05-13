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

  declare filename: string

  declare originalname: string

  declare mimetype: string

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
    filename: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_name',
    },
    originalname: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'original_name',
    },
    mimetype: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'mime_type',
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
