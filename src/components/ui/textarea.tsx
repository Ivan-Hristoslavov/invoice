"use client";

import * as React from "react";
import { TextArea } from "@radix-ui/themes";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextArea
        ref={ref}
        className={className}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
