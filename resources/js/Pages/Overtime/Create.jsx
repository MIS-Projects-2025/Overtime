import { useState, useCallback } from "react";
import { useForm, router } from "@inertiajs/react";
import {
    Clock,
    Plus,
    Trash2,
    Users,
    User,
    AlertCircle,
    CheckCircle2,
    Building2,
    Search,
} from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Badge } from "@/Components/ui/badge";
import { Alert, AlertDescription } from "@/Components/ui/alert";
import { Combobox } from "@/Components/ui/combobox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/Components/ui/card";
import { Separator } from "@/Components/ui/separator";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

// ── helpers ──────────────────────────────────────────────────────────────────

function determineShift(timeFrom, shiftType) {
    if (shiftType === 1) return "N";
    const t = parseInt(timeFrom.replace(":", ""), 10);
    return t >= 700 && t < 1900 ? "A" : "C";
}

function fmtDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${m}/${d}/${y}`;
}

const SHIFT_LABEL = { N: "Normal", A: "Morning", C: "Night" };
const SHIFT_COLOR = {
    N: "bg-blue-100 text-primary",
    A: "bg-amber-100 text-amber-700",
    C: "bg-indigo-100 text-indigo-700",
};

// ── Add Employee Modal ────────────────────────────────────────────────────────

function AddEmployeeModal({ open, onClose, employees, onAdd, existingRows }) {
    const [mode, setMode] = useState("single");
    const [selected, setSelected] = useState([]);
    const [bulkSearch, setBulkSearch] = useState("");
    const [otDate, setOtDate] = useState("");
    const [timeFrom, setTimeFrom] = useState("");
    const [timeTo, setTimeTo] = useState("");
    const [reason, setReason] = useState("");
    const [errors, setErrors] = useState({});

    const today = new Date().toISOString().split("T")[0];

    const reset = () => {
        setMode("single");
        setSelected([]);
        setBulkSearch("");
        setOtDate("");
        setTimeFrom("");
        setTimeTo("");
        setReason("");
        setErrors({});
    };

    const validate = () => {
        const e = {};
        if (!selected.length) e.employee = "Select at least one employee.";
        if (!otDate) e.otDate = "OT date is required.";
        else if (otDate < today) e.otDate = "Late filing is not allowed.";
        if (!timeFrom) e.timeFrom = "Start time is required.";
        if (!timeTo) e.timeTo = "End time is required.";
        if (!reason.trim()) e.reason = "Reason is required.";
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleAdd = () => {
        if (!validate()) return;

        const rows = [];
        selected.forEach((empId) => {
            const emp = employees.find(
                (e) => String(e.emp_id) === String(empId),
            );
            if (!emp) return;

            const isDup = existingRows.some(
                (r) =>
                    String(r.emp_num) === String(empId) && r.ot_date === otDate,
            );
            if (isDup) return;

            rows.push({
                emp_num: String(emp.emp_id),
                emp_name: emp.emp_name,
                work_shift: determineShift(timeFrom, emp.shift_type),
                ot_date: otDate,
                ot_time_from: timeFrom,
                ot_time_to: timeTo,
                ot_reason: reason,
            });
        });

        if (rows.length) onAdd(rows);
        reset();
        onClose();
    };

    const toggleSelect = (id) => {
        const sid = String(id);
        setSelected((prev) =>
            prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
        );
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const filteredEmployees = employees.filter((e) =>
        `${e.emp_id} ${e.emp_name}`
            .toLowerCase()
            .includes(bulkSearch.toLowerCase()),
    );

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) handleClose();
            }}
        >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Add Employees for Overtime
                    </DialogTitle>
                </DialogHeader>

                {/* Mode toggle */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                    {["single", "bulk"].map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => {
                                setMode(m);
                                setSelected([]);
                                setBulkSearch("");
                            }}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                                mode === m
                                    ? "bg-white shadow text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {m === "single" ? (
                                <User className="h-4 w-4" />
                            ) : (
                                <Users className="h-4 w-4" />
                            )}
                            {m === "single"
                                ? "Single Employee"
                                : "Multiple Employees"}
                        </button>
                    ))}
                </div>

                <div className="space-y-5">
                    {/* Employee selection */}
                    <div className="space-y-2">
                        <Label className="text-primary font-semibold text-sm">
                            {mode === "single" ? "Employee" : "Employees"}
                        </Label>

                        {mode === "single" ? (
                            <Combobox
                                options={employees.map((e) => ({
                                    value: String(e.emp_id),
                                    label: `${e.emp_id} – ${e.emp_name}`,
                                }))}
                                value={selected[0] ?? ""}
                                onChange={(v) => setSelected(v ? [v] : [])}
                                placeholder="-- Select Employee --"
                                clearable={false}
                                allowCustomValue={false}
                                className={
                                    errors.employee ? "border-red-500" : ""
                                }
                            />
                        ) : (
                            <div
                                className={`border rounded-md ${errors.employee ? "border-red-500" : ""}`}
                            >
                                {/* Search input */}
                                <div className="p-2 border-b">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search employees..."
                                            value={bulkSearch}
                                            onChange={(e) =>
                                                setBulkSearch(e.target.value)
                                            }
                                            className="w-full text-sm pl-8 pr-3 py-1.5 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                </div>

                                {/* Employee list */}
                                <div className="p-2 max-h-44 overflow-y-auto space-y-0.5">
                                    {filteredEmployees.length > 0 ? (
                                        filteredEmployees.map((e) => {
                                            const sid = String(e.emp_id);
                                            const checked =
                                                selected.includes(sid);
                                            return (
                                                <div
                                                    key={e.emp_id}
                                                    onClick={() =>
                                                        toggleSelect(e.emp_id)
                                                    }
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer text-sm transition-colors select-none ${
                                                        checked
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "hover:bg-muted"
                                                    }`}
                                                >
                                                    <div
                                                        className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${
                                                            checked
                                                                ? "bg-primary border-blue-600"
                                                                : "border-gray-300"
                                                        }`}
                                                    >
                                                        {checked && (
                                                            <CheckCircle2 className="h-3 w-3 text-white" />
                                                        )}
                                                    </div>
                                                    <span>
                                                        {e.emp_id} –{" "}
                                                        {e.emp_name}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-center text-xs text-muted-foreground py-4">
                                            No employees found.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {errors.employee && (
                            <p className="text-xs text-red-500">
                                {errors.employee}
                            </p>
                        )}

                        {mode === "bulk" && selected.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {selected.map((id) => {
                                    const emp = employees.find(
                                        (e) => String(e.emp_id) === id,
                                    );
                                    return (
                                        <Badge
                                            key={id}
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {emp?.emp_name ?? id}
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Schedule */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-primary font-semibold text-sm">
                                OT Date
                            </Label>
                            <Input
                                type="date"
                                min={today}
                                value={otDate}
                                onChange={(e) => setOtDate(e.target.value)}
                                className={
                                    errors.otDate ? "border-red-500" : ""
                                }
                            />
                            {errors.otDate && (
                                <p className="text-xs text-red-500">
                                    {errors.otDate}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-primary font-semibold text-sm">
                                Start Time
                            </Label>
                            <Input
                                type="time"
                                value={timeFrom}
                                onChange={(e) => setTimeFrom(e.target.value)}
                                className={
                                    errors.timeFrom ? "border-red-500" : ""
                                }
                            />
                            {errors.timeFrom && (
                                <p className="text-xs text-red-500">
                                    {errors.timeFrom}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label className="text-primary font-semibold text-sm">
                                End Time
                            </Label>
                            <Input
                                type="time"
                                value={timeTo}
                                onChange={(e) => setTimeTo(e.target.value)}
                                className={
                                    errors.timeTo ? "border-red-500" : ""
                                }
                            />
                            {errors.timeTo && (
                                <p className="text-xs text-red-500">
                                    {errors.timeTo}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1">
                        <Label className="text-primary font-semibold text-sm">
                            Reason for Overtime
                        </Label>
                        <Textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please provide a detailed reason for the overtime request..."
                            className={errors.reason ? "border-red-500" : ""}
                        />
                        {errors.reason && (
                            <p className="text-xs text-red-500">
                                {errors.reason}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleAdd}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {mode === "bulk" ? "Add All Selected" : "Add to List"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OvertimeCreate({
    empData,
    employees = [],
    cutoffPeriods = [],
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const [otRows, setOtRows] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        department: empData.emp_dept ?? "",
        productline: empData.emp_prodline ?? "",
        requestor_id: String(empData.emp_id ?? ""),
        date_from: "",
        date_to: "",
        employees: [],
    });

    const handleCutoffChange = (startDate) => {
        const period = cutoffPeriods.find((p) => p.date_start === startDate);
        setData((d) => ({
            ...d,
            date_from: startDate,
            date_to: period?.date_end ?? "",
        }));
    };

    const addRows = useCallback((rows) => {
        setOtRows((prev) => {
            const merged = [...prev, ...rows];
            setData("employees", merged);
            return merged;
        });
    }, []);

    const removeRow = (idx) => {
        setOtRows((prev) => {
            const next = prev.filter((_, i) => i !== idx);
            setData("employees", next);
            return next;
        });
    };

    const submit = (e) => {
        e.preventDefault();
        if (!otRows.length) return;
        post(route("overtime.store"));
    };

    const cutoffReady = !!data.date_from;

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen p-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg">
                            <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">
                                Create Overtime Request
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Fill in the details and add employees below
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Request Info */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    Request Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-primary font-semibold text-xs">
                                        Department
                                    </Label>
                                    <Input value={data.department} readOnly />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-primary font-semibold text-xs">
                                        Product Line
                                    </Label>
                                    <Input value={data.productline} readOnly />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-primary font-semibold text-xs">
                                        Payroll Cut-off: Start
                                    </Label>
                                    <Combobox
                                        options={cutoffPeriods.map((p) => ({
                                            value: p.date_start,
                                            label: `${p.date_start} – ${p.date_end}`,
                                        }))}
                                        value={data.date_from}
                                        onChange={handleCutoffChange}
                                        placeholder="-- Select Cut-off Period --"
                                        clearable={false}
                                        allowCustomValue={false}
                                        className={
                                            errors.date_from
                                                ? "border-red-500"
                                                : ""
                                        }
                                    />
                                    {errors.date_from && (
                                        <p className="text-xs text-red-500">
                                            {errors.date_from}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-primary font-semibold text-xs">
                                        Payroll Cut-off: End
                                    </Label>
                                    <Input value={data.date_to} readOnly />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employees */}
                        <Card>
                            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="h-4 w-4 text-primary" />
                                        Overtime Employees
                                    </CardTitle>
                                    <CardDescription className="text-xs mt-0.5">
                                        {otRows.length > 0
                                            ? `${otRows.length} employee${otRows.length > 1 ? "s" : ""} added`
                                            : "No employees added yet"}
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={!cutoffReady}
                                    onClick={() => setModalOpen(true)}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add
                                    Employee
                                </Button>
                            </CardHeader>

                            <CardContent className="pt-0 space-y-3">
                                {!cutoffReady && (
                                    <Alert className="border-primary/30 bg-primary/10">
                                        <AlertCircle className="h-4 w-4 text-primary" />
                                        <AlertDescription className="text-primary text-sm">
                                            Please select a Payroll Cut-off
                                            Start date before adding employees.
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {otRows.length > 0 && (
                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-gray-800 hover:bg-gray-800">
                                                    {[
                                                        "EMP. NO.",
                                                        "EMP. NAME",
                                                        "SHIFT",
                                                        "DATE",
                                                        "OT TIME",
                                                        "REASON",
                                                        "",
                                                    ].map((h) => (
                                                        <TableHead
                                                            key={h}
                                                            className="text-white text-xs font-semibold py-2"
                                                        >
                                                            {h}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {otRows.map((row, idx) => (
                                                    <TableRow
                                                        key={idx}
                                                        className="text-sm"
                                                    >
                                                        <TableCell className="font-mono text-xs">
                                                            {row.emp_num}
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {row.emp_name}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SHIFT_COLOR[row.work_shift]}`}
                                                            >
                                                                {row.work_shift}{" "}
                                                                –{" "}
                                                                {
                                                                    SHIFT_LABEL[
                                                                        row
                                                                            .work_shift
                                                                    ]
                                                                }
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-xs">
                                                            {fmtDate(
                                                                row.ot_date,
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs whitespace-nowrap">
                                                            {row.ot_time_from} –{" "}
                                                            {row.ot_time_to}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                                            {row.ot_reason}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    removeRow(
                                                                        idx,
                                                                    )
                                                                }
                                                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Reminder */}
                        <Alert className="border-amber-200 bg-amber-50">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-700 text-sm">
                                <strong>Reminder!</strong> Please ensure all
                                entries are correct before submitting.
                            </AlertDescription>
                        </Alert>

                        {errors.employees && (
                            <Alert className="border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700 text-sm">
                                    {errors.employees}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Actions */}
                        <div className="flex justify-center gap-3">
                            <Button
                                type="submit"
                                disabled={
                                    processing || !otRows.length || !cutoffReady
                                }
                                className="px-8 bg-primary hover:bg-primary/90"
                            >
                                {processing ? "Saving..." : "Save Request"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.visit(route("overtime.index"))
                                }
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>

                <AddEmployeeModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    employees={employees}
                    onAdd={addRows}
                    existingRows={otRows}
                />
            </div>
        </AuthenticatedLayout>
    );
}
