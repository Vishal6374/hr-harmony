import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ResignationAttributes {
    id: string;
    employee_id: string;
    reason: string;
    preferred_last_working_day: Date;
    approved_last_working_day?: Date;
    status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
    hr_remarks?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface ResignationCreationAttributes extends Optional<ResignationAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> { }

class Resignation extends Model<ResignationAttributes, ResignationCreationAttributes> implements ResignationAttributes {
    public id!: string;
    public employee_id!: string;
    public reason!: string;
    public preferred_last_working_day!: Date;
    public approved_last_working_day?: Date;
    public status!: 'pending' | 'approved' | 'rejected' | 'withdrawn';
    public hr_remarks?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Resignation.init(
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
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        preferred_last_working_day: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        approved_last_working_day: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'withdrawn'),
            allowNull: false,
            defaultValue: 'pending',
        },
        hr_remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'resignations',
        timestamps: true,
        underscored: true,
    }
);

export default Resignation;
