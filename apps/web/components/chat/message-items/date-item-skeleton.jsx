import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ChatEvent } from "@/components/chat/chat-event";
import { Skeleton } from "@/components/ui/skeleton";
function DateItemSkeleton({ className }) {
  return <ChatEvent className={cn("items-center gap-1", className)}>
      <Separator className="flex-1" />
      <Skeleton className="h-4 w-28" />
      <Separator className="flex-1" />
    </ChatEvent>;
}
export {
  DateItemSkeleton
};
