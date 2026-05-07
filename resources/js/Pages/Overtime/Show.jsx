import { useState } from "react";
import { router } from "@inertiajs/react";
import { ArrowLeft, Hash, User } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Separator } from "@/Components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

import { fmtDate, fmtDateTime } from "@/helpers/date";
import { SHIFT_LABEL } from "./constants";
import { StatusBadge } from "./components/StatusBadge";
import { ApprovalBlock } from "./components/ApprovalBlock";
import { ConfirmCancelDialog } from "./components/ConfirmCancelDialog";
import { RemarksDialog } from "./components/RemarksDialog";
import { Badge } from "@/Components/ui/badge";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OvertimeShow({
    otRequest,
    items = [],
    approvals = [],
    requestorName,
    empData,
    canApprove = false,
    myApprovalId = null,
    isRequestor = false,
}) {
    const [cancelOpen, setCancelOpen] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [disapproveOpen, setDisapproveOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const isPending = otRequest.ot_status === 0;
    const canCancel = isRequestor && isPending;

    const submitAction = (action, remarks) => {
        setProcessing(true);
        router.post(
            route(`overtime.${action}`, otRequest.ot_form_no),
            { remarks },
            {
                onFinish: () => {
                    setProcessing(false);
                    setApproveOpen(false);
                    setDisapproveOpen(false);
                },
            },
        );
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen p-6">
                <div className="max-w-5xl mx-auto space-y-5">
                    {/* Back button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit(route("overtime.index"))}
                        className="text-muted-foreground hover:text-foreground -ml-1"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to List
                    </Button>

                    <Card>
                        {/* Header */}
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                Overtime Request Details:
                                <Badge className="font-mono flex items-center gap-1 px-2 py-1">
                                    <Hash className="w-3.5 h-3.5 opacity-70" />
                                    {otRequest.ot_form_no}
                                </Badge>
                            </CardTitle>
                            <StatusBadge status={otRequest.ot_status} />
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {/* Prepared by */}
                            <div>
                                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                                    PREPARED by{" "}
                                    <span className="italic font-normal">
                                        Immediate Supervisor
                                    </span>
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold leading-tight">
                                            {requestorName ??
                                                `Emp #${otRequest.requestor_id}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {fmtDateTime(
                                                otRequest.date_created,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Department / Product Line / Cut-off */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                                        Department
                                    </p>
                                    <p className="text-sm">
                                        {otRequest.department}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                                        Product Line
                                    </p>
                                    <p className="text-sm">
                                        {otRequest.productline}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                                        Payroll Cut-off Period
                                    </p>
                                    <p className="text-sm">
                                        {fmtDate(otRequest.date_from)} &mdash;{" "}
                                        {fmtDate(otRequest.date_to)}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Employees table */}
                            <div>
                                <p className="text-xs text-center text-muted-foreground mb-3">
                                    The following employees have expressed their
                                    request and willingness to render overtime
                                    work on the date and time as specified
                                    below.
                                </p>

                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted hover:bg-muted">
                                                {[
                                                    "EMP. NO.",
                                                    "EMP. NAME",
                                                    "WORK SHIFT",
                                                    "DATE REQUESTED",
                                                    "OT TIME",
                                                    "REASON",
                                                ].map((h) => (
                                                    <TableHead
                                                        key={h}
                                                        className="text-foreground text-xs font-semibold py-2 text-center"
                                                    >
                                                        {h}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={6}
                                                        className="text-center py-8 text-muted-foreground text-sm"
                                                    >
                                                        No employees on this
                                                        request.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                items.map((row, idx) => (
                                                    <TableRow
                                                        key={idx}
                                                        className="text-sm text-center"
                                                    >
                                                        <TableCell className="font-mono text-xs">
                                                            {row.emp_num}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {row.emp_name ??
                                                                "—"}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {row.work_shift} –{" "}
                                                            {SHIFT_LABEL[
                                                                row.work_shift
                                                            ] ?? row.work_shift}
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap">
                                                            {fmtDate(
                                                                row.ot_date_from,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap">
                                                            {row.ot_time_from} –{" "}
                                                            {row.ot_time_to}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-left text-muted-foreground">
                                                            {row.ot_reason}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <Separator />

                            {/* Approvals */}
                            <div
                                className={`grid gap-6 ${
                                    approvals.length > 1
                                        ? "grid-cols-2"
                                        : "grid-cols-1"
                                }`}
                            >
                                {approvals.map((approval) => (
                                    <ApprovalBlock
                                        key={approval.id}
                                        approval={approval}
                                    />
                                ))}
                            </div>

                            {/* Action buttons */}
                            {(canApprove || canCancel) && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-end gap-3">
                                        {canCancel && (
                                            <Button
                                                variant="outline"
                                                className="border-destructive text-destructive hover:bg-destructive/5"
                                                onClick={() =>
                                                    setCancelOpen(true)
                                                }
                                            >
                                                Cancel Request
                                            </Button>
                                        )}
                                        {canApprove && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                                    onClick={() =>
                                                        setDisapproveOpen(true)
                                                    }
                                                    disabled={processing}
                                                >
                                                    Disapprove
                                                </Button>
                                                <Button
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() =>
                                                        setApproveOpen(true)
                                                    }
                                                    disabled={processing}
                                                >
                                                    Approve
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            <Separator />

                            {/* Work shift legend */}
                            <p className="text-xs text-center text-muted-foreground">
                                Work Shift Legend:&nbsp;
                                <strong>A</strong> – Morning Shift (7:00AM –
                                7:00PM)&nbsp;&nbsp;
                                <strong>C</strong> – Night Shift (7:00PM –
                                7:00AM)&nbsp;&nbsp;
                                <strong>N</strong> – Normal Shift (7:00AM –
                                4:00PM)
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialogs */}
            <ConfirmCancelDialog
                formNo={otRequest.ot_form_no}
                open={cancelOpen}
                onClose={() => setCancelOpen(false)}
            />

            <RemarksDialog
                open={approveOpen}
                onClose={() => setApproveOpen(false)}
                onConfirm={(remarks) => submitAction("approve", remarks)}
                action="approve"
                title="Approve Overtime Request"
                description={`You are about to approve ${otRequest.ot_form_no}. Please provide your remarks.`}
                processing={processing}
            />

            <RemarksDialog
                open={disapproveOpen}
                onClose={() => setDisapproveOpen(false)}
                onConfirm={(remarks) => submitAction("disapprove", remarks)}
                action="disapprove"
                title="Disapprove Overtime Request"
                description={`You are about to disapprove ${otRequest.ot_form_no}. Please provide your remarks.`}
                processing={processing}
            />
        </AuthenticatedLayout>
    );
}
