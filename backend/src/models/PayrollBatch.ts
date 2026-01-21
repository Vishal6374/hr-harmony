import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PayrollBatchAttributes {
    id: string;
    month: number;
    year: number;
    status: 'draft' | 'processed' | 'paid' | 'cancelled';
    total_employees: number;
    total_amount: number;
    processed_by?: string;
    processed_at?: Date;
    paid_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface PayrollBatchCreationAttributes extends Optional<PayrollBatchAttributes, 'id' | 'status' | 'total_employees' | 'total_amount' | 'created_at' | 'updated_at'> { }

class PayrollBatch extends Model<PayrollBatchAttributes, PayrollBatchCreationAttributes> implements PayrollBatchAttributes {
    public id!: string;
    public month!: number;
    public year!: number;
    public status!: 'draft' | 'processed' | 'paid' | 'cancelled';
    public total_employees!: number;
    public total_amount!: number;
    public processed_by?: string;
    public processed_at?: Date;
    public paid_at?: Date;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

PayrollBatch.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 12,
            },
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('draft', 'processed', 'paid', 'cancelled'),
            allowNull: false,
            defaultValue: 'draft',
        },
        total_employees: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        total_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        processed_by: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        processed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        paid_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'payroll_batches',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['month', 'year'],
            },
            {
                fields: ['status'],
            },
        ],
    }
);

export default PayrollBatch;
