import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import AuditLog from '../models/AuditLog';

export const auditLog = (module: string, action: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                const entityId = req.params.id || body?.id || 'N/A';

                AuditLog.create({
                    action,
                    module,
                    entity_type: module,
                    entity_id: entityId,
                    performed_by: req.user.id,
                    new_value: body,
                    ip_address: req.ip,
                    user_agent: req.get('user-agent'),
                }).catch((error) => {
                    console.error('Audit log error:', error);
                });
            }

            return originalJson(body);
        };

        next();
    };
};
