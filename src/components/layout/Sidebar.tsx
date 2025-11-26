import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Target,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  Users,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MenuItem {
  title: string;
  icon?: LucideIcon;
  path?: string;
  adminOnly?: boolean;
}

// Menu com Gestão Estratégica, Pessoas e Administração
const menuItems: MenuItem[] = [
  {
    title: 'Gestão Estratégica',
    icon: Target,
    path: '/gestao-estrategica'
  },
  {
    title: 'Pessoas',
    icon: Users,
    path: '/pessoas'
  },
  {
    title: 'Administração',
    icon: Settings,
    path: '/administracao',
    adminOnly: true
  }
];

interface MenuItemProps {
  item: MenuItem;
  onNavigate?: () => void;
  isMinimized?: boolean;
}

function MenuItem({ item, onNavigate, isMinimized = false }: MenuItemProps) {
  const location = useLocation();
  const { user } = useAuth();

  if (item.adminOnly && user?.role !== 'ADMIN') {
    return null;
  }

  const isActive = item.path === location.pathname;

  const content = (
    <Link
      to={item.path || '#'}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2 px-4 py-2 text-sm text-white/90 hover:bg-white/10 transition-colors',
        isActive && 'bg-white/20 text-white border-r-4 border-white',
        isMinimized && 'justify-center'
      )}
    >
      {item.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
      {!isMinimized && <span>{item.title}</span>}
    </Link>
  );

  if (isMinimized && item.icon) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebar-minimized');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar-minimized', String(isMinimized));
  }, [isMinimized]);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky left-0 z-50 h-screen overflow-y-auto transition-all duration-300 ease-in-out',
          'lg:top-[73px] lg:h-[calc(100vh-73px)]',
          'top-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isMinimized ? 'w-16' : 'w-64'
        )}
        style={{
          backgroundColor: '#002547'
        }}
      >
        {/* Header do Sidebar */}
        <div
          className="sticky top-0 z-10"
          style={{
            backgroundColor: '#002547',
            borderBottomColor: '#ffffff40',
            borderBottomWidth: '1px'
          }}
        >
          <div className="flex items-center justify-between p-4">
            {/* Botão Minimizar (Desktop) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMinimize}
              className="hidden lg:flex text-white hover:bg-white/10"
              title={isMinimized ? 'Expandir menu' : 'Minimizar menu'}
            >
              {isMinimized ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  <span className="text-xs">Minimizar</span>
                </>
              )}
            </Button>

            {/* Botão Fechar (Mobile) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden ml-auto text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="py-4">
          {menuItems.map((item, index) => (
            <MenuItem key={index} item={item} onNavigate={onClose} isMinimized={isMinimized} />
          ))}
        </nav>
      </aside>
    </>
  );
}