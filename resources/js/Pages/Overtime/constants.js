export const STATUS_MAP = {
    0: {
        label: "Pending",
        cls: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    },
    1: {
        label: "Partially Approved",
        cls: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    },
    2: {
        label: "Approved",
        cls: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    },
    3: {
        label: "Disapproved",
        cls: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    },
    4: {
        label: "Cancelled",
        cls: "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
    },
};

export const SHIFT_LABEL = {
    N: "Normal",
    A: "Morning",
    C: "Night",
};

export const SORTABLE_COLUMNS = [
    "ot_form_no",
    "department",
    "productline",
    "date_from",
    "ot_status",
    "date_created",
];
