import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isCollapsed } = useSidebar();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-primary border-b border-primary/20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="Catalyr Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-primary-foreground text-xl">Catalyr HRMS</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="text-primary-foreground hover:bg-primary/80"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Main Content */}
      <main
        className="min-h-screen transition-all duration-300 pt-16 lg:pt-0"
        style={{
          marginLeft: window.innerWidth >= 1024 ? (isCollapsed ? 80 : 260) : 0
        }}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">{children}</div>
      </main>
    </div>
  );
}
