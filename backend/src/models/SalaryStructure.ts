import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SalaryStructureAttributes {
    id: string;
    name: string;
    description?: string;
    components: {
        basic: { percentage: number; formula?: string };
        hra: { percentage: number; formula?: string };
        da: { percentage: number; formula?: string };
        special_allowance?: { percentage: number; formula?: string };
        transport_allowance?: { amount: number };
        medical_allowance?: { amount: number };
        other_allowances?: { name: string; amount: number }[];
    };
    deduction_rules: {
        pf: { percentage: number; max_limit?: number };
        esi: { percentage: number; salary_limit?: number };
        professional_tax: { amount: number };
    };
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface SalaryStructureCreationAttributes extends Optional<SalaryStructureAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> { }

class SalaryStructure extends Model<SalaryStructureAttributes, SalaryStructureCreationAttributes> implements SalaryStructureAttributes {
    public id!: string;
    public name!: string;
    public description?: string;
    public components!: {
        basic: { percentage: number; formula?: string };
        hra: { percentage: number; formula?: string };
        da: { percentage: number; formula?: string };
        special_allowance?: { percentage: number; formula?: string };
        transport_allowance?: { amount: number };
        medical_allowance?: { amount: number };
        other_allowances?: { name: string; amount: number }[];
    };
    public deduction_rules!: {
        pf: { percentage: number; max_limit?: number };
        esi: { percentage: number; salary_limit?: number };
        professional_tax: { amount: number };
    };
    public is_active!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

SalaryStructure.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        components: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        deduction_rules: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'salary_structures',
        timestamps: true,
        underscored: true,
    }
);

export default SalaryStructure;
