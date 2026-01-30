import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, Building2, Briefcase, CalendarCheck, Wallet, CalendarDays, Receipt, MessageSquareWarning, FileText, CalendarRange, User, LogOut, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const navItems = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Departments', href: '/departments', icon: Building2, hrOnly: true },
    { title: 'Designations', href: '/designations', icon: Briefcase, hrOnly: true },
    { title: 'Employees', href: '/employees', icon: Users, hrOnly: true },
    { title: 'Attendance', href: '/attendance', icon: CalendarCheck },
    { title: 'Payroll', href: '/payroll', icon: Wallet },
    { title: 'Leaves', href: '/leaves', icon: CalendarDays },
    { title: 'Reimbursements', href: '/reimbursements', icon: Receipt },
    { title: 'Complaints', href: '/complaints', icon: MessageSquareWarning },
    { title: 'Policies', href: '/policies', icon: FileText },
    { title: 'Holidays', href: '/holidays', icon: CalendarRange },
    { title: 'Profile', href: '/profile', icon: User },
];

interface MobileSidebarProps {
    open: boolean;
    onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
    const { user, logout, isHR } = useAuth();
    const location = useLocation();
    const filteredNavItems = navItems.filter((item) => !item.hrOnly || isHR);

    const handleLogout = () => {
        logout();
        onClose();
    };

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side="left" className="w-[280px] p-0 bg-primary border-r border-primary/20">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <SheetHeader className="p-4 border-b border-primary/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img src="/favicon.png" alt="Catalyr Logo" className="w-8 h-8 object-contain" />
                                <SheetTitle className="font-bold text-primary-foreground text-xl">Catalyr HRMS</SheetTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary/80"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </SheetHeader>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-2">
                        <ul className="space-y-1">
                            {filteredNavItems.map((item) => {
                                const isActive = location.pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <li key={item.href}>
                                        <NavLink
                                            to={item.href}
                                            onClick={onClose}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                                'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80',
                                                isActive && 'bg-accent text-accent-foreground font-medium'
                                            )}
                                        >
                                            <Icon className="h-5 w-5 flex-shrink-0" />
                                            <span>{item.title}</span>
                                        </NavLink>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* User Profile */}
                    <div className="border-t border-primary/20 p-3">
                        <div className="flex items-center gap-3 p-2 rounded-lg">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user?.avatar} alt={user?.name} />
                                <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                                    {user?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-primary-foreground truncate">{user?.name}</p>
                                <p className="text-xs text-primary-foreground/60 truncate capitalize">{user?.role}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLogout}
                                className="text-primary-foreground/60 hover:text-destructive hover:bg-primary/80"
                                title="Logout"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
