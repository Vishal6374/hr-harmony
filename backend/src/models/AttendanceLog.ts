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
    created_at?: Date;
    updated_at?: Date;
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

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
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
