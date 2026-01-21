import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PayrollAuditAttributes {
    id: string;
    entity_type: 'salary_slip' | 'payroll_batch' | 'salary_structure' | 'pay_group';
    entity_id: string;
    action: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected';
    changed_by: string;
    changes: {
        field: string;
        old_value: any;
        new_value: any;
    }[];
    remarks?: string;
    created_at?: Date;
}

export interface PayrollAuditCreationAttributes extends Optional<PayrollAuditAttributes, 'id' | 'created_at'> { }

class PayrollAudit extends Model<PayrollAuditAttributes, PayrollAuditCreationAttributes> implements PayrollAuditAttributes {
    public id!: string;
    public entity_type!: 'salary_slip' | 'payroll_batch' | 'salary_structure' | 'pay_group';
    public entity_id!: string;
    public action!: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected';
    public changed_by!: string;
    public changes!: {
        field: string;
        old_value: any;
        new_value: any;
    }[];
    public remarks?: string;

    public readonly created_at!: Date;
}

PayrollAudit.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        entity_type: {
            type: DataTypes.ENUM('salary_slip', 'payroll_batch', 'salary_structure', 'pay_group'),
            allowNull: false,
        },
        entity_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        action: {
            type: DataTypes.ENUM('created', 'updated', 'deleted', 'approved', 'rejected'),
            allowNull: false,
        },
        changed_by: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        changes: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'payroll_audits',
        timestamps: true,
        underscored: true,
        updatedAt: false,
    }
);

export default PayrollAudit;
