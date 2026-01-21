import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AuditLogAttributes {
    id: string;
    action: string;
    module: string;
    entity_type: string;
    entity_id: string;
    performed_by: string;
    old_value?: any;
    new_value?: any;
    ip_address?: string;
    user_agent?: string;
    created_at?: Date;
}

export interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'created_at'> { }

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
    public id!: string;
    public action!: string;
    public module!: string;
    public entity_type!: string;
    public entity_id!: string;
    public performed_by!: string;
    public old_value?: any;
    public new_value?: any;
    public ip_address?: string;
    public user_agent?: string;

    public readonly created_at!: Date;
}

AuditLog.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        action: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        module: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        entity_type: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        entity_id: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        performed_by: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        old_value: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        new_value: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        ip_address: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'audit_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
            {
                fields: ['performed_by'],
            },
            {
                fields: ['entity_type', 'entity_id'],
            },
            {
                fields: ['module'],
            },
            {
                fields: ['created_at'],
            },
        ],
    }
);

export default AuditLog;
