import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface TaxSlabAttributes {
    id: string;
    regime: 'old' | 'new';
    financial_year: string; // e.g., "2024-25"
    slabs: {
        min: number;
        max: number | null; // null for unlimited
        rate: number; // percentage
    }[];
    standard_deduction?: number;
    cess_percentage: number;
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface TaxSlabCreationAttributes extends Optional<TaxSlabAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> { }

class TaxSlab extends Model<TaxSlabAttributes, TaxSlabCreationAttributes> implements TaxSlabAttributes {
    public id!: string;
    public regime!: 'old' | 'new';
    public financial_year!: string;
    public slabs!: {
        min: number;
        max: number | null;
        rate: number;
    }[];
    public standard_deduction?: number;
    public cess_percentage!: number;
    public is_active!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

TaxSlab.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        regime: {
            type: DataTypes.ENUM('old', 'new'),
            allowNull: false,
        },
        financial_year: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slabs: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        standard_deduction: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        cess_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 4,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'tax_slabs',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                unique: true,
                fields: ['regime', 'financial_year'],
            },
        ],
    }
);

export default TaxSlab;
