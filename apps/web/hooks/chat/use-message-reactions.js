import { useCallback } from "react";
const useMessageReactions = ({
  setMessages,
  onReact
}) => {
  const handleReaction = useCallback(
    async (eventId, emoji) => {
      try {
        const updated = await onReact(eventId, emoji);
        setMessages(
          (prev) => prev.map((msg) => msg.id === eventId ? updated : msg)
        );
      } catch (error) {
        console.error("Failed to add reaction:", error);
      }
    },
    [setMessages, onReact]
  );
  return { handleReaction };
};
export {
  useMessageReactions
};
