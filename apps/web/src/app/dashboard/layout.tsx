import { DashboardShell } from '@/components/dashboard/shell';
import { DashboardHeader } from '@/components/dashboard/header';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            <DashboardHeader />
            <div className="pt-14 h-screen"> {/* Offset for Header */}
                <DashboardShell>
                    {children}
                </DashboardShell>
            </div>
        </div>
    );
}
