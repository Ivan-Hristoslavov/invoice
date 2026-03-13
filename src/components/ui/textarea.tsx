"use client";

import * as React from "react";
import { TextArea as HeroUITextArea } from "@heroui/react";

export interface TextareaProps
  extends React.ComponentProps<typeof HeroUITextArea> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, classNames, ...props }, ref) => (
    <HeroUITextArea
      ref={ref}
      fullWidth
      className={className}
      classNames={{
        ...classNames,
        input: `text-base md:text-sm ${classNames?.input ?? ""}`.trim(),
      }}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
