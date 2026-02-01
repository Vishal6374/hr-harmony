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
    pf_percentage?: number;
    esi_percentage?: number;
    absent_deduction_type?: 'percentage' | 'amount';
    absent_deduction_value?: number;
    address?: string;
    avatar_url?: string;
    termination_date?: Date;
    termination_reason?: string;
    bank_name?: string;
    account_number?: string;
    ifsc_code?: string;
    branch_name?: string;
    education?: string;
    aadhaar_number?: string;
    pan_number?: string;
    custom_fields?: any;
    tax_regime?: 'new' | 'old';
    bank_account_number?: string;
    bank_ifsc?: string;
    reset_password_token?: string;
    reset_password_expires?: Date;
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
    public pf_percentage?: number;
    public esi_percentage?: number;
    public absent_deduction_type?: 'percentage' | 'amount';
    public absent_deduction_value?: number;
    public address?: string;
    public avatar_url?: string;
    public termination_date?: Date;
    public termination_reason?: string;
    public bank_name?: string;
    public account_number?: string;
    public ifsc_code?: string;
    public branch_name?: string;
    public education?: string;
    public aadhaar_number?: string;
    public pan_number?: string;
    public custom_fields?: any;
    public tax_regime?: 'new' | 'old';
    public bank_account_number?: string;

    public bank_ifsc?: string;
    public reset_password_token?: string;
    public reset_password_expires?: Date;

    // Associations
    public readonly department?: any; // To avoid circular dependency with Department model type
    public readonly designation?: any;
    public readonly reportingManager?: User;
    public readonly leaveBalances?: any[];

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
        pf_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        esi_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        absent_deduction_type: {
            type: DataTypes.ENUM('percentage', 'amount'),
            allowNull: true,
        },
        absent_deduction_value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
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
        education: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        aadhaar_number: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        pan_number: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        custom_fields: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {},
        },
        tax_regime: {
            type: DataTypes.ENUM('new', 'old'),
            allowNull: true,
            defaultValue: 'new',
        },
        bank_account_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        bank_ifsc: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        reset_password_token: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        reset_password_expires: {
            type: DataTypes.DATE,
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
