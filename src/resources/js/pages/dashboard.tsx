import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { LowStockCard } from '@/components/low-stock-card';
import { useLowStock } from '@/hooks/use-low-stock';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const queryClient = useQueryClient();
    const THRESHOLD = 10;
    
    // Fetch low stock products using TanStack Query
    const { products, summary, loading, isFetching, error } = useLowStock(THRESHOLD);

    // Function to refresh low stock data
    const handleRefreshLowStock = () => {
        queryClient.invalidateQueries({ queryKey: ['lowStockProducts', THRESHOLD] });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Low Stock Products Card */}
                    <LowStockCard 
                        products={products}
                        summary={summary}
                        loading={loading}
                        isFetching={isFetching}
                        error={error}
                        onRefresh={handleRefreshLowStock}
                    />
                    
                    {/* Placeholder for another component */}
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 md:aspect-auto dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                
                <div className="relative min-h-[40vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
