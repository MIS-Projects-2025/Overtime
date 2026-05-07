import { useState, useEffect, useCallback } from "react";
import { router, usePage } from "@inertiajs/react";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";
import axios from "axios";

import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent } from "@/Components/ui/card";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Combobox } from "@/Components/ui/combobox";
import { Pagination } from "@/Components/Pagination";

const ACCESS_LEVEL_MAP = {
    1: { label: "Operator", cls: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    2: { label: "Admin",    cls: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" },
};

const ACCOUNT_STATUS_MAP = {
    1: { label: "Active",   cls: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
    2: { label: "Inactive", cls: "bg-muted text-muted-foreground" },
};

// ── Operator dialog (create / edit) ───────────────────────────────────────────

function OperatorDialog({ open, onClose, operator = null }) {
    const { errors } = usePage().props;

    const isEdit = operator !== null;

    const [empNum,        setEmpNum]        = useState("");
    const [empName,       setEmpName]       = useState("");
    const [accessLevel,   setAccessLevel]   = useState("1");
    const [accountStatus, setAccountStatus] = useState("1");
    const [processing,    setProcessing]    = useState(false);

    useEffect(() => {
        if (open) {
            setEmpNum(operator?.ot_emp_num  ?? "");
            setEmpName(operator?.ot_emp_name ?? "");
            setAccessLevel(String(operator?.ot_access_level   ?? 1));
            setAccountStatus(String(operator?.ot_account_status ?? 1));
            setProcessing(false);
        }
    }, [open, operator]);

    // Seed options when editing so the trigger label shows before the dropdown is opened
    // Use the same "empNum - empName" format for consistency with loaded options
    const seedOptions = isEdit && empNum
        ? [{ value: empNum, label: `${empNum} - ${empName}` }]
        : [];

    // Cache emp_num → plain emp_name (strips the "empNum - " prefix from the label)
    const [optionsCache, setOptionsCache] = useState({});

    const loadOptionsTracked = useCallback(async (search, page) => {
        const res = await axios.get(route("overtime.operators.employees.search"), {
            params: { search, page },
        });
        const result = res.data; // { options: [{value, label}], hasMore }
        setOptionsCache((prev) => {
            const next = { ...prev };
            result.options.forEach((o) => {
                // label is "empNum - empName"; store just the name part
                const prefix = `${o.value} - `;
                next[o.value] = o.label.startsWith(prefix)
                    ? o.label.slice(prefix.length)
                    : o.label;
            });
            return next;
        });
        return result;
    }, []);

    const handleEmpSelect = (value) => {
        setEmpNum(value ?? "");
        if (value && optionsCache[value]) {
            setEmpName(optionsCache[value]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!empNum) return;

        setProcessing(true);

        const payload = {
            emp_num:        empNum,
            emp_name:       empName || (optionsCache[empNum] ?? empNum),
            access_level:   parseInt(accessLevel,   10),
            account_status: parseInt(accountStatus, 10),
        };

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => onClose(),
        };

        if (isEdit) {
            router.put(route("overtime.operators.update", operator.id), payload, options);
        } else {
            router.post(route("overtime.operators.store"), payload, options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Operator" : "Add Operator"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update the operator's details."
                            : "Select an employee to grant OT operator access."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Employee */}
                        <div className="space-y-1.5">
                            <Label>
                                Employee <span className="text-destructive">*</span>
                            </Label>
                            <Combobox
                                options={seedOptions}
                                value={empNum || undefined}
                                onChange={handleEmpSelect}
                                loadOptions={loadOptionsTracked}
                                placeholder="Search employee…"
                                allowCustomValue={false}
                                clearable={false}
                                modal
                            />
                            {errors?.emp_num && (
                                <p className="text-xs text-destructive">{errors.emp_num}</p>
                            )}
                        </div>

                        {/* Access Level */}
                        <div className="space-y-1.5">
                            <Label>Access Level</Label>
                            <Select value={accessLevel} onValueChange={setAccessLevel}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Operator</SelectItem>
                                    <SelectItem value="2">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Account Status */}
                        <div className="space-y-1.5">
                            <Label>Account Status</Label>
                            <Select value={accountStatus} onValueChange={setAccountStatus}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Active</SelectItem>
                                    <SelectItem value="2">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || !empNum}>
                            {processing ? "Saving…" : isEdit ? "Save Changes" : "Add Operator"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OperatorsIndex({ operators = [], meta, filters = {} }) {
    const [search,       setSearch]       = useState(filters.search ?? "");
    const [searchTimer,  setSearchTimer]  = useState(null);
    const [dialogOpen,   setDialogOpen]   = useState(false);
    const [editTarget,   setEditTarget]   = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const handleSearch = (value) => {
        setSearch(value);
        if (searchTimer) clearTimeout(searchTimer);
        setSearchTimer(
            setTimeout(() => {
                router.get(
                    route("overtime.operators.index"),
                    { ...filters, search: value, page: 1 },
                    { preserveState: true, preserveScroll: true },
                );
            }, 400),
        );
    };

    const openCreate = () => {
        setEditTarget(null);
        setDialogOpen(true);
    };

    const openEdit = (operator) => {
        setEditTarget(operator);
        setDialogOpen(true);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(route("overtime.operators.destroy", deleteTarget.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen p-6">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-lg">
                                <Users className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">OT Operators</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage who has operator access to overtime records.
                                </p>
                            </div>
                        </div>
                        <Button onClick={openCreate}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Operator
                        </Button>
                    </div>

                    {/* Table */}
                    <Card>
                        <div className="px-4 pt-3 pb-2 border-b border-border">
                            <div className="relative w-full max-w-xs">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search by name or emp no…"
                                    className="h-8 pl-8 text-sm"
                                />
                            </div>
                        </div>

                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/50">
                                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Emp No.</th>
                                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Name</th>
                                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Access Level</th>
                                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Status</th>
                                            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Date Added</th>
                                            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {operators.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                    No operators found.
                                                </td>
                                            </tr>
                                        ) : (
                                            operators.map((op) => {
                                                const al = ACCESS_LEVEL_MAP[op.ot_access_level]   ?? { label: op.ot_access_level,   cls: "" };
                                                const st = ACCOUNT_STATUS_MAP[op.ot_account_status] ?? { label: op.ot_account_status, cls: "" };
                                                const dateAdded = op.date_created
                                                    ? new Date(op.date_created).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                                                    : "—";

                                                return (
                                                    <tr key={op.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">
                                                            {op.ot_emp_num}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium">
                                                            {op.ot_emp_name}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className={`text-xs font-semibold ${al.cls}`}>
                                                                {al.label}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className={`text-xs font-semibold ${st.cls}`}>
                                                                {st.label}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                                            {dateAdded}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0"
                                                                    onClick={() => openEdit(op)}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => setDeleteTarget(op)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="px-4">
                                <Pagination
                                    meta={meta}
                                    onPageChange={(page) =>
                                        router.get(
                                            route("overtime.operators.index"),
                                            { ...filters, page },
                                            { preserveState: true, preserveScroll: true },
                                        )
                                    }
                                    perPage={filters.per_page ?? "10"}
                                    onPerPageChange={(v) =>
                                        router.get(
                                            route("overtime.operators.index"),
                                            { ...filters, per_page: v, page: 1 },
                                            { preserveState: true, preserveScroll: true },
                                        )
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Create / Edit dialog */}
            <OperatorDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                operator={editTarget}
            />

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Remove Operator</DialogTitle>
                        <DialogDescription>
                            Remove <strong>{deleteTarget?.ot_emp_name}</strong> as an OT operator?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
