import { cn } from '@/lib/utils';
import { Truck } from 'lucide-react';

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <div className={cn("flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground", className)}>
        <Truck className="w-6 h-6" {...props} />
    </div>
  );
}
