# HR Harmony Backend

Backend API for HR Harmony HRMS built with Node.js, Express, TypeScript, MySQL, and Sequelize.

## Features

- ✅ JWT Authentication with role-based access control
- ✅ Employee Management
- ✅ Department & Designation Management
- ✅ Attendance Tracking with locking mechanism
- ✅ Leave Management with approval workflow
- ✅ Payroll Processing with immutability
- ✅ Reimbursement Management
- ✅ Complaint/Grievance System
- ✅ Policy Management
- ✅ Holiday Calendar
- ✅ Comprehensive Audit Logging
- ✅ Input Validation & Error Handling
- ✅ Security Best Practices

## Prerequisites

- Node.js >= 16.x
- MySQL >= 8.0
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Create and seed the database:
```bash
npm run db:seed
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Production

Build and start:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Employees (HR Only)
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee by ID
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Terminate employee

## Database Scripts

- `npm run db:sync` - Synchronize database schema
- `npm run db:sync -- --force` - Drop and recreate all tables
- `npm run db:seed` - Seed database with sample data

## Default Credentials

After seeding:

**HR Account:**
- Email: hr@company.com
- Password: hr123

**Employee Account:**
- Email: john.smith@company.com
- Password: emp123

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── scripts/         # Database scripts
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── uploads/             # File uploads directory
├── .env                 # Environment variables
├── .env.example         # Environment template
├── package.json
├── tsconfig.json
└── nodemon.json
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control (RBAC)
- Input validation
- SQL injection prevention (Sequelize ORM)
- XSS protection (Helmet)
- CORS configuration
- Rate limiting ready
- Audit logging for critical actions

## License

ISC
