import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'

import { sequelize } from '../connection'

class StudyTrackManagement extends Model<
  InferAttributes<StudyTrackManagement>,
  InferCreationAttributes<StudyTrackManagement>
> {
  declare id: string

  declare studyTrackId: string

  declare userId: string
}

StudyTrackManagement.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    studyTrackId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'study_tracks',
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
    indexes: [{ fields: ['study_track_id', 'user_id'], unique: true }],
  }
)

export default StudyTrackManagement
