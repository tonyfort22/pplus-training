import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
function BlockDialog({
  open,
  onOpenChange,
  onConfirm
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block user</DialogTitle>
          <DialogDescription>
            Are you sure you want to block this user? They will no longer be
            able to send you messages.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={onConfirm}>
            Block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
export {
  BlockDialog
};
