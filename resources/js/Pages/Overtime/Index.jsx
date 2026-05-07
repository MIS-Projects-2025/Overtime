import { useState, useMemo } from "react";
import { router } from "@inertiajs/react";
import { Clock, Plus, CheckSquare, Search, Download } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import ServerTable from "@/Components/ServerTable";
import { Pagination } from "@/Components/Pagination";

import { fmtDate } from "@/helpers/date";
import { useOvertimeIndex } from "./hooks/useOvertimeIndex";
import { StatusBadge } from "./components/StatusBadge";
import { RowActions } from "./components/RowActions";
import { RemarksDialog } from "./components/RemarksDialog";
import { ExportDialog } from "./components/ExportDialog";

// ── Shared column helpers ─────────────────────────────────────────────────────

function periodCell(row) {
    return `${fmtDate(row.date_from)} → ${fmtDate(row.date_to)}`;
}

function empCountCell(row) {
    return (
        <Badge variant="outline" className="text-xs">
            {row.items?.length ?? 0}
        </Badge>
    );
}

// ── Column sets ───────────────────────────────────────────────────────────────

function myColumns(empData) {
    return [
        { key: "ot_form_no",  label: "Form No.",      sortable: true, className: "font-mono text-xs font-semibold text-blue-700" },
        { key: "department",  label: "Department",     sortable: true, className: "text-xs" },
        { key: "productline", label: "Product Line",   sortable: true, className: "text-xs" },
        { key: "date_from",   label: "Cut-off Period", sortable: true, className: "text-xs text-muted-foreground whitespace-nowrap", render: periodCell },
        { key: "items",       label: "Employees",      className: "text-center", render: empCountCell },
        { key: "ot_status",   label: "Status",         sortable: true, render: (row) => <StatusBadge status={row.ot_status} /> },
        { key: "actions",     label: "Actions",        render: (row) => <RowActions row={row} empData={empData} /> },
    ];
}

function approvalColumns(selected, onToggle, onToggleAll, rows, withCheckbox = true) {
    const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.ot_form_no));

    const checkCol = {
        key: "_check",
        label: (
            <input
                type="checkbox"
                checked={allChecked}
                onChange={() => onToggleAll(rows)}
                className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
            />
        ),
        className: "w-8 text-center",
        headerClassName: "w-8 text-center",
        render: (row) => (
            <input
                type="checkbox"
                checked={selected.has(row.ot_form_no)}
                onChange={() => onToggle(row.ot_form_no)}
                className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
            />
        ),
    };

    const base = [
        { key: "ot_form_no",  label: "Form No.",      className: "font-mono text-xs font-semibold text-blue-700" },
        { key: "department",  label: "Department",     className: "text-xs" },
        { key: "productline", label: "Product Line",   className: "text-xs" },
        { key: "date_from",   label: "Cut-off Period", className: "text-xs text-muted-foreground whitespace-nowrap", render: periodCell },
        { key: "items",       label: "Employees",      className: "text-center", render: empCountCell },
        { key: "ot_status",   label: "Status",         render: (row) => <StatusBadge status={row.ot_status} /> },
        {
            key: "actions",
            label: "Actions",
            render: (row) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-primary hover:bg-primary/10"
                    onClick={() => router.visit(route("overtime.show", row.ot_form_no))}
                >
                    View
                </Button>
            ),
        },
    ];

    return withCheckbox ? [checkCol, ...base] : base;
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }) {
    return (
        <div className="flex gap-1 border-b border-border">
            {tabs.map((t) => (
                <button
                    key={t.key}
                    onClick={() => onChange(t.key)}
                    className={[
                        "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                        active === t.key
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                >
                    {t.label}
                    {t.count != null && (
                        <Badge
                            variant={active === t.key ? "default" : "secondary"}
                            className="ml-1.5 px-1.5 py-0 text-xs rounded-full"
                        >
                            {t.count}
                        </Badge>
                    )}
                </button>
            ))}
        </div>
    );
}

// ── Simple search bar used per-tab ────────────────────────────────────────────

function TabSearch({ value, onChange, placeholder = "Search…" }) {
    return (
        <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="h-8 pl-8 text-sm"
            />
        </div>
    );
}

// ── Reusable table + pagination block ─────────────────────────────────────────

function TableSection({ columns, data, meta, orderBy, orderDir, onSort, onPageChange, onPerPageChange, perPage, emptyMessage, header }) {
    return (
        <Card>
            {header && (
                <div className="px-4 pt-3 pb-2 border-b border-border">
                    {header}
                </div>
            )}
            <CardContent className="p-0">
                <ServerTable
                    columns={columns}
                    data={data}
                    orderBy={orderBy}
                    orderDir={orderDir}
                    onSort={onSort}
                    emptyMessage={emptyMessage}
                />
                <div className="px-4">
                    <Pagination
                        meta={meta}
                        onPageChange={onPageChange}
                        perPage={perPage}
                        onPerPageChange={onPerPageChange}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OvertimeIndex({
    myPending        = [],
    myPendingMeta,
    myHistory        = [],
    myHistoryMeta,
    approvalPending  = [],
    approvalPendingMeta,
    approvalHistory  = [],
    approvalHistoryMeta,
    filters          = {},
    empData,
    isOperator       = false,
    cutoffPeriods    = [],
}) {
    const {
        orderBy, orderDir, applyParams, handleSort,
        search,   handleSearch,
        hSearch,  handleHSearch,
        apSearch, handleApSearch,
        ahSearch, handleAhSearch,
        selected, toggleSelect, toggleSelectAll, clearSelection,
    } = useOvertimeIndex(filters);

    const isPosition6    = empData?.emp_position_id === 6;
    const showApprovalTab = (empData?.emp_position_id ?? 0) >= 4;

    const tabs = useMemo(() => [
        ...(!isPosition6 ? [
            { key: "my-pending",       label: "My Requests",          count: myPendingMeta?.total },
            { key: "my-history",       label: "My Request History",   count: myHistoryMeta?.total },
        ] : []),
        ...(showApprovalTab ? [
            { key: "approval-pending", label: "For Approval",         count: approvalPendingMeta?.total },
            { key: "approval-history", label: "For Approval History", count: approvalHistoryMeta?.total },
        ] : []),
    ], [isPosition6, showApprovalTab, myPendingMeta, myHistoryMeta, approvalPendingMeta, approvalHistoryMeta]);

    const [activeTab, setActiveTab] = useState(
        isPosition6 ? "approval-pending" : "my-pending"
    );

    const [exportOpen, setExportOpen] = useState(false);

    // Bulk action dialog
    const [bulkDialog,     setBulkDialog]     = useState(null);
    const [bulkProcessing, setBulkProcessing] = useState(false);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        clearSelection();
    };

    const handleBulkAction = (remarks) => {
        setBulkProcessing(true);
        router.post(
            route("overtime.bulkAction"),
            { form_nos: Array.from(selected), action: bulkDialog, remarks },
            {
                onFinish: () => {
                    setBulkProcessing(false);
                    setBulkDialog(null);
                    clearSelection();
                },
            },
        );
    };

    const selectedCount = selected.size;

    const apCols  = approvalColumns(selected, toggleSelect, toggleSelectAll, approvalPending, true);
    const ahCols  = approvalColumns(selected, toggleSelect, toggleSelectAll, [], false);

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen p-6">
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-lg">
                                <Clock className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Overtime Requests
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {empData?.emp_name ?? ""}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isOperator && (
                                <Button
                                    variant="outline"
                                    onClick={() => setExportOpen(true)}
                                >
                                    <Download className="h-4 w-4 mr-1.5" />
                                    Export
                                </Button>
                            )}
                            {!isPosition6 && (
                                <Button
                                    onClick={() => router.visit(route("overtime.create"))}
                                    className="bg-primary hover:bg-primary/80"
                                >
                                    <Plus className="h-4 w-4 mr-1" /> New Request
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    {tabs.length > 1 && (
                        <TabBar tabs={tabs} active={activeTab} onChange={handleTabChange} />
                    )}

                    {/* ── My Requests (pending) ── */}
                    {activeTab === "my-pending" && (
                        <TableSection
                            columns={myColumns(empData)}
                            data={myPending}
                            meta={myPendingMeta}
                            orderBy={orderBy}
                            orderDir={orderDir}
                            onSort={handleSort}
                            onPageChange={(page) => applyParams({ page })}
                            onPerPageChange={(v) => applyParams({ per_page: v, page: 1 })}
                            perPage={filters.per_page ?? "10"}
                            emptyMessage="No pending overtime requests."
                            header={
                                <TabSearch
                                    value={search}
                                    onChange={handleSearch}
                                    placeholder="Search form no, dept, product line…"
                                />
                            }
                        />
                    )}

                    {/* ── My Request History ── */}
                    {activeTab === "my-history" && (
                        <TableSection
                            columns={myColumns(empData)}
                            data={myHistory}
                            meta={myHistoryMeta}
                            orderBy={orderBy}
                            orderDir={orderDir}
                            onSort={handleSort}
                            onPageChange={(page) => applyParams({ h_page: page })}
                            onPerPageChange={(v) => applyParams({ h_per_page: v, h_page: 1 })}
                            perPage={filters.h_per_page ?? "10"}
                            emptyMessage="No overtime request history."
                            header={
                                <TabSearch
                                    value={hSearch}
                                    onChange={handleHSearch}
                                    placeholder="Search form no, dept, product line…"
                                />
                            }
                        />
                    )}

                    {/* ── For Approval (pending) ── */}
                    {activeTab === "approval-pending" && (
                        <Card>
                            {/* Bulk action bar */}
                            {selectedCount > 0 ? (
                                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-primary/5">
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium text-primary">
                                        {selectedCount} selected
                                    </span>
                                    <div className="flex gap-2 ml-auto">
                                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => setBulkDialog("approve")}>
                                            Bulk Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => setBulkDialog("disapprove")}>
                                            Bulk Disapprove
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={clearSelection}>
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 pt-3 pb-2 border-b border-border">
                                    <TabSearch
                                        value={apSearch}
                                        onChange={handleApSearch}
                                        placeholder="Search form no, dept, product line…"
                                    />
                                </div>
                            )}
                            <CardContent className="p-0">
                                <ServerTable
                                    columns={apCols}
                                    data={approvalPending}
                                    orderBy=""
                                    orderDir="desc"
                                    onSort={() => {}}
                                    emptyMessage="No requests pending your approval."
                                />
                                <div className="px-4">
                                    <Pagination
                                        meta={approvalPendingMeta}
                                        onPageChange={(page) => applyParams({ ap_page: page })}
                                        perPage={filters.ap_per_page ?? "10"}
                                        onPerPageChange={(v) => applyParams({ ap_per_page: v, ap_page: 1 })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── For Approval History ── */}
                    {activeTab === "approval-history" && (
                        <TableSection
                            columns={ahCols}
                            data={approvalHistory}
                            meta={approvalHistoryMeta}
                            orderBy=""
                            orderDir="desc"
                            onSort={() => {}}
                            onPageChange={(page) => applyParams({ ah_page: page })}
                            onPerPageChange={(v) => applyParams({ ah_per_page: v, ah_page: 1 })}
                            perPage={filters.ah_per_page ?? "10"}
                            emptyMessage="No approval history found."
                            header={
                                <TabSearch
                                    value={ahSearch}
                                    onChange={handleAhSearch}
                                    placeholder="Search form no, dept, product line…"
                                />
                            }
                        />
                    )}

                </div>
            </div>

            {/* Export dialog */}
            <ExportDialog
                open={exportOpen}
                onClose={() => setExportOpen(false)}
                cutoffPeriods={cutoffPeriods}
            />

            {/* Bulk remarks dialogs */}
            <RemarksDialog
                open={bulkDialog === "approve"}
                onClose={() => setBulkDialog(null)}
                onConfirm={handleBulkAction}
                action="approve"
                title={`Approve ${selectedCount} Request${selectedCount !== 1 ? "s" : ""}`}
                description="Provide remarks that will apply to all selected requests."
                processing={bulkProcessing}
            />
            <RemarksDialog
                open={bulkDialog === "disapprove"}
                onClose={() => setBulkDialog(null)}
                onConfirm={handleBulkAction}
                action="disapprove"
                title={`Disapprove ${selectedCount} Request${selectedCount !== 1 ? "s" : ""}`}
                description="Provide remarks that will apply to all selected requests."
                processing={bulkProcessing}
            />
        </AuthenticatedLayout>
    );
}
