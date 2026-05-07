import { useState, useMemo } from "react";
import { Download } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Combobox } from "@/Components/ui/combobox";

const STATUS_OPTIONS = [
    { value: "all", label: "All Statuses" },
    { value: "0", label: "Pending" },
    { value: "1", label: "Partially Approved" },
    { value: "2", label: "Approved" },
    { value: "3", label: "Disapproved" },
    { value: "4", label: "Cancelled" },
];

function fmtPeriod(date_start, date_end) {
    if (!date_start && !date_end) return "—";
    const fmt = (d) => {
        if (!d) return "";
        const dt = new Date(d);
        return dt.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };
    return `${fmt(date_start)} – ${fmt(date_end)}`;
}

/**
 * Props:
 *   open          — boolean
 *   onClose       — () => void
 *   cutoffPeriods — [{ id, date_start, date_end }]
 */
export function ExportDialog({ open, onClose, cutoffPeriods = [] }) {
    const [status, setStatus] = useState("all");
    const [cutoffId, setCutoffId] = useState(null);

    const cutoffOptions = useMemo(
        () =>
            cutoffPeriods.map((p) => ({
                value: String(p.id),
                label: fmtPeriod(p.date_start, p.date_end),
            })),
        [cutoffPeriods],
    );

    const handleExport = () => {
        const params = new URLSearchParams();

        if (status && status !== "all") {
            params.set("status", status);
        }

        if (cutoffId) {
            const period = cutoffPeriods.find((p) => String(p.id) === cutoffId);
            if (period?.date_start) params.set("date_start", period.date_start);
            if (period?.date_end) params.set("date_end", period.date_end);
        }

        const url =
            route("overtime.export") + (params.toString() ? `?${params}` : "");
        window.location.href = url;
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Overtime Requests</DialogTitle>
                    <DialogDescription>
                        Filter the records to export. Leave filters on "All" to
                        download the full dataset.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Status filter */}
                    <div className="space-y-1.5">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem
                                        key={opt.value}
                                        value={opt.value}
                                    >
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cutoff period filter */}
                    <div className="space-y-1.5">
                        <Label>Payroll Cutoff Period</Label>
                        <Combobox
                            options={cutoffOptions}
                            value={cutoffId}
                            onChange={setCutoffId}
                            placeholder="All periods"
                            clearable
                            allowCustomValue={false}
                            modal
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport}>
                        <Download className="h-4 w-4 mr-1.5" />
                        Export CSV
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
