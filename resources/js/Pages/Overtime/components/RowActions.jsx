import { useState } from "react";
import { router } from "@inertiajs/react";
import { Eye, X } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { ConfirmCancelDialog } from "./ConfirmCancelDialog";

export function RowActions({ row, empData }) {
    const [cancelOpen, setCancelOpen] = useState(false);

    const isRequestor = empData && row.requestor_id === empData.emp_id;
    const canCancel   = isRequestor && row.ot_status === 0;

    return (
        <>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-primary hover:bg-primary/10"
                    title="View"
                    onClick={() =>
                        router.visit(route("overtime.show", row.ot_form_no))
                    }
                >
                    <Eye className="h-3.5 w-3.5" />
                </Button>

                {canCancel && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        title="Cancel request"
                        onClick={() => setCancelOpen(true)}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

            <ConfirmCancelDialog
                formNo={row.ot_form_no}
                open={cancelOpen}
                onClose={() => setCancelOpen(false)}
            />
        </>
    );
}
