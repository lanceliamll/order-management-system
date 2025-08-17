import { type OrderSummary } from "@/hooks/use-order-summary";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Package, RefreshCw, ShoppingBag, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            {onRefresh && (
              <Button 
                size="sm" 
                variant={isFetching ? "ghost" : "outline"} 
                onClick={onRefresh}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching ? 'Retrying...' : 'Retry'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Orders</span>
            </div>
            <div className="text-2xl font-bold">{summary.total_orders.toLocaleString()}</div>
          </div>
          
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold">${summary.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          
          {/* Order Status Breakdown */}
          <div className="col-span-2">
            <h3 className="mb-2 text-sm font-medium">Orders by Status</h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
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
                    Icon = Package;
                    statusColor = "text-blue-500";
                    break;
                  case "delivered":
                    Icon = CheckCircle;
                    statusColor = "text-green-500";
                    break;
                  case "cancelled":
                    Icon = XCircle;
                    statusColor = "text-destructive";
                    break;
                }
                
                return (
                  <div key={status.status} className="flex flex-col gap-1 rounded-md border p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${statusColor}`} />
                        <span className="text-sm capitalize">{status.status}</span>
                      </div>
                      <span className="text-sm font-medium">{status.count}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${status.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-3">
        <div className="flex justify-between w-full text-sm">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Avg. Value:</span>
            <span className="font-medium">
              ${(summary.total_revenue / summary.total_orders).toFixed(2)}
            </span>
          </div>
          
          {/* Calculate percentages of different statuses */}
          {summary.summary_by_status.some(s => s.status.toLowerCase() === "cancelled") && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Cancellation Rate:</span>
              <span className="font-medium text-destructive">
                {((summary.summary_by_status.find(s => s.status.toLowerCase() === "cancelled")?.count || 0) / summary.total_orders * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
