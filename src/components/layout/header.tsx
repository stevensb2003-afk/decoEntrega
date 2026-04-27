'use client';

import Link from 'next/link';
import { Logo } from '../logo';
import { UserNav } from './user-nav';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { NavPath, navLinksConfig } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  Menu, 
  LayoutDashboard, 
  Truck, 
  Wrench, 
  Calendar, 
  History, 
  Users, 
  Settings,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useState, useMemo } from 'react';

const NAV_ICONS: Record<string, React.ReactNode> = {
  '/dashboard': <LayoutDashboard className="h-5 w-5" />,
  '/driver': <Truck className="h-5 w-5" />,
  '/projects': <Wrench className="h-5 w-5" />,
  '/calendar': <Calendar className="h-5 w-5" />,
  '/history': <History className="h-5 w-5" />,
  '/admin/users': <Users className="h-5 w-5" />,
  '/admin/settings': <Settings className="h-5 w-5" />,
};

export function AppHeader() {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const links = useMemo(() => {
    if (!currentUser) return [];

    const userRoles = currentUser.roles || (currentUser.role ? [currentUser.role] : []);

    if (userRoles.includes('admin')) {
        return (Object.keys(navLinksConfig) as NavPath[]).map(path => ({
            href: path,
            label: navLinksConfig[path].label,
        }));
    }

    return (Object.keys(navLinksConfig) as NavPath[]).filter(path => 
        navLinksConfig[path].allowedRoles.some(r => userRoles.includes(r))
      ).map(path => ({
        href: path,
        label: navLinksConfig[path].label,
      }));

  }, [currentUser]);
  
  const defaultHref = useMemo(() => {
      if (!currentUser) return '/';
      const userRoles = currentUser.roles || (currentUser.role ? [currentUser.role] : []);
      if (userRoles.includes('admin') || userRoles.includes('vendedor') || userRoles.includes('bodeguero')) {
          return '/dashboard';
      }
      if (userRoles.includes('chofer')) {
          return '/driver';
      }
      if (userRoles.includes('instalador')) {
          return '/projects';
      }
      return '/';
  }, [currentUser]);


  const currentPage = links.find((link) => link.href === pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur">
      <div className="container flex h-16 items-center">
        <Link href={defaultHref} className="mr-4 flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block font-headline">DecoEntrega</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 text-sm md:flex lg:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-foreground/80 px-3 py-1.5 rounded-md',
                pathname === link.href
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-foreground/60'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation - Sidebar */}
        <div className="md:hidden flex items-center">
          <Sheet open={isMenuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 hover:bg-accent hover:text-accent-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 flex flex-col border-r shadow-2xl">
              <SheetHeader className="p-6 border-b bg-gradient-to-br from-indigo-50/50 to-transparent">
                <SheetTitle className="flex items-center gap-3">
                  <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                    <Logo className="h-6 w-6 text-white" invert />
                  </div>
                  <span className="font-bold text-xl tracking-tight font-headline text-foreground">DecoEntrega</span>
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto py-4 px-3">
                <div className="space-y-1">
                  {links.map((link) => {
                    const isActive = pathname === link.href;
                    const icon = NAV_ICONS[link.href];
                    
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <span className={cn(
                          "transition-transform group-hover:scale-110",
                          isActive ? "text-primary-foreground" : "text-primary"
                        )}>
                          {icon}
                        </span>
                        <span className="flex-1">{link.label}</span>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform",
                          isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0"
                        )} />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {currentUser && (
                <div className="p-4 mt-auto border-t bg-muted/30">
                  <div className="flex items-center gap-3 px-2 py-3 rounded-xl bg-background border shadow-sm">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner", currentUser.avatarColor || 'bg-slate-500')}>
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate leading-none mb-1">{currentUser.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate uppercase tracking-tighter">
                        {currentUser.roles?.join(' • ') || currentUser.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
          <span className="text-lg font-bold font-headline tracking-tight text-foreground ml-1">
            {currentPage?.label || 'Menú'}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
