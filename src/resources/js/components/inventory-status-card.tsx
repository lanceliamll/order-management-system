import { type InventoryStatusSummary } from "@/hooks/use-inventory-status";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Package, RefreshCw, ArrowDown, ArrowUp, AlertTriangle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { format } from "date-fns";

interface InventoryStatusCardProps {
  inventoryStatus: InventoryStatusSummary | null;
  loading: boolean;
  isFetching?: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export function InventoryStatusCard({ 
  inventoryStatus, 
  loading, 
  isFetching = false, 
  error, 
  onRefresh 
}: InventoryStatusCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inventory Status Overview</CardTitle>
              <CardDescription>Loading inventory data...</CardDescription>
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
            <CardTitle>Inventory Status Overview</CardTitle>
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

  if (!inventoryStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Status Overview</CardTitle>
          <CardDescription>No inventory data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No inventory data found.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Log data for debugging
  console.log('Inventory Status Data:', inventoryStatus);
  console.log('Recent Activities:', inventoryStatus.recent_activities);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Inventory Status Overview</CardTitle>
            <CardDescription>
              Real-time inventory metrics and stock movement history
            </CardDescription>
          </div>
          {onRefresh && (
            <Button 
              size="sm" 
              variant={isFetching ? "ghost" : "outline"} 
              onClick={onRefresh} 
              className="flex-shrink-0"
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Inventory Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Products</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{inventoryStatus.total_products}</div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Inventory Value</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{formatCurrency(inventoryStatus.total_inventory_value)}</div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Low Stock</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{inventoryStatus.low_stock_count}</div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Out of Stock</span>
            </div>
            <div className="mt-2 text-2xl font-bold">{inventoryStatus.out_of_stock_count}</div>
          </div>
        </div>
        
        {/* Recent Activities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Inventory Movement History</h3>
            <div className="text-xs text-muted-foreground">
              Showing {inventoryStatus.recent_activities?.length || 0} recent transactions
            </div>
          </div>
          {inventoryStatus.recent_activities && inventoryStatus.recent_activities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Product</TableHead>
                  <TableHead className="w-[20%]">Activity Type</TableHead>
                  <TableHead className="text-center w-[20%]">Quantity Change</TableHead>
                  <TableHead className="w-[30%]">Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryStatus.recent_activities.map((activity) => (
                  <TableRow key={activity.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {activity?.product?.name || activity?.product_name || 'Unknown Product'}
                      {activity?.product?.sku && (
                        <div className="text-xs text-muted-foreground mt-1">
                          SKU: {activity.product.sku}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {activity.type === 'stock_in' ? (
                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
                          <span className="flex items-center gap-1">
                            <ArrowUp className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Stock Added</span>
                          </span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900">
                          <span className="flex items-center gap-1">
                            <ArrowDown className="h-3 w-3 text-rose-600" />
                            <span className="text-rose-700 dark:text-rose-400 font-medium">Stock Removed</span>
                          </span>
                        </Badge>
                      )}
                      {activity.notes && (
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]" title={activity.notes}>
                          {activity.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                        activity.type === 'stock_in' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' 
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}>
                        {activity.type === 'stock_in' ? '+' : ''}{Math.abs(activity.quantity_change)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {activity.updated_at ? (
                        <div>
                          <div className="font-medium text-sm">{formatDate(activity.updated_at)}</div>
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center border rounded-md bg-muted/5">
              <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2 opacity-50" />
              <p className="text-muted-foreground mb-1">No inventory movements recorded</p>
              <p className="text-xs text-muted-foreground">Recent stock changes will appear here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
