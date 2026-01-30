import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface MeetingAttributes {
    id: string;
    title: string;
    description: string;
    type: 'virtual' | 'physical';
    meeting_url?: string;
    location?: string;
    date: Date;
    start_time: string;
    end_time: string;
    attendees: string; // JSON string array of employee IDs
    created_by: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface MeetingCreationAttributes extends Optional<MeetingAttributes, 'id' | 'created_at' | 'updated_at'> { }

class Meeting extends Model<MeetingAttributes, MeetingCreationAttributes> implements MeetingAttributes {
    public id!: string;
    public title!: string;
    public description!: string;
    public type!: 'virtual' | 'physical';
    public meeting_url?: string;
    public location?: string;
    public date!: Date;
    public start_time!: string;
    public end_time!: string;
    public attendees!: string;
    public created_by!: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

Meeting.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('virtual', 'physical'),
            allowNull: false,
            defaultValue: 'virtual',
        },
        meeting_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        start_time: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        end_time: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        attendees: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '[]',
        },
        created_by: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'meetings',
        timestamps: true,
        underscored: true,
    }
);

export default Meeting;
