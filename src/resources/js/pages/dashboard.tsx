import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { LowStockCard } from '@/components/low-stock-card';
import { OrderSummaryCard } from '@/components/order-summary-card';
import { InventoryStatusCard } from '@/components/inventory-status-card';
import { useLowStock } from '@/hooks/use-low-stock';
import { useOrderSummary } from '@/hooks/use-order-summary';
import { useInventoryStatus } from '@/hooks/use-inventory-status';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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
    const { 
        products, 
        summary: lowStockSummary, 
        loading: lowStockLoading, 
        isFetching: lowStockFetching, 
        error: lowStockError 
    } = useLowStock(THRESHOLD);
    
    // Get the first and last day of the current month using date-fns
    const today = new Date();
    const firstDay = startOfMonth(today);
    const lastDay = endOfMonth(today);
    const firstDayOfMonth = format(firstDay, 'yyyy-MM-dd');
    const lastDayOfMonth = format(lastDay, 'yyyy-MM-dd');
    
    // Fetch order summary data for the current month
    const {
        summary: orderSummary,
        loading: orderSummaryLoading,
        isFetching: orderSummaryFetching,
        error: orderSummaryError
    } = useOrderSummary({
        fromDate: firstDayOfMonth,
        toDate: lastDayOfMonth
    });

    // Fetch inventory status data
    const {
        inventoryStatus,
        loading: inventoryStatusLoading,
        isFetching: inventoryStatusFetching,
        error: inventoryStatusError
    } = useInventoryStatus();

    // Function to refresh low stock data
    const handleRefreshLowStock = () => {
        queryClient.invalidateQueries({ queryKey: ['lowStockProducts', THRESHOLD] });
    };
    
    // Function to refresh order summary data
    const handleRefreshOrderSummary = () => {
        queryClient.invalidateQueries({ queryKey: ['orderSummary'] });
    };
    
    // Function to refresh inventory status data
    const handleRefreshInventoryStatus = () => {
        queryClient.invalidateQueries({ queryKey: ['inventoryStatus'] });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Low Stock Products Card */}
                    <LowStockCard 
                        products={products}
                        summary={lowStockSummary}
                        loading={lowStockLoading}
                        isFetching={lowStockFetching}
                        error={lowStockError}
                        onRefresh={handleRefreshLowStock}
                    />
                    
                    {/* Order Summary Card */}
                    <OrderSummaryCard
                        summary={orderSummary}
                        loading={orderSummaryLoading}
                        isFetching={orderSummaryFetching}
                        error={orderSummaryError}
                        onRefresh={handleRefreshOrderSummary}
                    />
                </div>
                
                {/* Inventory Status Overview */}
                <div className="grid gap-4">
                    <InventoryStatusCard
                        inventoryStatus={inventoryStatus}
                        loading={inventoryStatusLoading}
                        isFetching={inventoryStatusFetching}
                        error={inventoryStatusError}
                        onRefresh={handleRefreshInventoryStatus}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
