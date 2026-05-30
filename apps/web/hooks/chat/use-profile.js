import { useCallback, useState } from "react";
const useProfile = ({
  setSidebarOpen,
  setSidebarView,
  onBlock,
  onUnblock
}) => {
  const [openBlockDialog, setOpenBlockDialog] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const openProfile = useCallback(() => {
    setSidebarView("profile");
    setSidebarOpen(true);
  }, [setSidebarView, setSidebarOpen]);
  const handleBlock = useCallback(
    async (userId) => {
      try {
        await onBlock(userId);
        setIsBlocked(true);
        setOpenBlockDialog(false);
      } catch (error) {
        console.error("Failed to block user:", error);
      }
    },
    [onBlock]
  );
  const handleUnblock = useCallback(
    async (userId) => {
      try {
        await onUnblock(userId);
        setIsBlocked(false);
      } catch (error) {
        console.error("Failed to unblock user:", error);
      }
    },
    [onUnblock]
  );
  return {
    openBlockDialog,
    setOpenBlockDialog,
    isBlocked,
    openProfile,
    handleBlock,
    handleUnblock
  };
};
export {
  useProfile
};
