import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { PencilIcon, Trash2Icon } from "lucide-react";
function MessageActionsDropdown({
  children,
  onDelete,
  onEdit
}) {
  const hasAdditionalActions = !!onEdit || !!onDelete;
  if (!hasAdditionalActions) return null;
  return <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
        {onEdit && <DropdownMenuItem onSelect={onEdit}>
            <PencilIcon className="size-3.5" />
            Edit
          </DropdownMenuItem>}
        {onDelete && <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2Icon className="size-3.5" />
            Delete
          </DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>;
}
export {
  MessageActionsDropdown
};
