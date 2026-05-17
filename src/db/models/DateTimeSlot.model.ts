import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

import { TimeSlotStatus } from '../../utils/enums/TimeSlotStatus';
import BookingDate from './BookingDate.model';
import BookingTimeSlot from './BookingTimeSlot.model';
import sequelize from './sequelize';

class DateTimeSlot extends Model<InferAttributes<DateTimeSlot>, InferCreationAttributes<DateTimeSlot>> {
    declare id: CreationOptional<number>;
    declare bookingDateId: ForeignKey<BookingDate['id']>;
    declare bookingTimeSlotId: ForeignKey<BookingTimeSlot['id']>;
    declare slotStartAt: Date;
    declare status: CreationOptional<TimeSlotStatus>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare deletedAt: CreationOptional<Date | null>;
}

DateTimeSlot.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },

    bookingDateId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: BookingDate,
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },

    bookingTimeSlotId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: BookingTimeSlot,
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    },

    slotStartAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },

    status: {
        type: DataTypes.ENUM(...Object.values(TimeSlotStatus)),
        allowNull: false,
        defaultValue: TimeSlotStatus.AVAILABLE
    },

    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },

    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
    },

    deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    }
}, {
    tableName: 'date_time_slots',
    underscored: true,
    timestamps: true,
    sequelize,
    indexes: [
        {
            unique: true,
            fields: ['booking_date_id', 'booking_time_slot_id'],
            name: 'uq_date_time_slot',
        },

        {
            fields: ['booking_date_id', 'status', 'slot_start_at'],
            name: 'idx_date_time_slots_date_status_start',
        },

        {
            fields: ['status', 'slot_start_at'],
            name: 'idx_date_time_slots_status_start',
        },
    ],
});

export default DateTimeSlot;