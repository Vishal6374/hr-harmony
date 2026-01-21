import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface InvestmentDeclarationAttributes {
    id: string;
    employee_id: string;
    financial_year: string;
    declaration_type: 'start_of_year' | 'end_of_year';
    investments: {
        section_80c?: { amount: number; details: string };
        section_80d?: { amount: number; details: string };
        hra?: { amount: number; rent_paid: number; address: string };
        home_loan?: { amount: number; details: string };
        nps?: { amount: number; details: string };
        other?: { section: string; amount: number; details: string }[];
    };
    proof_documents?: string[]; // URLs to uploaded documents
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    remarks?: string;
    submitted_at?: Date;
    reviewed_by?: string;
    reviewed_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface InvestmentDeclarationCreationAttributes extends Optional<InvestmentDeclarationAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> { }

class InvestmentDeclaration extends Model<InvestmentDeclarationAttributes, InvestmentDeclarationCreationAttributes> implements InvestmentDeclarationAttributes {
    public id!: string;
    public employee_id!: string;
    public financial_year!: string;
    public declaration_type!: 'start_of_year' | 'end_of_year';
    public investments!: {
        section_80c?: { amount: number; details: string };
        section_80d?: { amount: number; details: string };
        hra?: { amount: number; rent_paid: number; address: string };
        home_loan?: { amount: number; details: string };
        nps?: { amount: number; details: string };
        other?: { section: string; amount: number; details: string }[];
    };
    public proof_documents?: string[];
    public status!: 'draft' | 'submitted' | 'approved' | 'rejected';
    public remarks?: string;
    public submitted_at?: Date;
    public reviewed_by?: string;
    public reviewed_at?: Date;

    public readonly created_at!: Date;
    public readonly updated_at!: Date;
}

InvestmentDeclaration.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        employee_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        financial_year: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        declaration_type: {
            type: DataTypes.ENUM('start_of_year', 'end_of_year'),
            allowNull: false,
        },
        investments: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        proof_documents: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'draft',
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        submitted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        reviewed_by: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        reviewed_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'investment_declarations',
        timestamps: true,
        underscored: true,
    }
);

export default InvestmentDeclaration;
