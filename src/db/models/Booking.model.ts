import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

import { BookingStatus } from '../../utils/enums/BookingStatus';
import DateTimeSlot from './DateTimeSlot.model';
import sequelize from './sequelize';

class Booking extends Model<InferAttributes<Booking>, InferCreationAttributes<Booking>> {
    declare id: CreationOptional<number>;
    declare dateTimeSlotId: ForeignKey<DateTimeSlot['id']>;
    declare candidateId: number;
    declare submissionId: string;
    declare status: CreationOptional<BookingStatus>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare deletedAt: CreationOptional<Date | null>;
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
            key: 'id'
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