import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface RegularizationRequestAttributes {
    id: string;
    employee_id: string;
    attendance_date: Date;
    type: 'check_in' | 'check_out' | 'both' | 'status_change';
    new_check_in?: Date;
    new_check_out?: Date;
    new_status?: 'present' | 'half_day' | 'absent';
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    remarks?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface RegularizationRequestCreationAttributes extends Optional<RegularizationRequestAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> { }

class RegularizationRequest extends Model<RegularizationRequestAttributes, RegularizationRequestCreationAttributes> implements RegularizationRequestAttributes {
    public id!: string;
    public employee_id!: string;
    public attendance_date!: Date;
    public type!: 'check_in' | 'check_out' | 'both' | 'status_change';
    public new_check_in?: Date;
    public new_check_out?: Date;
    public new_status?: 'present' | 'half_day' | 'absent';
    public reason!: string;
    public status!: 'pending' | 'approved' | 'rejected';
    public approved_by?: string;
    public remarks?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

RegularizationRequest.init(
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
        attendance_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('check_in', 'check_out', 'both', 'status_change'),
            allowNull: false,
        },
        new_check_in: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        new_check_out: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        new_status: {
            type: DataTypes.ENUM('present', 'half_day', 'absent'),
            allowNull: true,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
        approved_by: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'regularization_requests',
        timestamps: true,
        underscored: true,
    }
);

export default RegularizationRequest;
