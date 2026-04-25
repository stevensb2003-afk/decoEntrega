'use client';

import { cn } from '@/lib/utils';
import { ProjectStatus } from '@/lib/types';
import { PROJECT_STATUS_STYLING } from '@/lib/project-styling-utils';

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function ProjectStatusBadge({ status, className }: StatusBadgeProps) {
  const styling = PROJECT_STATUS_STYLING[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styling.badge,
        className
      )}
    >
      {status}
    </span>
  );
}
