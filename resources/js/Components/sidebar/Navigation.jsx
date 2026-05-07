import { usePage } from "@inertiajs/react";
import SidebarLink from "@/Components/sidebar/SidebarLink";
import Dropdown from "@/Components/sidebar/Dropdown";
import { LayoutDashboard, Clock, PlusCircle, List, Users } from "lucide-react";

export default function NavLinks({ isSidebarOpen }) {
    const { emp_data, is_operator } = usePage().props;

    return (
        <nav
            className="flex flex-col flex-grow space-y-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
        >
            {/* Dashboard */}
            <SidebarLink
                href={route("dashboard")}
                label="Dashboard"
                icon={<LayoutDashboard className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
            />

            <Dropdown
                label="Overtime"
                icon={<Clock className="w-5 h-5" />}
                isSidebarOpen={isSidebarOpen}
                links={[
                    {
                        href: route("overtime.create"),
                        label: "Create",
                        icon: <PlusCircle className="w-4 h-4" />,
                    },
                    {
                        href: route("overtime.index"),
                        label: "Requests",
                        icon: <List className="w-4 h-4" />,
                    },
                    ...(is_operator ? [
                        {
                            href: route("overtime.operators.index"),
                            label: "Operators",
                            icon: <Users className="w-4 h-4" />,
                        },
                    ] : []),
                ]}
            />
        </nav>
    );
}
