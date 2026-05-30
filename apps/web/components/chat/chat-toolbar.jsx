"use client";
import * as React from "react";
import { FileTextIcon, PaperclipIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
function ChatToolbar({
  children,
  className,
  ...props
}) {
  return <div
    className={cn("sticky bottom-0 p-2 pt-0 bg-background", className)}
    {...props}
  >
      <div
    className={cn(
      "border border-white/10 rounded-md p-2",
      "flex flex-wrap items-start gap-x-2"
    )}
  >
        {children}
      </div>
    </div>;
}
const NEWLINE_MODIFIER_KEY = "shiftKey";
function ChatToolbarTextarea({
  className,
  onSubmit,
  onKeyDown,
  ...props
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e[NEWLINE_MODIFIER_KEY]) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };
  return <div className="flex-1 min-w-0 order-2 grid">
      <Textarea
    id="toolbar-input"
    placeholder="Type your message..."
    className={cn(
      "h-fit min-h-10 max-h-30 px-1 @md/chat:text-base",
      "border-none shadow-none focus-visible:border-none focus-visible:ring-0 placeholder:whitespace-nowrap resize-none",
      className
    )}
    rows={1}
    onKeyDown={handleKeyDown}
    {...props}
  />
    </div>;
}
const chatToolbarAddonAlignStyles = {
  "inline-start": "order-1",
  "inline-end": "order-3",
  "block-start": "order-0 w-full h-auto",
  "block-end": "order-4 w-full h-auto"
};
function ChatToolbarAddon({
  children,
  className,
  align = "inline-start",
  ...props
}) {
  return <div
    className={cn(
      "h-10 flex items-center gap-1.5",
      chatToolbarAddonAlignStyles[align],
      className
    )}
    {...props}
  >
      {children}
    </div>;
}
function ChatToolbarButton({
  children,
  className,
  ...props
}) {
  return <Button
    variant="ghost"
    className={cn(
      "size-9 @md/chat:size-9 [&_svg:not([class*='size-'])]:size-5 [&_svg:not([class*='size-'])]:@md/chat:size-5 [&_svg]:stroke-[1.7px]",
      className
    )}
    type="button"
    {...props}
  >
      {children}
    </Button>;
}
function ChatToolbarAttachment({
  fileName,
  onRemove,
  className,
  ...props
}) {
  return <div
    className={cn(
      "relative group size-20 @md/chat:size-30 rounded-md border border-white/10 bg-muted flex flex-col items-center justify-center gap-1 shrink-0",
      className
    )}
    {...props}
  >
      <FileTextIcon className="size-5 @md/chat:size-6 text-muted-foreground stroke-[1.5px]" />
      <span className="text-[10px] @md/chat:text-xs text-muted-foreground leading-tight max-w-[calc(100%-8px)] truncate">
        {fileName}
      </span>
      {onRemove && <button
    type="button"
    onClick={onRemove}
    className="absolute top-0 right-0 size-4 @md/chat:size-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
  >
          <XIcon className="size-2.5 @md/chat:size-3" />
        </button>}
    </div>;
}
function ChatToolbarAttachmentButton({
  children,
  onFilesSelected,
  accept,
  multiple = true,
  ...props
}) {
  const inputRef = React.useRef(null);
  const handleClick = () => {
    inputRef.current?.click();
  };
  const handleChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected?.(Array.from(files));
    }
    e.target.value = "";
  };
  return <>
      <ChatToolbarButton onClick={handleClick} {...props}>
        {children ?? <PaperclipIcon />}
      </ChatToolbarButton>
      <input
    ref={inputRef}
    type="file"
    className="hidden"
    accept={accept}
    multiple={multiple}
    onChange={handleChange}
  />
    </>;
}
export {
  ChatToolbar,
  ChatToolbarAddon,
  ChatToolbarAttachment,
  ChatToolbarAttachmentButton,
  ChatToolbarButton,
  ChatToolbarTextarea
};
