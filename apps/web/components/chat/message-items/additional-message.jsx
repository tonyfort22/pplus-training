import { cn } from "@/lib/utils";
import {
  ChatEvent,
  ChatEventAddon,
  ChatEventBody,
  ChatEventContent,
  ChatEventHoverActions,
  ChatEventHoverActionsButton,
  ChatEventTime
} from "@/components/chat/chat-event";
import { MessageContent } from "@/components/chat/message-items/message-content";
import { MessageActionsDropdown } from "@/components/chat/message-actions/message-actions-dropdown";
import { ReactionsPopover } from "@/components/chat/message-reactions/reactions-popover";
import { MoreHorizontalIcon, SmilePlusIcon } from "lucide-react";
function AdditionalMessage({
  className,
  content,
  timestamp,
  status,
  reactions,
  isEdited,
  onReaction,
  onDelete,
  onEdit,
  id,
  highlighted
}) {
  return <ChatEvent
    id={id}
    className={cn(
      "hover:bg-accent",
      highlighted && "animate-message-highlight",
      className
    )}
  >
      <ChatEventAddon>
        <ChatEventTime
    timestamp={timestamp}
    format="time"
    className="text-right text-[8px] @md/chat:text-[10px] group-hover/event:visible invisible"
  />
      </ChatEventAddon>
      <ChatEventBody>
        <ChatEventContent
    className={cn({
      "opacity-70": status === "sending"
    })}
  >
          <MessageContent content={content} />
        </ChatEventContent>
        {isEdited && <span className="text-muted-foreground text-sm">(edited)</span>}
        {reactions && reactions.length > 0 && <div className="flex gap-1 flex-wrap mt-1">
            {reactions.map((emoji, i) => <button
    key={`${emoji}-${i}`}
    type="button"
    onClick={() => onReaction?.(emoji)}
    className="text-sm bg-accent border rounded-full px-2 py-0.5 select-none hover:bg-destructive/10 hover:border-destructive/40 transition-colors"
    aria-label={`Toggle ${emoji} reaction`}
  >
                {emoji}
              </button>)}
          </div>}
      </ChatEventBody>
      <ChatEventHoverActions>
        <ReactionsPopover onReaction={onReaction}>
          <ChatEventHoverActionsButton aria-label="Add reaction">
            <SmilePlusIcon />
          </ChatEventHoverActionsButton>
        </ReactionsPopover>
        <MessageActionsDropdown onEdit={onEdit} onDelete={onDelete}>
          <ChatEventHoverActionsButton aria-label="More options">
            <MoreHorizontalIcon />
          </ChatEventHoverActionsButton>
        </MessageActionsDropdown>
      </ChatEventHoverActions>
    </ChatEvent>;
}
export {
  AdditionalMessage
};
