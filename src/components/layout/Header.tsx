import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header
      className="sticky top-0 z-[60] h-[73px] px-4 lg:px-6 flex items-center justify-between"
      style={{
        backgroundColor: '#003766',
        borderBottom: '1px solid #ffffff'
      }}
    >
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Botão Menu Mobile */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-white hover:bg-white/10"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo - Brasão de Goiás */}
        <img
          src="/brasao-goias.png"
          alt="Brasão de Goiás"
          className="h-12 w-auto object-contain"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
        />

        <div className="hidden md:block border-l h-12 mx-2" style={{ borderColor: '#ffffff40' }}></div>

        <h1 className="text-sm md:text-lg lg:text-xl font-semibold text-white line-clamp-2">
          Plataforma de Governança Judiciária e Tecnológica
        </h1>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">{user?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>{user?.email}</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <span className="text-xs text-muted-foreground">
              Perfil: {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'MANAGER' ? 'Gestor' : 'Visualizador'}
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}