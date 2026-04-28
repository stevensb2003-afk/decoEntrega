import { cn } from '@/lib/utils';
import { Truck } from 'lucide-react';

interface LogoProps {
  className?: string;
  invert?: boolean;
}

export function Logo({ className, invert }: LogoProps) {
  return (
    <Truck
      className={cn(
        'h-6 w-6',
        invert ? 'text-white' : 'text-primary',
        className
      )}
    />
  );
}
