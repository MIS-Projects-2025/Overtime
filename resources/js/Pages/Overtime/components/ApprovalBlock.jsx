import { User } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import { fmtDateTime } from "@/helpers/date";

function approvalLabel(status) {
    if (status === 1) return "APPROVED BY";
    if (status === 2) return "DISAPPROVED BY";
    return "APPROVER";
}

export function ApprovalBlock({ approval }) {
    const label    = approvalLabel(approval.status);
    const roleName = approval.role?.role_name ?? "Approver";
    const isPending = approval.status === 0;

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                {label}&nbsp;&mdash;&nbsp;
                <span className="italic font-normal">{roleName}</span>
            </p>

            {isPending ? (
                <Badge variant="outline" className="text-xs bg-yellow-100/60 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700">
                    Pending
                </Badge>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold leading-tight">
                            {approval.approver_name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {fmtDateTime(approval.signed_at)}
                        </p>
                    </div>
                </div>
            )}

            {!isPending && approval.remarks && (
                <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">
                        Remarks
                    </p>
                    <p className="text-sm text-muted-foreground">{approval.remarks}</p>
                </div>
            )}
        </div>
    );
}
