import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

import sequelize from './sequelize';

export type CrmOutboxStatus = 'PENDING' | 'SENT' | 'FAILED';

class CrmOutbox extends Model<InferAttributes<CrmOutbox>, InferCreationAttributes<CrmOutbox>> {
    declare id: CreationOptional<number>;
    declare eventId: string;
    declare eventType: string;
    declare bookingId: bigint;
    declare status: CreationOptional<CrmOutboxStatus>;
    declare attempts: CreationOptional<number>;
    declare nextAttemptAt: Date;
    declare lastError: CreationOptional<string | null>;
    declare sentAt: CreationOptional<Date | null>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}

CrmOutbox.init({
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    eventId: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    eventType: { type: DataTypes.STRING(40), allowNull: false },
    bookingId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED'), allowNull: false, defaultValue: 'PENDING' },
    attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    nextAttemptAt: { type: DataTypes.DATE(3), allowNull: false },
    lastError: { type: DataTypes.STRING(500), allowNull: true, defaultValue: null },
    sentAt: { type: DataTypes.DATE(3), allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE(3), allowNull: false },
    updatedAt: { type: DataTypes.DATE(3), allowNull: false },
}, {
    tableName: 'crm_outbox',
    underscored: true,
    timestamps: true,
    sequelize
});

export default CrmOutbox;
