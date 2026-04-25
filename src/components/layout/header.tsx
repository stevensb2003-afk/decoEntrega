'use client';

import Link from 'next/link';
import { Logo } from '../logo';
import { UserNav } from './user-nav';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { NavPath, navLinksConfig } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';

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

        {/* Mobile Navigation */}
        <div className="md:hidden flex-1">
          {links.length > 1 && (
            <DropdownMenu open={isMenuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-md font-semibold">
                  {currentPage?.label || 'Menú'}
                  <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", isMenuOpen && "rotate-180")} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {links.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className={cn(pathname === link.href && 'font-bold')}>
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
           {links.length === 1 && (
             <span className="text-md font-semibold">{links[0].label}</span>
           )}
        </div>

        <div className="ml-auto flex items-center gap-4">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
