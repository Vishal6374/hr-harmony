import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SalarySlipAttributes {
    id: string;
    employee_id: string;
    batch_id: string;
    month: number;
    year: number;
    basic_salary: number;
    hra: number;
    da: number;
    reimbursements: number;
    deductions: {
        pf: number;
        tax: number;
        loss_of_pay: number;
        other: number;
    };
    gross_salary: number;
    net_salary: number;
    status: 'draft' | 'processed' | 'paid' | 'cancelled';
    generated_at: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface SalarySlipCreationAttributes extends Optional<SalarySlipAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> { }

class SalarySlip extends Model<SalarySlipAttributes, SalarySlipCreationAttributes> implements SalarySlipAttributes {
    public id!: string;
    public employee_id!: string;
    public batch_id!: string;
    public month!: number;
    public year!: number;
    public basic_salary!: number;
    public hra!: number;
    public da!: number;
    public reimbursements!: number;
    public deductions!: {
        pf: number;
        tax: number;
        loss_of_pay: number;
        other: number;
    };
    public gross_salary!: number;
    public net_salary!: number;
    public status!: 'draft' | 'processed' | 'paid' | 'cancelled';
    public generated_at!: Date;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

SalarySlip.init(
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
        batch_id: {
            type: DataTypes.UUID,
            allowNull: false,
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
        basic_salary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        hra: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        da: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        reimbursements: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        deductions: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                pf: 0,
                tax: 0,
                loss_of_pay: 0,
                other: 0,
            },
        },
        gross_salary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        net_salary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.ENUM('draft', 'processed', 'paid', 'cancelled'),
            allowNull: false,
            defaultValue: 'draft',
        },
        generated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'salary_slips',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['employee_id', 'month', 'year'],
            },
            {
                fields: ['batch_id'],
            },
            {
                fields: ['status'],
            },
        ],
    }
);

export default SalarySlip;
