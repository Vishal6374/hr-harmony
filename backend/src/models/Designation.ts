import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface DesignationAttributes {
    id: string;
    name: string;
    department_id: string;
    level: number;
    salary_range_min?: number;
    salary_range_max?: number;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface DesignationCreationAttributes extends Optional<DesignationAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> { }

class Designation extends Model<DesignationAttributes, DesignationCreationAttributes> implements DesignationAttributes {
    public id!: string;
    public name!: string;
    public department_id!: string;
    public level!: number;
    public salary_range_min?: number;
    public salary_range_max?: number;
    public is_active!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Designation.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        department_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        salary_range_min: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        salary_range_max: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'designations',
        timestamps: true,
        underscored: true,
    }
);

export default Designation;
