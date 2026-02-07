import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface LeaveRequestAttributes {
    id: string;
    employee_id: string;
    leave_type: string;
    start_date: Date;
    end_date: Date;
    days: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'pending_manager' | 'pending_hr' | 'rejected_by_manager' | 'rejected_by_hr';
    manager_id?: string;
    manager_status?: 'pending' | 'approved' | 'rejected';
    manager_remarks?: string;
    manager_approved_at?: Date;
    approved_by?: string;
    approved_at?: Date;
    remarks?: string;
    hr_remarks?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface LeaveRequestCreationAttributes extends Optional<LeaveRequestAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> { }

class LeaveRequest extends Model<LeaveRequestAttributes, LeaveRequestCreationAttributes> implements LeaveRequestAttributes {
    public id!: string;
    public employee_id!: string;
    public leave_type!: string;
    public start_date!: Date;
    public end_date!: Date;
    public days!: number;
    public reason!: string;
    public status!: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'pending_manager' | 'pending_hr' | 'rejected_by_manager' | 'rejected_by_hr';
    public manager_id?: string;
    public manager_status?: 'pending' | 'approved' | 'rejected';
    public manager_remarks?: string;
    public manager_approved_at?: Date;
    public approved_by?: string;
    public approved_at?: Date;
    public remarks?: string;
    public hr_remarks?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

LeaveRequest.init(
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
            type: DataTypes.STRING,
            allowNull: false,
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        days: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled', 'pending_manager', 'pending_hr', 'rejected_by_manager', 'rejected_by_hr'),
            allowNull: false,
            defaultValue: 'pending',
        },
        manager_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        manager_status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: true,
        },
        manager_remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        manager_approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
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
        hr_remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'leave_requests',
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
                fields: ['start_date', 'end_date'],
            },
        ],
    }
);

export default LeaveRequest;
