import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";

/**
 * Reusable remarks dialog for approve / disapprove actions.
 *
 * Props:
 *   open        — boolean
 *   onClose     — () => void
 *   onConfirm   — (remarks: string) => void
 *   action      — 'approve' | 'disapprove'
 *   title       — string
 *   description — string (optional)
 *   processing  — boolean
 */
export function RemarksDialog({
    open,
    onClose,
    onConfirm,
    action = "approve",
    title,
    description,
    processing = false,
}) {
    const [remarks, setRemarks] = useState("");
    const [error, setError] = useState("");

    // Reset state each time the dialog opens
    useEffect(() => {
        if (open) {
            setRemarks("");
            setError("");
        }
    }, [open]);

    const handleConfirm = () => {
        if (!remarks.trim()) {
            setError("Remarks are required.");
            return;
        }
        onConfirm(remarks.trim());
    };

    const isApprove = action === "approve";

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>

                <div className="space-y-1.5">
                    <Label htmlFor="remarks-input">
                        Remarks{" "}
                        <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id="remarks-input"
                        value={remarks}
                        onChange={(e) => {
                            setRemarks(e.target.value);
                            setError("");
                        }}
                        placeholder="Enter your remarks…"
                        rows={3}
                        disabled={processing}
                    />
                    {error && (
                        <p className="text-xs text-destructive">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={isApprove ? "default" : "destructive"}
                        className={isApprove ? "bg-green-600 hover:bg-green-700" : ""}
                        onClick={handleConfirm}
                        disabled={processing}
                    >
                        {processing
                            ? "Processing…"
                            : isApprove
                              ? "Approve"
                              : "Disapprove"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
