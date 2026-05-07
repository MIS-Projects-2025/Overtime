import { useState } from "react";
import { router } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";

export function ConfirmCancelDialog({ formNo, open, onClose }) {
    const [processing, setProcessing] = useState(false);

    const handleConfirm = () => {
        setProcessing(true);
        router.patch(
            route("overtime.cancel", formNo),
            {},
            {
                onFinish: () => {
                    setProcessing(false);
                    onClose();
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Cancel Overtime Request</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to cancel{" "}
                        <strong className="text-foreground">{formNo}</strong>?
                        The request will be marked as cancelled and can no longer
                        be processed.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={processing}>
                            Keep
                        </Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={processing}
                    >
                        {processing ? "Cancelling…" : "Yes, Cancel It"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
