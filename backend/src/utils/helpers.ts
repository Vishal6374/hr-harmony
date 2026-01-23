import User from '../models/User';
import { Op } from 'sequelize';

export const generateEmployeeId = async (): Promise<string> => {
    const year = new Date().getFullYear();

    // Get the count of employees created this year
    const count = await User.count({
        where: {
            employee_id: {
                [Op.like]: `EMP${year}-%`,
            },
        },
    });

    const nextNumber = (count + 1).toString().padStart(4, '0');
    return `EMP${year}-${nextNumber}`;
};

export const calculateWorkHours = (checkIn: Date, checkOut: Date): number => {
    let diff = checkOut.getTime() - checkIn.getTime();

    // Handle overnight shift: If checkout is before checkin, assume next day
    if (diff < 0) {
        // Add 24 hours in milliseconds
        diff += 24 * 60 * 60 * 1000;
    }

    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100;
};

export const calculateWorkingDays = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
        const day = current.getDay();
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (day !== 0 && day !== 6) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
};

export const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

export const calculateAge = (dateOfBirth: Date): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

export const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
};
