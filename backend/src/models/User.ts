import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
    id: string;
    employee_id: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    date_of_birth?: Date;
    date_of_joining: Date;
    department_id?: string;
    designation_id?: string;
    reporting_manager_id?: string;
    salary: number;
    role: 'admin' | 'hr' | 'employee';
    status: 'active' | 'inactive' | 'on_leave' | 'terminated';
    address?: string;
    avatar_url?: string;
    termination_date?: Date;
    termination_reason?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    branch_name?: string;
    created_at?: Date;
    updated_at?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: string;
    public employee_id!: string;
    public name!: string;
    public email!: string;
    public password!: string;
    public phone?: string;
    public date_of_birth?: Date;
    public date_of_joining!: Date;
    public department_id?: string;
    public designation_id?: string;
    public reporting_manager_id?: string;
    public salary!: number;
    public role!: 'admin' | 'hr' | 'employee';
    public status!: 'active' | 'inactive' | 'on_leave' | 'terminated';
    public address?: string;
    public avatar_url?: string;
    public termination_date?: Date;
    public termination_reason?: string;
    public bank_name?: string;
    public account_number?: string;
    public ifsc_code?: string;
    public branch_name?: string;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;

    // Instance method to compare password
    public async comparePassword(candidatePassword: string): Promise<boolean> {
        return bcrypt.compare(candidatePassword, this.password);
    }

    // Remove password from JSON output
    public toJSON(): Partial<UserAttributes> {
        const values = { ...this.get() };
        delete (values as any).password;
        return values;
    }
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        employee_id: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        date_of_birth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        date_of_joining: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        department_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        designation_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        reporting_manager_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        salary: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        role: {
            type: DataTypes.ENUM('admin', 'hr', 'employee'),
            allowNull: false,
            defaultValue: 'employee',
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'on_leave', 'terminated'),
            allowNull: false,
            defaultValue: 'active',
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        avatar_url: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        termination_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        termination_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        bank_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        account_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        ifsc_code: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        branch_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,
        hooks: {
            beforeCreate: async (user: User) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user: User) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    }
);

export default User;
