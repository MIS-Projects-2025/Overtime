import { Badge } from "@/Components/ui/badge";
import { STATUS_MAP } from "../constants";

export function StatusBadge({ status }) {
    const s = STATUS_MAP[status] ?? STATUS_MAP[0];
    return (
        <Badge variant="outline" className={`text-xs font-semibold ${s.cls}`}>
            {s.label}
        </Badge>
    );
}
