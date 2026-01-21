import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface DepartmentAttributes {
    id: string;
    name: string;
    code: string;
    manager_id?: string;
    employee_count: number;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'employee_count' | 'is_active' | 'created_at' | 'updated_at'> { }

class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
    public id!: string;
    public name!: string;
    public code!: string;
    public manager_id?: string;
    public employee_count!: number;
    public is_active!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Department.init(
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
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        manager_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        employee_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'departments',
        timestamps: true,
        underscored: true,
    }
);

export default Department;
