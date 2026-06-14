import { Association, CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, NonAttribute } from 'sequelize';

import Booking from './Booking.model';
import sequelize from './sequelize';

class IdempotencyKey extends Model<InferAttributes<IdempotencyKey>, InferCreationAttributes<IdempotencyKey>> {
    declare id: CreationOptional<number>;
    declare idemKey: string;
    declare finalized: CreationOptional<boolean>;
    declare bookingId: bigint;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare deletedAt: CreationOptional<Date | null>;

    declare booking?: NonAttribute<Booking>;

    declare static associations: {
        booking: Association<IdempotencyKey, Booking>;
    };
}

IdempotencyKey.init({
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },

    idemKey: {
        type: DataTypes.UUID,
        unique: true,
        allowNull: false
    },

    bookingId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
            model: Booking,
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },

    finalized: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    tableName: 'idempotency_keys',
    underscored: true,
    timestamps: true,
    sequelize,
    indexes: [
        {
            unique: true,
            fields: ['idem_key'],
            name: 'uq_idempotency_keys_idem_key',
        },

        {
            fields: ['booking_id'],
            name: 'idx_idempotency_keys_booking_id',
        },

        {
            fields: ['finalized'],
            name: 'idx_idempotency_keys_finalized',
        },
        
        {
            fields: ['finalized', 'expires_at'], 
            name: 'idx_idempotency_keys_finalized_expires_at',
        }
    ]
});

export default IdempotencyKey;