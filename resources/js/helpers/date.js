import dayjs from "dayjs";

/**
 * Format an ISO date string as "MMMM DD, YYYY" (e.g. "May 01, 2026").
 * Strips any time component before parsing to avoid UTC-shift issues.
 */
export function fmtDate(iso) {
    if (!iso) return "—";
    return dayjs(iso.split("T")[0]).format("MMMM DD, YYYY");
}

/**
 * Format an ISO datetime string as "MMMM DD, YYYY hh:mm:ss A".
 */
export function fmtDateTime(iso) {
    if (!iso) return "—";
    return dayjs(iso).format("MMMM DD, YYYY hh:mm:ss A");
}
