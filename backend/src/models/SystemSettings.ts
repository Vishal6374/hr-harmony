import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class SystemSettings extends Model {
    public id!: string;
    public company_name!: string;
    public site_title!: string;
    public company_logo_url!: string;
    public favicon_url!: string;
    public sidebar_logo_url!: string;
    public login_bg_url!: string;
    public login_logo_url!: string;
    public login_title!: string;
    public login_subtitle!: string;
    public payslip_header_name!: string;
    public payslip_logo_url!: string;
    public payslip_address!: string;
    public attendance_config!: any; // JSON Config
    public created_at!: Date;
    public updated_at!: Date;
}

SystemSettings.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Catalyr',
        },
        site_title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Catalyr | HRMS',
        },
        company_logo_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        favicon_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sidebar_logo_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        login_bg_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        login_logo_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        login_title: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Welcome Back',
        },
        login_subtitle: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Enter your credentials to access your account',
        },
        payslip_header_name: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'Tech Corp Inc.',
        },
        payslip_logo_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        payslip_address: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: '123 Tech Park, Silicon Valley, CA',
        },
        attendance_config: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {
                mode: "NORMAL",
                sync_enabled: false
            }
        },
    },
    {
        sequelize,
        tableName: 'system_settings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
);

export default SystemSettings;
