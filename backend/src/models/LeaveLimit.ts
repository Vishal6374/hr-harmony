import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface LeaveLimitAttributes {
    id: string;
    casual_leave: number;
    sick_leave: number;
    earned_leave: number;
    created_at?: Date;
    updated_at?: Date;
}

interface LeaveLimitCreationAttributes extends Optional<LeaveLimitAttributes, 'id' | 'created_at' | 'updated_at'> { }

class LeaveLimit extends Model<LeaveLimitAttributes, LeaveLimitCreationAttributes> implements LeaveLimitAttributes {
    public id!: string;
    public casual_leave!: number;
    public sick_leave!: number;
    public earned_leave!: number;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

LeaveLimit.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        casual_leave: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 12,
            comment: 'Number of casual leave days per year',
        },
        sick_leave: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 12,
            comment: 'Number of sick leave days per year',
        },
        earned_leave: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 15,
            comment: 'Number of earned leave days per year',
        },
    },
    {
        sequelize,
        tableName: 'leave_limits',
        underscored: true,
        timestamps: true,
    }
);

export default LeaveLimit;
