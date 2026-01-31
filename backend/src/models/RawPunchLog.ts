import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface RawPunchLogAttributes {
    id: string;
    biometric_id: string; // User ID from device
    punch_datetime: Date;
    device_ip?: string;
    direction: 'IN' | 'OUT' | 'AUTO';
    process_status: 'PENDING' | 'PROCESSED' | 'FAILED';
    source_type: 'ESSL_DB' | 'DIRECT_DEVICE' | 'CSV';
    error_log?: string;
    synced_at?: Date;
}

export interface RawPunchLogCreationAttributes extends Optional<RawPunchLogAttributes, 'id' | 'device_ip' | 'direction' | 'process_status' | 'error_log' | 'synced_at'> { }

class RawPunchLog extends Model<RawPunchLogAttributes, RawPunchLogCreationAttributes> implements RawPunchLogAttributes {
    public id!: string;
    public biometric_id!: string;
    public punch_datetime!: Date;
    public device_ip?: string;
    public direction!: 'IN' | 'OUT' | 'AUTO';
    public process_status!: 'PENDING' | 'PROCESSED' | 'FAILED';
    public source_type!: 'ESSL_DB' | 'DIRECT_DEVICE' | 'CSV';
    public error_log?: string;
    public synced_at?: Date;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

RawPunchLog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        biometric_id: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        punch_datetime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        device_ip: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
        direction: {
            type: DataTypes.ENUM('IN', 'OUT', 'AUTO'),
            allowNull: false,
            defaultValue: 'AUTO',
        },
        process_status: {
            type: DataTypes.ENUM('PENDING', 'PROCESSED', 'FAILED'),
            allowNull: false,
            defaultValue: 'PENDING',
        },
        source_type: {
            type: DataTypes.ENUM('ESSL_DB', 'DIRECT_DEVICE', 'CSV'),
            allowNull: false,
            defaultValue: 'DIRECT_DEVICE',
        },
        error_log: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        synced_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'raw_punch_logs',
        timestamps: false, // Only synced_at is needed as per design, but sequelize might default to timestamps. Design says synced_at default NOW.
        underscored: true,
        indexes: [
            {
                fields: ['biometric_id'],
            },
            {
                fields: ['punch_datetime'],
            },
            {
                unique: true,
                fields: ['biometric_id', 'punch_datetime', 'device_ip'], // Deduplication Rule
            },
        ],
    }
);

export default RawPunchLog;
