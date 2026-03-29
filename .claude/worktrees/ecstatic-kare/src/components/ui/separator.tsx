"use client";

import * as React from "react";
import { Separator as HeroUISeparator } from "@heroui/react";

const Separator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof HeroUISeparator>
>(({ className, ...props }, ref) => (
  <HeroUISeparator ref={ref} className={className} {...props} />
));
Separator.displayName = "Separator";

export { Separator };
