"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// Importante: Asegúrate de tener el CSS aquí o en layout.tsx
import "react-day-picker/style.css"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center", // Cambiado de 'caption'
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        button_previous: cn( // Cambiado de 'nav_button_previous'
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        ),
        button_next: cn( // Cambiado de 'nav_button_next'
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        ),
        month_grid: "w-full border-collapse space-y-1", // Cambiado de 'table'
        weekdays: "flex", // Cambiado de 'head_row'
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]", // Cambiado de 'head_cell'
        week: "flex w-full mt-2", // Cambiado de 'row'
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground", // Cambiado de 'day_selected'
        today: "bg-accent text-accent-foreground", // Cambiado de 'day_today'
        outside: "day-outside text-muted-foreground opacity-50", // Cambiado de 'day_outside'
        disabled: "text-muted-foreground opacity-50", // Cambiado de 'day_disabled'
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground", // Cambiado de 'day_range_middle'
        hidden: "invisible", // Cambiado de 'day_hidden'
        ...classNames,
      }}
      components={{
        Chevron: ({ ...props }) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-4 w-4" />;
          }
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
