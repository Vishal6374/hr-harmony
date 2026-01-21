import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface LoanAdvanceAttributes {
    id: string;
    employee_id: string;
    type: 'loan' | 'advance';
    amount: number;
    reason: string;
    repayment_months?: number;
    monthly_deduction?: number;
    status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid';
    approved_by?: string;
    approved_at?: Date;
    disbursed_at?: Date;
    remarks?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface LoanAdvanceCreationAttributes extends Optional<LoanAdvanceAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> { }

class LoanAdvance extends Model<LoanAdvanceAttributes, LoanAdvanceCreationAttributes> implements LoanAdvanceAttributes {
    public id!: string;
    public employee_id!: string;
    public type!: 'loan' | 'advance';
    public amount!: number;
    public reason!: string;
    public repayment_months?: number;
    public monthly_deduction?: number;
    public status!: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid';
    public approved_by?: string;
    public approved_at?: Date;
    public disbursed_at?: Date;
    public remarks?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

LoanAdvance.init(
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
        type: {
            type: DataTypes.ENUM('loan', 'advance'),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        repayment_months: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        monthly_deduction: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'disbursed', 'repaid'),
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
        disbursed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'loan_advances',
        timestamps: true,
        underscored: true,
    }
);

export default LoanAdvance;
