import { useCallback, useState } from "react";
const useMessageActions = ({
  setMessages,
  onDelete,
  onUpdate
}) => {
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const handleOpenDeleteDialog = useCallback((event) => {
    setMessageToDelete(event);
    setOpenDeleteDialog(true);
  }, []);
  const handleDelete = useCallback(async () => {
    setOpenDeleteDialog(false);
    if (!messageToDelete) return;
    try {
      const deletedMessageId = await onDelete(messageToDelete.id);
      setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessageId));
      setMessageToDelete(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  }, [messageToDelete, onDelete, setMessages]);
  const handleStartEdit = useCallback((msg) => {
    setMessageToEdit(msg);
  }, []);
  const handleSubmitEdit = useCallback(
    async (data) => {
      if (!messageToEdit) return;
      const optimisticNewFiles = data.uploadFiles.map((file) => ({
        url: URL.createObjectURL(file),
        fileName: file.name,
        mimeType: file.type
      }));
      const optimisticAllFiles = [...data.editedFiles, ...optimisticNewFiles];
      const optimisticContent = {
        type: "message",
        ...data.text && { text: data.text },
        ...optimisticAllFiles.length > 0 && { files: optimisticAllFiles }
      };
      setMessages(
        (prev) => prev.map(
          (msg) => msg.id === messageToEdit.id ? { ...msg, content: optimisticContent, isEdited: true } : msg
        )
      );
      setMessageToEdit(null);
      try {
        const updated = await onUpdate(messageToEdit.id, {
          text: data.text,
          uploadFiles: data.uploadFiles,
          editedFiles: data.editedFiles
        });
        setMessages(
          (prev) => prev.map((msg) => msg.id === updated.id ? updated : msg)
        );
      } catch (error) {
        console.error("Failed to update message:", error);
        setMessages(
          (prev) => prev.map(
            (msg) => msg.id === messageToEdit.id ? messageToEdit : msg
          )
        );
      }
    },
    [messageToEdit, onUpdate, setMessages]
  );
  const handleCancelEdit = useCallback(() => {
    setMessageToEdit(null);
  }, []);
  return {
    messageToDelete,
    openDeleteDialog,
    setOpenDeleteDialog,
    messageToEdit,
    handleOpenDeleteDialog,
    handleDelete,
    handleStartEdit,
    handleSubmitEdit,
    handleCancelEdit
  };
};
export {
  useMessageActions
};
