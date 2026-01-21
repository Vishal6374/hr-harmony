import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ComplaintAttributes {
    id: string;
    employee_id: string;
    subject: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    is_anonymous: boolean;
    response?: string;
    responded_by?: string;
    responded_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface ComplaintCreationAttributes extends Optional<ComplaintAttributes, 'id' | 'status' | 'is_anonymous' | 'created_at' | 'updated_at'> { }

class Complaint extends Model<ComplaintAttributes, ComplaintCreationAttributes> implements ComplaintAttributes {
    public id!: string;
    public employee_id!: string;
    public subject!: string;
    public description!: string;
    public category!: string;
    public priority!: 'low' | 'medium' | 'high' | 'urgent';
    public status!: 'open' | 'in_progress' | 'resolved' | 'closed';
    public is_anonymous!: boolean;
    public response?: string;
    public responded_by?: string;
    public responded_at?: Date;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Complaint.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        subject: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            allowNull: false,
            defaultValue: 'medium',
        },
        status: {
            type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
            allowNull: false,
            defaultValue: 'open',
        },
        is_anonymous: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        response: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        responded_by: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        responded_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'complaints',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['employee_id'],
            },
            {
                fields: ['status'],
            },
            {
                fields: ['priority'],
            },
        ],
    }
);

export default Complaint;
