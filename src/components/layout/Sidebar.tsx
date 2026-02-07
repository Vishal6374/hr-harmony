import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import { LayoutDashboard, Users, Building2, Briefcase, CalendarCheck, Wallet, CalendarDays, Receipt, MessageSquareWarning, FileText, CalendarRange, User, LogOut, ChevronLeft, ChevronRight, ClipboardList, Video, UserMinus, Settings, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BRANDING } from '@/config/branding';

const navItems = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Departments', href: '/departments', icon: Building2, hrOnly: true },
  { title: 'Designations', href: '/designations', icon: Briefcase, hrOnly: true },
  { title: 'Employees', href: '/employees', icon: Users, hrOnly: true },
  { title: 'Tasks', href: '/tasks', icon: ClipboardList },
  { title: 'Meetings', href: '/meetings', icon: Video },
  { title: 'Attendance', href: '/attendance', icon: CalendarCheck },
  { title: 'Payroll', href: '/payroll', icon: Wallet },
  { title: 'Leaves', href: '/leaves', icon: CalendarDays },
  { title: 'Reimbursements', href: '/reimbursements', icon: Receipt },
  { title: 'Complaints', href: '/complaints', icon: MessageSquareWarning },
  { title: 'Policies', href: '/policies', icon: FileText },
  { title: 'Holidays', href: '/holidays', icon: CalendarRange },
  { title: 'Resignations', href: '/resignations', icon: UserMinus, hrOnly: true },
  { title: 'Profile', href: '/profile', icon: User },
  { title: 'Logs', href: '/logs', icon: History, hrOnly: true },
  { title: 'Customization', href: '/system-customization', icon: Settings, adminOnly: true },
];

export function Sidebar() {
  const { user, logout, isHR, isAdmin } = useAuth();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { settings } = useSystemSettings();
  const location = useLocation();

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.hrOnly) return isHR;
    return true;
  });

  const appName = settings?.company_name || BRANDING.name;
  const appLogo = settings?.sidebar_logo_url || settings?.company_logo_url || BRANDING.logo;

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-primary border-r border-primary/20 flex flex-col transition-all duration-300",
      isCollapsed ? "w-20" : "w-[260px]"
    )}>
      <div className={cn("h-16 flex items-center px-4 border-b border-primary/20", isCollapsed ? "justify-center" : "justify-between")}>
        <div className={cn(
          "flex items-center gap-2 mt-5 transition-all duration-300",
          isCollapsed ? "justify-center" : "ml-2"
        )}>
          <img
            src={appLogo}
            alt={`${appName} Logo`}
            className={cn("w-8 h-8 object-contain", isCollapsed && "cursor-pointer")}
            onClick={isCollapsed ? () => setIsCollapsed(!isCollapsed) : undefined}
          />
          <span className={cn(
            "font-bold text-primary-foreground text-xl transition-all duration-300",
            isCollapsed && "hidden"
          )}>{appName}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary/80 mt-5", isCollapsed && "hidden")}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-2">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  title={isCollapsed ? item.title : ""}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group',
                    'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80',
                    isActive && 'bg-accent text-accent-foreground font-medium',
                    isCollapsed && 'justify-center'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={cn(
                    "transition-all duration-300 overflow-hidden whitespace-nowrap",
                    isCollapsed && "w-0 hidden"
                  )}>
                    {item.title}
                  </span>

                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-primary-foreground text-primary rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-sm font-medium z-50">
                      {item.title}
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-primary-foreground/10 p-3">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg transition-all duration-300",
          isCollapsed && "justify-center"
        )}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-accent text-accent-foreground text-xs">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className={cn(
            "flex-1 min-w-0 transition-all duration-300",
            isCollapsed && "w-0 hidden"
          )}>
            <p className="text-sm font-medium text-primary-foreground truncate">{user?.name}</p>
            <p className="text-xs text-primary-foreground/60 truncate capitalize">{user?.role}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-primary-foreground/60 hover:text-destructive hover:bg-primary/80"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
