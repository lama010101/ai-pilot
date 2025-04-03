
import React from "react";
import { cn } from "@/lib/utils";

interface TimelineItemProps {
  children: React.ReactNode;
  className?: string;
}

interface TimelineIndicatorProps {
  children: React.ReactNode;
  className?: string;
}

interface TimelineContentProps {
  children: React.ReactNode;
  className?: string;
}

export const TimelineItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex gap-3", className)}
    {...props}
  >
    {children}
  </div>
));
TimelineItem.displayName = "TimelineItem";

const TimelineIndicator = React.forwardRef<
  HTMLDivElement,
  TimelineIndicatorProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative flex-shrink-0", className)}
    {...props}
  >
    {children}
    <div className="absolute w-px bg-border h-full left-1/2 top-7 -translate-x-1/2"></div>
  </div>
));
TimelineIndicator.displayName = "TimelineIndicator";

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  TimelineContentProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-grow pb-8", className)}
    {...props}
  >
    {children}
  </div>
));
TimelineContent.displayName = "TimelineContent";

// Define the TimelineItem compound component with its subcomponents
type TimelineItemComponent = React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
> & {
  Indicator: typeof TimelineIndicator;
  Content: typeof TimelineContent;
};

// Attach subcomponents to TimelineItem
(TimelineItem as TimelineItemComponent).Indicator = TimelineIndicator;
(TimelineItem as TimelineItemComponent).Content = TimelineContent;

export const Timeline = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-0", className)}
    {...props}
  >
    {children}
  </div>
));
Timeline.displayName = "Timeline";

// Export the TimelineItem with its type that includes the subcomponents
export { TimelineItem as TimelineItemWithSubcomponents };
