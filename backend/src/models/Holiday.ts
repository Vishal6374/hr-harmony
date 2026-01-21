import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface HolidayAttributes {
    id: string;
    name: string;
    date: Date;
    type: 'national' | 'regional' | 'company';
    is_optional: boolean;
    year: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface HolidayCreationAttributes extends Optional<HolidayAttributes, 'id' | 'is_optional' | 'created_at' | 'updated_at'> { }

class Holiday extends Model<HolidayAttributes, HolidayCreationAttributes> implements HolidayAttributes {
    public id!: string;
    public name!: string;
    public date!: Date;
    public type!: 'national' | 'regional' | 'company';
    public is_optional!: boolean;
    public year!: number;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Holiday.init(
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
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('national', 'regional', 'company'),
            allowNull: false,
        },
        is_optional: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'holidays',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['year'],
            },
            {
                fields: ['date'],
            },
        ],
    }
);

export default Holiday;
