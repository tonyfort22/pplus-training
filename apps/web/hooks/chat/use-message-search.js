import { useCallback, useEffect, useRef, useState } from "react";
const useMessageSearch = ({
  setSidebarOpen,
  setSidebarView,
  onSearch
}) => {
  const searchIdRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  useEffect(() => {
    if (highlightedMessageId === null) return;
    const timer = setTimeout(() => setHighlightedMessageId(null), 3e3);
    return () => clearTimeout(timer);
  }, [highlightedMessageId]);
  const handleSearch = useCallback(
    async (query) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      const currentSearchId = ++searchIdRef.current;
      setActiveSearchQuery(trimmed);
      setSidebarView("search");
      setSidebarOpen(true);
      try {
        const results = await onSearch(trimmed);
        if (currentSearchId === searchIdRef.current) {
          setSearchResults(results);
        }
      } catch (error) {
        console.error("Search failed:", error);
        if (currentSearchId === searchIdRef.current) {
          setSearchResults([]);
        }
      }
    },
    [setSidebarOpen, setSidebarView, onSearch]
  );
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setSearchResults([]);
  }, []);
  const openSearch = useCallback(() => {
    setSidebarView("search");
    setSidebarOpen(true);
  }, [setSidebarView, setSidebarOpen]);
  return {
    searchQuery,
    setSearchQuery,
    activeSearchQuery,
    searchResults,
    highlightedMessageId,
    setHighlightedMessageId,
    handleSearch,
    handleClearSearch,
    openSearch
  };
};
export {
  useMessageSearch
};
