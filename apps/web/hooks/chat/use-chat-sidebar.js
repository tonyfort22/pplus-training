import { useState } from "react";
const useChatSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState(
    "search"
  );
  return {
    sidebarOpen,
    setSidebarOpen,
    sidebarView,
    setSidebarView
  };
};
export {
  useChatSidebar
};
