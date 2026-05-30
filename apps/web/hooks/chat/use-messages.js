import { useEffect, useState } from "react";
const useMessages = ({
  onFetch
}) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const fetchedMessages = await onFetch();
        setMessages(fetchedMessages);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [onFetch]);
  return { loading, messages, setMessages };
};
export {
  useMessages
};
