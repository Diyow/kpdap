"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={`z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-md transition-all duration-200 
      data-[state=delayed-open]:animate-in data-[state=closed]:animate-out 
      data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0 
      data-[state=closed]:zoom-out-95 data-[state=delayed-open]:zoom-in-95 
      data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 
      data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 
      ${className}`}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// A convenient wrapper for quick usage
export function Tooltip({
  children,
  content,
  delayDuration = 200,
  side = "top",
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  delayDuration?: number;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipPrimitive.Portal>
          <TooltipContent side={side}>{content}</TooltipContent>
        </TooltipPrimitive.Portal>
      </TooltipRoot>
    </TooltipProvider>
  );
}

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent };
