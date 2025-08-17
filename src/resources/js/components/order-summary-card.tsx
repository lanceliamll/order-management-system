import { type OrderSummary } from "@/hooks/use-order-summary";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Package, RefreshCw, ShoppingBag, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

interface OrderSummaryCardProps {
  summary: OrderSummary | null;
  loading: boolean;
  isFetching?: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export function OrderSummaryCard({ summary, loading, isFetching = false, error, onRefresh }: OrderSummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Loading order data...</CardDescription>
            </div>
            {onRefresh && (
              <Button size="sm" variant="ghost" disabled>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Order Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ErrorState 
            error={error} 
            onRetry={onRefresh} 
            isRetrying={isFetching}
          />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>No order data available</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data to display
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>
              Overview of order statistics and performance
            </CardDescription>
          </div>
          {onRefresh && (
            <Button 
              size="sm" 
              variant={isFetching ? "ghost" : "outline"} 
              onClick={onRefresh}
              disabled={isFetching}
              className="flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-lg border bg-card shadow-sm p-3">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 text-blue-500 p-1.5 rounded-full">
                <ShoppingBag className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium">Total Orders</span>
            </div>
            <div className="text-2xl font-bold mt-2">{summary.total_orders.toLocaleString()}</div>
          </div>
          
          <div className="flex flex-col gap-1 rounded-lg border bg-card shadow-sm p-3">
            <div className="flex items-center gap-2">
              <div className="bg-green-50 text-green-500 p-1.5 rounded-full">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold mt-2">${summary.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          
          {/* Order Status Breakdown */}
          <div className="col-span-2 mt-2">
            <h3 className="mb-3 text-sm font-medium">Orders by Status</h3>
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {summary.summary_by_status.map((status) => {
                // Choose appropriate icon and color based on status
                let Icon = Clock;
                let statusColor = "text-muted-foreground";
                
                switch(status.status.toLowerCase()) {
                  case "pending":
                    Icon = Clock;
                    statusColor = "text-amber-500";
                    break;
                  case "confirmed":
                    Icon = CheckCircle;
                    statusColor = "text-emerald-500";
                    break;
                  case "delivered":
                    Icon = Package;
                    statusColor = "text-blue-500";
                    break;
                  case "cancelled":
                    Icon = XCircle;
                    statusColor = "text-destructive";
                    break;
                }
                
                return (
                  <div key={status.status} className="flex flex-col h-[100px] rounded-md border bg-card shadow-sm p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full p-1.5 ${
                          status.status.toLowerCase() === "confirmed" ? "bg-emerald-50 text-emerald-500" :
                          status.status.toLowerCase() === "cancelled" ? "bg-rose-50 text-rose-500" :
                          status.status.toLowerCase() === "pending" ? "bg-amber-50 text-amber-500" :
                          "bg-blue-50 text-blue-500"
                        }`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs capitalize font-medium">{status.status}</span>
                      </div>
                    </div>
                    <div className="mt-auto">
                      <div className="text-xl font-bold">
                        {status.count}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${status.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between w-full gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
            <span className="text-blue-500/90">Avg. Order Value:</span>
            <span className="font-medium">
              ${(summary.total_revenue / summary.total_orders).toFixed(2)}
            </span>
          </div>
          
          {/* Calculate percentages of different statuses */}
          {summary.summary_by_status.some(s => s.status.toLowerCase() === "cancelled") && (
            <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 rounded-md">
              <span className="text-rose-500/90">Cancellation Rate:</span>
              <span className="font-medium">
                {((summary.summary_by_status.find(s => s.status.toLowerCase() === "cancelled")?.count || 0) / summary.total_orders * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
