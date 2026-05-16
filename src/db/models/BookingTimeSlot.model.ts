import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

import sequelize from './sequelize';

class BookingTimeSlot extends Model<InferAttributes<BookingTimeSlot>, InferCreationAttributes<BookingTimeSlot>> {
    declare id: CreationOptional<number>;
    declare slotTime: string;
    declare slotLabel: string;
    declare sortOrder: number;
    declare isActive: CreationOptional<boolean>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare deletedAt: CreationOptional<Date | null>;
}

BookingTimeSlot.init({
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },

    slotTime: {
        type: DataTypes.TIME,
        allowNull: false,
        unique: true
    },

    slotLabel: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },

    sortOrder: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
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
    tableName: 'booking_time_slots',
    underscored: true,
    timestamps: true,
    sequelize,
    indexes: [
        {
            unique: true,
            fields: ['slot_time'],
            name: 'uq_booking_time_slots_slot_time',
        },

        {
            fields: ['sort_order'],
            name: 'idx_booking_time_slots_sort_order',
        },
        
        {
            fields: ['is_active'],
            name: 'idx_booking_time_slots_is_active',
        },
    ],
});

export default BookingTimeSlot;