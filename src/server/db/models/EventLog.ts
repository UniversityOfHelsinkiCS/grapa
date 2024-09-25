import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  UUIDV4,
} from 'sequelize'

import { sequelize } from '../connection'
import { EventLogType } from '../../../config'

class EventLog extends Model<
  InferAttributes<EventLog>,
  InferCreationAttributes<EventLog>
> {
  declare id: string

  declare thesisId: string | null

  declare userId: string | null

  declare type: EventLogType | null

  declare data: Record<string, unknown> | null // jsonb
}

EventLog.init(
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    thesisId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'theses',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    underscored: true,
    sequelize,
    tableName: 'event_log',
  }
)

export default EventLog
