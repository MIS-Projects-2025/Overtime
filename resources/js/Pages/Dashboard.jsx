import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    XCircle,
    Ban,
    Users,
    TrendingUp,
} from "lucide-react";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const STATUS_MAP = {
    0: { label: "Pending",     variant: "secondary" },
    1: { label: "Partial",     variant: "outline"   },
    2: { label: "Approved",    variant: "default"   },
    3: { label: "Disapproved", variant: "destructive" },
    4: { label: "Cancelled",   variant: "outline"   },
};

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                </CardTitle>
                <Icon className={`w-5 h-5 ${color}`} />
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            </CardContent>
        </Card>
    );
}

const ROLE_CONFIG = {
    operator: {
        label: "Operator",
        description: "Showing all overtime requests",
        badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    },
    approver: {
        label: "Approver",
        description: "Showing requests from your direct reports",
        badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    },
    employee: {
        label: "Employee",
        description: "Showing your own overtime requests",
        badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
};

export default function Dashboard({
    summary,
    monthlyTrend,
    topDepartments,
    statusDistribution,
    recentRequests,
    year,
    viewRole,
}) {
    const role = ROLE_CONFIG[viewRole] ?? ROLE_CONFIG.employee;
    // ── Monthly Trend Bar Chart ──────────────────────────────────
    const barData = {
        labels: monthlyTrend.labels,
        datasets: [
            {
                label: "OT Requests",
                data: monthlyTrend.data,
                backgroundColor: "hsl(var(--primary) / 0.8)",
                borderRadius: 6,
            },
        ],
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { mode: "index", intersect: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { precision: 0 },
                grid: { color: "hsl(var(--border))" },
            },
            x: { grid: { display: false } },
        },
    };

    // ── Department Bar Chart ─────────────────────────────────────
    const deptColors = [
        "#6366f1","#8b5cf6","#a78bfa","#c4b5fd",
        "#818cf8","#60a5fa","#34d399","#fbbf24",
        "#f87171","#fb923c",
    ];

    const deptData = {
        labels: topDepartments.labels,
        datasets: [
            {
                label: "Requests",
                data: topDepartments.data,
                backgroundColor: deptColors,
                borderRadius: 6,
            },
        ],
    };

    const deptOptions = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
            x: {
                beginAtZero: true,
                ticks: { precision: 0 },
                grid: { color: "hsl(var(--border))" },
            },
            y: { grid: { display: false } },
        },
    };

    // ── Status Doughnut ──────────────────────────────────────────
    const doughnutData = {
        labels: statusDistribution.labels,
        datasets: [
            {
                data: statusDistribution.data,
                backgroundColor: [
                    "#fbbf24",
                    "#60a5fa",
                    "#34d399",
                    "#f87171",
                    "#94a3b8",
                ],
                borderWidth: 2,
                borderColor: "hsl(var(--background))",
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: { padding: 16, boxWidth: 12, font: { size: 12 } },
            },
        },
        cutout: "65%",
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${role.badgeClass}`}>
                            {role.label}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {role.description} — {year}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.get(route('dashboard'), { year: year - 1 })}
                        className="text-xs px-3 py-1.5 rounded-md border hover:bg-accent transition-colors"
                    >
                        ← {year - 1}
                    </button>
                    <span className="text-sm font-medium px-2">{year}</span>
                    {year < new Date().getFullYear() && (
                        <button
                            onClick={() => router.get(route('dashboard'), { year: year + 1 })}
                            className="text-xs px-3 py-1.5 rounded-md border hover:bg-accent transition-colors"
                        >
                            {year + 1} →
                        </button>
                    )}
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
                <StatCard
                    icon={ClipboardList}
                    label="Total Requests"
                    value={summary.total}
                    color="text-primary"
                />
                <StatCard
                    icon={Clock}
                    label="Pending"
                    value={summary.pending}
                    color="text-yellow-500"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Partial"
                    value={summary.partial}
                    color="text-blue-400"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Approved"
                    value={summary.approved}
                    color="text-green-500"
                />
                <StatCard
                    icon={XCircle}
                    label="Disapproved"
                    value={summary.disapproved}
                    color="text-red-500"
                />
                <StatCard
                    icon={Ban}
                    label="Cancelled"
                    value={summary.cancelled}
                    color="text-slate-400"
                />
                <StatCard
                    icon={Users}
                    label="Employees on OT"
                    value={summary.total_employees_on_ot}
                    color="text-violet-500"
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Monthly Trend */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Monthly OT Requests</CardTitle>
                        <CardDescription>Number of requests created per month in {year}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <Bar data={barData} options={barOptions} />
                        </div>
                    </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status Distribution</CardTitle>
                        <CardDescription>All-time breakdown by status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Top Departments */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Departments</CardTitle>
                        <CardDescription>Departments with most OT requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            {topDepartments.labels.length > 0 ? (
                                <Bar data={deptData} options={deptOptions} />
                            ) : (
                                <p className="text-sm text-muted-foreground text-center pt-10">
                                    No data available
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Requests */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Requests</CardTitle>
                        <CardDescription>Latest 10 overtime requests</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Form No.</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Product Line</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="text-center text-muted-foreground py-8"
                                        >
                                            No requests found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    recentRequests.map((req) => {
                                        const status = STATUS_MAP[req.ot_status] ?? {
                                            label: "Unknown",
                                            variant: "outline",
                                        };
                                        return (
                                            <TableRow
                                                key={req.ot_form_no}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() =>
                                                    router.get(
                                                        route('overtime.show', req.ot_form_no)
                                                    )
                                                }
                                            >
                                                <TableCell className="font-mono text-xs font-medium">
                                                    {req.ot_form_no}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {req.department}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {req.productline || "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={status.variant}>
                                                        {status.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {req.date_created}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
