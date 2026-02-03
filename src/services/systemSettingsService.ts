import api from './api';

export interface SystemSettings {
    id: string;
    company_name: string;
    site_title: string;
    company_logo_url?: string;
    favicon_url?: string;
    sidebar_logo_url?: string;
    login_bg_url?: string;
    login_logo_url?: string;
    login_title: string;
    login_subtitle: string;
    payslip_header_name: string;
    payslip_logo_url?: string;
    payslip_address?: string;
    hr_can_manage_employees: boolean;
}

export const getSystemSettings = async () => {
    return api.get<SystemSettings>('/system-settings');
};

export const updateSystemSettings = async (data: Partial<SystemSettings> | FormData) => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    return api.put<SystemSettings>('/system-settings', data, config);
};

export default {
    getSystemSettings,
    updateSystemSettings,
};
