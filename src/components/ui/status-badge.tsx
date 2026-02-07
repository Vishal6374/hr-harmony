import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'warning' | 'destructive' | 'info' | 'muted' | 'default';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-success/15 text-success border-success/20',
  warning: 'bg-warning/15 text-warning border-warning/20',
  destructive: 'bg-destructive/15 text-destructive border-destructive/20',
  info: 'bg-info/15 text-info border-info/20',
  muted: 'bg-muted text-muted-foreground border-border',
  default: 'bg-primary/10 text-primary border-primary/20',
};

const statusToVariant: Record<string, StatusVariant> = {
  active: 'success', inactive: 'muted', on_leave: 'warning', terminated: 'destructive',
  pending: 'warning', approved: 'success', rejected: 'destructive', cancelled: 'muted',
  pending_manager: 'warning', pending_hr: 'info', rejected_by_manager: 'destructive', rejected_by_hr: 'destructive',
  draft: 'muted', processed: 'info', paid: 'success',
  present: 'success', absent: 'destructive', half_day: 'warning', holiday: 'info', weekend: 'muted',
  open: 'warning', in_progress: 'info', resolved: 'success', closed: 'muted',
  low: 'muted', medium: 'warning', high: 'destructive', urgent: 'destructive',
  locked: 'info', withdrawn: 'muted',
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const safeStatus = status || 'unknown';
  const computedVariant = variant || statusToVariant[safeStatus.toLowerCase()] || 'default';

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', variantStyles[computedVariant], className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', computedVariant === 'success' && 'bg-success', computedVariant === 'warning' && 'bg-warning', computedVariant === 'destructive' && 'bg-destructive', computedVariant === 'info' && 'bg-info', computedVariant === 'muted' && 'bg-muted-foreground', computedVariant === 'default' && 'bg-primary')} />
      {safeStatus.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
    </span>
  );
}
