import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface TaskLogAttributes {
    id: string;
    employee_id: string;
    task_name: string;
    description: string;
    date: Date;
    start_time?: Date;
    end_time?: Date;
    hours_spent: number;
    status: 'pending' | 'completed' | 'ongoing';
    created_at?: Date;
    updated_at?: Date;
}

export interface TaskLogCreationAttributes extends Optional<TaskLogAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> { }

class TaskLog extends Model<TaskLogAttributes, TaskLogCreationAttributes> implements TaskLogAttributes {
    public id!: string;
    public employee_id!: string;
    public task_name!: string;
    public description!: string;
    public date!: Date;
    public start_time?: Date;
    public end_time?: Date;
    public hours_spent!: number;
    public status!: 'pending' | 'completed' | 'ongoing';

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

TaskLog.init(
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
        task_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        start_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        end_time: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        hours_spent: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: false,
            defaultValue: 0,
        },
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'ongoing'),
            allowNull: false,
            defaultValue: 'completed',
        },
    },
    {
        sequelize,
        tableName: 'task_logs',
        timestamps: true,
        underscored: true,
    }
);

export default TaskLog;
