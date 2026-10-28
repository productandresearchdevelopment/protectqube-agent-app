"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SharedLayoutBgProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  inset?: number | string;
  pillClassName?: string;
  pillContainerClassName?: string;
  children?: React.ReactNode;
}

export const SharedLayoutBg = forwardRef<HTMLElement, SharedLayoutBgProps>(
  function SharedLayoutBg(
    {
      as: Component = "ul",
      children,
      className,
      pillClassName,
      pillContainerClassName,
      inset,
      ...props
    },
    ref,
  ) {
    return (
      <Component ref={ref} className={cn("relative", className)} {...props}>
        {children}
      </Component>
    );
  },
);
