import {
  EVENTS
} from "@/data/mock/support-chat/messages";
import { CURRENT_USER } from "@/data/mock/support-chat/users";
const searchEvents = (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return Promise.resolve([]);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(EVENTS.filter((e) => e.content.text?.toLowerCase().includes(q)));
    }, 150);
  });
};
const getEvents = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(EVENTS);
    }, 1e3);
  });
};
const postEvent = ({
  text,
  files
}) => {
  if (!text && (!files || files.length === 0)) {
    return Promise.reject(new Error("Either text or files must be provided"));
  }
  const content = {
    type: "message",
    ...text && { text },
    ...files && files.length > 0 && {
      files: files.map((file) => ({
        url: URL.createObjectURL(file),
        fileName: file.name,
        mimeType: file.type || void 0
      }))
    }
  };
  const newEvent = {
    id: Date.now(),
    status: "sent",
    sender: CURRENT_USER,
    timestamp: Date.now(),
    content
  };
  return new Promise((resolve) => {
    setTimeout(() => {
      EVENTS.unshift(newEvent);
      resolve(newEvent);
    }, 1e3);
  });
};
const deleteEvent = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = EVENTS.findIndex((e) => e.id === id);
      if (index !== -1) {
        EVENTS.splice(index, 1);
        resolve(id);
      } else {
        reject(new Error("Event not found"));
      }
    }, 500);
  });
};
const updateEvent = (id, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const event = EVENTS.find((e) => e.id === id);
      if (!event) {
        reject(new Error("Event not found"));
        return;
      }
      const newFiles = (data.uploadFiles ?? []).map((file) => ({
        url: URL.createObjectURL(file),
        fileName: file.name,
        mimeType: file.type || void 0
      }));
      const allFiles = [...data.editedFiles ?? [], ...newFiles];
      event.content = {
        ...event.content,
        ...data.text !== void 0 && { text: data.text },
        ...allFiles.length > 0 ? { files: allFiles } : { files: void 0 }
      };
      event.isEdited = true;
      resolve({ ...event });
    }, 500);
  });
};
const blockUser = (userId) => {
  console.log(`Blocking user with ID: ${userId}`);
  return new Promise((resolve) => setTimeout(resolve, 200));
};
const unblockUser = (userId) => {
  console.log(`Unblocking user with ID: ${userId}`);
  return new Promise((resolve) => setTimeout(resolve, 200));
};
const reactToEvent = (eventId, emoji) => {
  const event = EVENTS.find((e) => e.id === eventId);
  if (!event) return Promise.reject(new Error("Event not found"));
  if (event.reactions?.includes(emoji)) {
    event.reactions = event.reactions.filter((r) => r !== emoji);
  } else {
    event.reactions = [emoji];
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve(event), 200);
  });
};
const mockAPI = {
  blockUser,
  unblockUser,
  reactToEvent,
  searchEvents,
  deleteEvent,
  updateEvent,
  getEvents,
  postEvent
};
export {
  deleteEvent,
  getEvents,
  mockAPI,
  postEvent,
  searchEvents,
  updateEvent
};
