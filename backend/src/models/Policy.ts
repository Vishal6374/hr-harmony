import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PolicyAttributes {
    id: string;
    title: string;
    category: string;
    version: string;
    document_url: string;
    is_active: boolean;
    effective_date: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface PolicyCreationAttributes extends Optional<PolicyAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> { }

class Policy extends Model<PolicyAttributes, PolicyCreationAttributes> implements PolicyAttributes {
    public id!: string;
    public title!: string;
    public category!: string;
    public version!: string;
    public document_url!: string;
    public is_active!: boolean;
    public effective_date!: Date;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Policy.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        category: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        version: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        document_url: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        effective_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'policies',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['category'],
            },
            {
                fields: ['is_active'],
            },
        ],
    }
);

export default Policy;
