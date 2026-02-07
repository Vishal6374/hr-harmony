import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { History, Search, Eye, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '@/services/apiService';
import { PageLoader } from '@/components/ui/page-loader';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Logs() {
    const { isHR, isAdmin } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<any>(null);

    if (!isHR && !isAdmin) return <Navigate to="/dashboard" replace />;

    const { data: logs = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const { data } = await auditLogService.getAll();
            return data;
        },
    });

    const filteredLogs = logs.filter((log: any) =>
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.performer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns: Column<any>[] = [
        {
            key: 'created_at',
            header: 'Time',
            cell: (log) => (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM d, h:mm a')}
                </span>
            ),
        },
        {
            key: 'performer',
            header: 'User',
            cell: (log) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {log.performer?.avatar_url ? (
                            <img src={log.performer.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-4 h-4 text-primary" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium">{log.performer?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground uppercase">{log.performer?.role}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'module',
            header: 'Module',
            cell: (log) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium uppercase tracking-wider">
                    {log.module}
                </span>
            ),
        },
        {
            key: 'action',
            header: 'Action',
            cell: (log) => (
                <span className="text-sm font-medium">{log.action}</span>
            ),
        },
        {
            key: 'actions',
            header: '',
            cell: (log) => (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedLog(log)}>
                    <Eye className="w-4 h-4" />
                </Button>
            ),
            className: 'w-[50px]',
        },
    ];

    if (isLoading) {
        return <PageLoader />;
    }

    return (
        <MainLayout>
            <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <PageHeader title="System Logs" description="Review system activities and audit trails">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isRefetching}
                        >
                            <History className={cn("w-4 h-4 mr-2", isRefetching && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </PageHeader>

                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <DataTable
                    columns={columns}
                    data={filteredLogs}
                    keyExtractor={(log) => log.id}
                    emptyMessage="No logs found"
                />

                <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Log Details</DialogTitle>
                        </DialogHeader>
                        {selectedLog && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Time</p>
                                        <p className="text-sm">{format(new Date(selectedLog.created_at), 'MMMM d, yyyy h:mm:ss a')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Module</p>
                                        <p className="text-sm uppercase">{selectedLog.module}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">User</p>
                                        <p className="text-sm">{selectedLog.performer?.name} ({selectedLog.performer?.email})</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Action</p>
                                        <p className="text-sm font-medium">{selectedLog.action}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Entity Type</p>
                                        <p className="text-sm">{selectedLog.entity_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Entity ID</p>
                                        <p className="text-sm font-mono text-xs">{selectedLog.entity_id}</p>
                                    </div>
                                </div>

                                {selectedLog.old_value && (
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Old Value</p>
                                        <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs whitespace-pre-wrap max-h-40">
                                            {JSON.stringify(selectedLog.old_value, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {selectedLog.new_value && (
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">New Value</p>
                                        <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs whitespace-pre-wrap max-h-40">
                                            {JSON.stringify(selectedLog.new_value, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    );
}
