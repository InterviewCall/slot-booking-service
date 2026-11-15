import { Association, CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize';

import { BookingCancelSource } from '../../utils/enums/BookingCancelSource';
import { BookingStatus } from '../../utils/enums/BookingStatus';
import DateTimeSlot from './DateTimeSlot.model';
import IdempotencyKey from './IdempotencyKey.model';
import sequelize from './sequelize';

class Booking extends Model<InferAttributes<Booking>, InferCreationAttributes<Booking>> {
    declare id: CreationOptional<bigint>;
    declare dateTimeSlotId: ForeignKey<DateTimeSlot['id']>;
    declare candidateId: number;
    declare submissionId: string;
    declare status: CreationOptional<BookingStatus>;
    declare confirmedAt: CreationOptional<Date | null>;
    declare cancelledAt: CreationOptional<Date | null>;
    declare completedAt: CreationOptional<Date | null>;
    declare cancelSource: CreationOptional<BookingCancelSource | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare deletedAt: CreationOptional<Date | null>;

    declare dateTimeSlot?: NonAttribute<DateTimeSlot>;

    declare static associations: {
        dateTimeSlot: Association<Booking, DateTimeSlot>;
        idempotencyKey: Association<Booking, IdempotencyKey>;
    };
}

Booking.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },

    dateTimeSlotId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: DateTimeSlot,
            key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },

    candidateId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false
    },

    submissionId: {
        type: DataTypes.UUID,
        allowNull: false
    },

    status: {
        type: DataTypes.ENUM(...Object.values(BookingStatus)),
        allowNull: false,
        defaultValue: BookingStatus.INITIATED
    },

    confirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },

    cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },

    completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    },

    cancelSource: {
        type: DataTypes.ENUM(...Object.values(BookingCancelSource)),
        allowNull: true,
        defaultValue: null
    },

    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },

    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    },

    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
    }
}, {
    tableName: 'bookings',
    underscored: true,
    timestamps: true,
    sequelize,
    indexes: [
        {
            fields: ['date_time_slot_id'],
            name: 'idx_bookings_date_time_slot_id',
        },

        {
            fields: ['candidate_id'],
            name: 'idx_bookings_candidate_id',
        },

        {
            fields: ['submission_id'],
            name: 'idx_bookings_submission_id',
        },

        {
            fields: ['status'],
            name: 'idx_bookings_status',
        },
    ],
});

export default Booking;