import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface LeaveBalanceAttributes {
    id: string;
    employee_id: string;
    leave_type: 'casual' | 'sick' | 'earned' | 'unpaid';
    total: number;
    used: number;
    remaining: number;
    year: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface LeaveBalanceCreationAttributes extends Optional<LeaveBalanceAttributes, 'id' | 'used' | 'remaining' | 'created_at' | 'updated_at'> { }

class LeaveBalance extends Model<LeaveBalanceAttributes, LeaveBalanceCreationAttributes> implements LeaveBalanceAttributes {
    public id!: string;
    public employee_id!: string;
    public leave_type!: 'casual' | 'sick' | 'earned' | 'unpaid';
    public total!: number;
    public used!: number;
    public remaining!: number;
    public year!: number;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

LeaveBalance.init(
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
        leave_type: {
            type: DataTypes.ENUM('casual', 'sick', 'earned', 'unpaid'),
            allowNull: false,
        },
        total: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        used: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        remaining: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'leave_balances',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['employee_id', 'leave_type', 'year'],
            },
        ],
    }
);

export default LeaveBalance;
