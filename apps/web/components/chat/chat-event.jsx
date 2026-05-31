import { cn } from "@/lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
const FORMAT_PRESETS = {
  time: { timeStyle: "short" },
  date: { dateStyle: "medium" },
  dateTime: { dateStyle: "medium", timeStyle: "short" },
  longDate: { dateStyle: "long" },
  relative: { dateStyle: "medium", timeStyle: "short" }
};
function ChatEvent({ children, className, ...props }) {
  return <div
    className={cn(
      "flex gap-2 px-2 relative group/event hover:z-10",
      className
    )}
    {...props}
  >
      {children}
    </div>;
}
function ChatEventAddon({
  children,
  className,
  ...props
}) {
  return <div
    className={cn(
      "w-10 @md/chat:w-12 h-full flex justify-center pt-1 shrink-0",
      className
    )}
    {...props}
  >
      {children}
    </div>;
}
function ChatEventBody({
  children,
  className,
  ...props
}) {
  return <div className={cn("flex-1 flex flex-col", className)} {...props}>
      {children}
    </div>;
}
function ChatEventContent({
  children,
  className,
  ...props
}) {
  return <div
    className={cn(
      "text-sm @md/chat:text-base whitespace-pre-wrap",
      className
    )}
    {...props}
  >
      {children}
    </div>;
}
function ChatEventTitle({
  children,
  className,
  ...props
}) {
  return <div
    className={cn("flex items-center gap-2 text-sm", className)}
    {...props}
  >
      {children}
    </div>;
}
function ChatEventAvatar({
  className,
  src,
  alt,
  fallback,
  imageProps,
  fallbackProps,
  ...props
}) {
  return <Avatar
    className={cn("rounded-full size-8 @md/chat:size-10", className)}
    {...props}
  >
      <AvatarImage src={src} alt={alt} {...imageProps} />
      {fallback && <AvatarFallback {...fallbackProps}>{fallback}</AvatarFallback>}
    </Avatar>;
}
function getRelativeTimeString(date, locale) {
  const now = /* @__PURE__ */ new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1e3);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, "second");
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, "minute");
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, "hour");
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return rtf.format(-diffInDays, "day");
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
function ChatEventTime({
  timestamp,
  format = "dateTime",
  locale,
  formatOptions,
  className,
  ...props
}) {
  const date = useMemo(
    () => timestamp instanceof Date ? timestamp : new Date(timestamp),
    [timestamp]
  );
  const resolvedLocale = locale ?? (typeof navigator !== "undefined" ? navigator.language : "en-US");
  const formattedTime = useMemo(() => {
    if (format === "relative") {
      return getRelativeTimeString(date, resolvedLocale);
    }
    const options = formatOptions ?? FORMAT_PRESETS[format];
    return new Intl.DateTimeFormat(resolvedLocale, options).format(date);
  }, [date, format, formatOptions, resolvedLocale]);
  const isoString = useMemo(() => date.toISOString(), [date]);
  return <time
    dateTime={isoString}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  >
      {formattedTime}
    </time>;
}
function ChatEventHoverActions({
  children,
  className,
  ...props
}) {
  return <div
    className={cn(
      "opacity-0 group-hover/event:opacity-100 pointer-events-none group-hover/event:pointer-events-auto",
      "[&:has([data-state=open])]:opacity-100 [&:has([data-state=open])]:pointer-events-auto",
      "absolute right-2 -top-4",
      "bg-background border rounded-md shadow-sm",
      "flex items-center gap-0.5 p-0.5",
      "z-15",
      className
    )}
    {...props}
  >
      {children}
    </div>;
}
function ChatEventHoverActionsButton({
  className,
  children,
  ...props
}) {
  return <Button
    variant="ghost"
    size="icon"
    className={cn("size-7 [&_svg]:size-3.5", className)}
    {...props}
  >
      {children}
    </Button>;
}
export {
  ChatEvent,
  ChatEventAddon,
  ChatEventAvatar,
  ChatEventBody,
  ChatEventContent,
  ChatEventHoverActions,
  ChatEventHoverActionsButton,
  ChatEventTime,
  ChatEventTitle
};
