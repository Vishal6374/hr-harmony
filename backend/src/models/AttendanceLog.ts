import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface AttendanceLogAttributes {
    id: string;
    employee_id: string;
    date: Date;
    check_in?: Date;
    check_out?: Date;
    status: 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday' | 'weekend';
    work_hours?: number;
    notes?: string;
    is_locked: boolean;
    edited_by?: string;
    edit_reason?: string;
    created_at?: Date;
    updated_at?: Date;
    raw_punch_ids?: string[]; // JSON array of UUIDs
    overtime_hours?: number;
    late_minutes?: number;
    is_manual_override?: boolean;
    calculation_version?: number;
    attendance_source?: 'BIOMETRIC' | 'MANUAL' | 'ADJUSTED';
}

export interface AttendanceLogCreationAttributes extends Optional<AttendanceLogAttributes, 'id' | 'is_locked' | 'created_at' | 'updated_at'> { }

class AttendanceLog extends Model<AttendanceLogAttributes, AttendanceLogCreationAttributes> implements AttendanceLogAttributes {
    public id!: string;
    public employee_id!: string;
    public date!: Date;
    public check_in?: Date;
    public check_out?: Date;
    public status!: 'present' | 'absent' | 'half_day' | 'on_leave' | 'holiday' | 'weekend';
    public work_hours?: number;
    public notes?: string;
    public is_locked!: boolean;
    public edited_by?: string;
    public edit_reason?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    public raw_punch_ids?: string[];
    public overtime_hours?: number;
    public late_minutes?: number;
    public is_manual_override?: boolean;
    public calculation_version?: number;
    public attendance_source?: 'BIOMETRIC' | 'MANUAL' | 'ADJUSTED';
}

AttendanceLog.init(
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        check_in: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        check_out: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('present', 'absent', 'half_day', 'on_leave', 'holiday', 'weekend'),
            allowNull: false,
            defaultValue: 'present',
        },
        work_hours: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_locked: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        edited_by: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        edit_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        raw_punch_ids: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        overtime_hours: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        late_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        is_manual_override: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        calculation_version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        attendance_source: {
            type: DataTypes.ENUM('BIOMETRIC', 'MANUAL', 'ADJUSTED'),
            defaultValue: 'MANUAL', // Default to manual for backward compatibility
        },
    },
    {
        sequelize,
        tableName: 'attendance_logs',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['employee_id', 'date'],
            },
            {
                fields: ['date'],
            },
            {
                fields: ['status'],
            },
        ],
    }
);

export default AttendanceLog;
