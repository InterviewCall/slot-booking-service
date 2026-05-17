import { Association, CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

import BookingTimeSlot from './BookingTimeSlot.model';
import DateTimeSlot from './DateTimeSlot.model';
import sequelize from './sequelize';

class BookingDate extends Model<InferAttributes<BookingDate>, InferCreationAttributes<BookingDate>> {
    declare id: CreationOptional<number>;
    declare bookingDate: string;
    declare isActive: CreationOptional<boolean>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare deletedAt: CreationOptional<Date | null>;

    declare static associations: {
        dateTimeSlots: Association<BookingDate, DateTimeSlot>;
        timeSlots: Association<BookingDate, BookingTimeSlot>;
    };
}

BookingDate.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },

    bookingDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true
    },

    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    },
}, {
    tableName: 'booking_dates',
    underscored: true,
    timestamps: true,
    sequelize,
    indexes: [
        {
            unique: true,
            fields: ['booking_date'],
            name: 'uq_booking_dates_booking_date',
        },

        {
            fields: ['is_active'],
            name: 'idx_booking_dates_is_active',
        },
    ],
});

export default BookingDate;