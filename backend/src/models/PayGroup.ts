import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PayGroupAttributes {
    id: string;
    name: string;
    description?: string;
    salary_structure_id: string;
    payment_frequency: 'monthly' | 'bi-weekly' | 'weekly';
    payment_day: number; // Day of month for payment
    tax_regime: 'old' | 'new';
    is_active: boolean;
    created_at?: Date;
    updated_at?: Date;
}

export interface PayGroupCreationAttributes extends Optional<PayGroupAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> { }

class PayGroup extends Model<PayGroupAttributes, PayGroupCreationAttributes> implements PayGroupAttributes {
    public id!: string;
    public name!: string;
    public description?: string;
    public salary_structure_id!: string;
    public payment_frequency!: 'monthly' | 'bi-weekly' | 'weekly';
    public payment_day!: number;
    public tax_regime!: 'old' | 'new';
    public is_active!: boolean;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

PayGroup.init(
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
        salary_structure_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        payment_frequency: {
            type: DataTypes.ENUM('monthly', 'bi-weekly', 'weekly'),
            allowNull: false,
            defaultValue: 'monthly',
        },
        payment_day: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        tax_regime: {
            type: DataTypes.ENUM('old', 'new'),
            allowNull: false,
            defaultValue: 'new',
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        tableName: 'pay_groups',
        timestamps: true,
        underscored: true,
    }
);

export default PayGroup;
