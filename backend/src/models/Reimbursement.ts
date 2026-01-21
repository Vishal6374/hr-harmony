import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ReimbursementAttributes {
    id: string;
    employee_id: string;
    category: 'travel' | 'event' | 'medical' | 'equipment' | 'other';
    amount: number;
    description: string;
    receipt_url?: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    approved_by?: string;
    approved_at?: Date;
    remarks?: string;
    payroll_batch_id?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ReimbursementCreationAttributes extends Optional<ReimbursementAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> { }

class Reimbursement extends Model<ReimbursementAttributes, ReimbursementCreationAttributes> implements ReimbursementAttributes {
    public id!: string;
    public employee_id!: string;
    public category!: 'travel' | 'event' | 'medical' | 'equipment' | 'other';
    public amount!: number;
    public description!: string;
    public receipt_url?: string;
    public status!: 'pending' | 'approved' | 'rejected' | 'paid';
    public approved_by?: string;
    public approved_at?: Date;
    public remarks?: string;
    public payroll_batch_id?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Reimbursement.init(
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
        category: {
            type: DataTypes.ENUM('travel', 'event', 'medical', 'equipment', 'other'),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        receipt_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
            allowNull: false,
            defaultValue: 'pending',
        },
        approved_by: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        payroll_batch_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'reimbursements',
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
                fields: ['payroll_batch_id'],
            },
        ],
    }
);

export default Reimbursement;
