
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

// Define the TimelineItemComponent type that includes subcomponents
interface TimelineItemComponent
  extends React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>
  > {
  Indicator: typeof TimelineIndicator;
  Content: typeof TimelineContent;
}

// Create the compound component by casting
const TimelineItemWithSubcomponents = TimelineItem as TimelineItemComponent;

// Attach subcomponents
TimelineItemWithSubcomponents.Indicator = TimelineIndicator;
TimelineItemWithSubcomponents.Content = TimelineContent;

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

// Export the compound component
export { TimelineItemWithSubcomponents as TimelineItem };
