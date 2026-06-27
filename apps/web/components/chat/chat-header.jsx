import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
function ChatHeader({ children, className, ...props }) {
  return <div
    className={cn(
      "sticky top-0 z-10 p-2 bg-background flex items-center gap-2",
      className
    )}
    {...props}
  >
      {children}
    </div>;
}
function ChatHeaderMain({
  children,
  className,
  ...props
}) {
  return <div className={cn("flex-1 flex items-center gap-2", className)} {...props}>
      {children}
    </div>;
}
function ChatHeaderAddon({
  children,
  className,
  ...props
}) {
  return <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>;
}
function ChatHeaderAvatar({
  className,
  src,
  alt,
  fallback,
  imageProps,
  fallbackProps,
  ...props
}) {
  return <Avatar
    alt={alt}
    className={cn("rounded-full", className)}
    initials={fallback}
    src={src || undefined}
    {...props}
  />;
}
function ChatHeaderButton({
  children,
  className,
  ...props
}) {
  return <Button variant="ghost" size="icon-sm" className={cn(className)} {...props}>
      {children}
    </Button>;
}
export {
  ChatHeader,
  ChatHeaderAddon,
  ChatHeaderAvatar,
  ChatHeaderButton,
  ChatHeaderMain
};
