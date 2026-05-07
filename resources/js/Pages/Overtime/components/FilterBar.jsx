import { Filter, Search } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_OPTIONS = [
    { value: "all", label: "All" },
    { value: "0",   label: "Pending" },
    { value: "1",   label: "Partially Approved" },
    { value: "2",   label: "Approved" },
    { value: "3",   label: "Disapproved" },
    { value: "4",   label: "Cancelled" },
];

export function FilterBar({ currentStatus, onStatusChange, search, onSearch }) {
    return (
        <Card>
            <CardContent className="py-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            value={search}
                            onChange={(e) => onSearch(e.target.value)}
                            placeholder="Search form no, dept, product line…"
                            className="h-8 pl-8 text-sm"
                        />
                    </div>

                    <span className="text-sm text-muted-foreground font-medium shrink-0">
                        Status:
                    </span>
                    <Select
                        defaultValue={currentStatus ?? "all"}
                        onValueChange={onStatusChange}
                    >
                        <SelectTrigger className="w-44 h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
