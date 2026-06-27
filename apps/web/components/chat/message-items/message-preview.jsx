import {
  ChatEvent,
  ChatEventAddon,
  ChatEventAvatar,
  ChatEventBody,
  ChatEventContent,
  ChatEventTime,
  ChatEventTitle
} from "@/components/chat/chat-event";
import { MessageContent } from "@/components/chat/message-items/message-content";
function MessagePreview({
  avatarSrc,
  avatarAlt,
  avatarFallback,
  senderName,
  content,
  timestamp,
  onClick,
  className
}) {
  return <ChatEvent className={className} onClick={onClick}>
      <ChatEventAddon>
        <ChatEventAvatar
    src={avatarSrc}
    alt={avatarAlt}
    fallback={avatarFallback}
  />
      </ChatEventAddon>
      <ChatEventBody>
        <ChatEventTitle>
          <span className="font-medium truncate">{senderName}</span>
          <ChatEventTime timestamp={timestamp} />
        </ChatEventTitle>
        <ChatEventContent>
          <MessageContent content={content} />
        </ChatEventContent>
      </ChatEventBody>
    </ChatEvent>;
}
export {
  MessagePreview
};
