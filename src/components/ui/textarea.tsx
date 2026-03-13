"use client";

import * as React from "react";
import { TextArea as HeroUITextArea } from "@heroui/react";

export interface TextareaProps
  extends React.ComponentProps<typeof HeroUITextArea> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <HeroUITextArea ref={ref} className={className} {...props} />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
