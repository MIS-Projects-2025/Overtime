import { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";

/**
 * Core hook for the Overtime index page.
 * Provides URL-param navigation, sort state, per-tab search, and bulk selection.
 */
export function useOvertimeIndex(filters) {
    const orderBy  = filters.order_by  ?? "date_created";
    const orderDir = filters.order_dir ?? "desc";

    const applyParams = (params) => {
        router.get(
            route("overtime.index"),
            { ...filters, ...params },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (sortKey) => {
        const newDir = orderBy === sortKey && orderDir === "asc" ? "desc" : "asc";
        applyParams({ order_by: sortKey, order_dir: newDir });
    };

    // ── Per-tab search states with debounce ───────────────────────────────────

    const [search,   setSearch]   = useState(filters.search   ?? "");
    const [hSearch,  setHSearch]  = useState(filters.h_search ?? "");
    const [apSearch, setApSearch] = useState(filters.ap_search ?? "");
    const [ahSearch, setAhSearch] = useState(filters.ah_search ?? "");

    const debounceRef = useRef({});

    const makeSearchHandler = (setter, paramKey) => (value) => {
        setter(value);
        clearTimeout(debounceRef.current[paramKey]);
        debounceRef.current[paramKey] = setTimeout(() => {
            applyParams({ [paramKey]: value, page: 1 });
        }, 400);
    };

    const handleSearch   = makeSearchHandler(setSearch,   "search");
    const handleHSearch  = makeSearchHandler(setHSearch,  "h_search");
    const handleApSearch = makeSearchHandler(setApSearch, "ap_search");
    const handleAhSearch = makeSearchHandler(setAhSearch, "ah_search");

    // Sync search values if the user navigates back/forward
    useEffect(() => { setSearch(filters.search   ?? ""); }, [filters.search]);
    useEffect(() => { setHSearch(filters.h_search ?? ""); }, [filters.h_search]);
    useEffect(() => { setApSearch(filters.ap_search ?? ""); }, [filters.ap_search]);
    useEffect(() => { setAhSearch(filters.ah_search ?? ""); }, [filters.ah_search]);

    useEffect(() => () => {
        Object.values(debounceRef.current).forEach(clearTimeout);
    }, []);

    // ── Bulk selection (for approval-pending table) ───────────────────────────

    const [selected, setSelected] = useState(new Set());

    const toggleSelect = (formNo) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(formNo)) next.delete(formNo);
            else next.add(formNo);
            return next;
        });
    };

    const toggleSelectAll = (rows) => {
        const allSelected =
            rows.length > 0 && rows.every((r) => selected.has(r.ot_form_no));
        setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.ot_form_no)));
    };

    const clearSelection = () => setSelected(new Set());

    return {
        orderBy, orderDir,
        applyParams, handleSort,
        search, handleSearch,
        hSearch, handleHSearch,
        apSearch, handleApSearch,
        ahSearch, handleAhSearch,
        selected, toggleSelect, toggleSelectAll, clearSelection,
    };
}
