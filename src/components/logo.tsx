import { cn } from '@/lib/utils';
import { Truck } from 'lucide-react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  invert?: boolean;
}

export function Logo({ className, invert, ...props }: LogoProps) {
  return (
    <div className={cn(
      "flex items-center justify-center w-12 h-12 rounded-full",
      invert ? "bg-white text-primary" : "bg-primary text-primary-foreground",
      className
    )}>
        <Truck className="w-6 h-6" {...props} />
    </div>
  );
}
