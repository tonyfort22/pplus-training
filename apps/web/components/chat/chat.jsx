import { cn } from "@/lib/utils";
function Chat({ children, className, ...props }) {
  return <div
    className={cn(
      "h-full overflow-hidden flex flex-col @container/chat",
      className
    )}
    {...props}
  >
      {children}
    </div>;
}
export {
  Chat
};
