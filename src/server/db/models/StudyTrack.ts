import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'

import { sequelize } from '../connection'

class StudyTracks extends Model<
  InferAttributes<StudyTracks>,
  InferCreationAttributes<StudyTracks>
> {
  declare id: string

  declare name: { fi: string; en: string; sv: string }

  declare programId: string
}

StudyTracks.init(
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
    programId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'programs',
        key: 'id',
      },
    },
  },
  {
    underscored: true,
    sequelize,
  }
)

export default StudyTracks
