import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface FFSettlementAttributes {
    id: string;
    employee_id: string;
    resignation_date: Date;
    last_working_date: Date;
    notice_period_days: number;
    notice_period_served: number;
    notice_period_recovery: number;
    pending_salary: number;
    leave_encashment: number;
    gratuity: number;
    bonus: number;
    other_dues: number;
    other_deductions: number;
    total_payable: number;
    status: 'pending' | 'approved' | 'paid';
    processed_by?: string;
    processed_at?: Date;
    paid_at?: Date;
    remarks?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface FFSettlementCreationAttributes extends Optional<FFSettlementAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> { }

class FFSettlement extends Model<FFSettlementAttributes, FFSettlementCreationAttributes> implements FFSettlementAttributes {
    public id!: string;
    public employee_id!: string;
    public resignation_date!: Date;
    public last_working_date!: Date;
    public notice_period_days!: number;
    public notice_period_served!: number;
    public notice_period_recovery!: number;
    public pending_salary!: number;
    public leave_encashment!: number;
    public gratuity!: number;
    public bonus!: number;
    public other_dues!: number;
    public other_deductions!: number;
    public total_payable!: number;
    public status!: 'pending' | 'approved' | 'paid';
    public processed_by?: string;
    public processed_at?: Date;
    public paid_at?: Date;
    public remarks?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

FFSettlement.init(
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
        resignation_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        last_working_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        notice_period_days: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        notice_period_served: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        notice_period_recovery: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        pending_salary: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        leave_encashment: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        gratuity: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        bonus: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        other_dues: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        other_deductions: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            defaultValue: 0,
        },
        total_payable: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'paid'),
            allowNull: false,
            defaultValue: 'pending',
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
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'ff_settlements',
        timestamps: true,
        underscored: true,
    }
);

export default FFSettlement;
