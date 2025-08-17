import { useState } from 'react';
import { useOrders, useConfirmOrder, useCancelOrder } from '@/hooks/use-orders';
import { type Order } from '@/services/orders-api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, Eye, CheckCircle, XCircle, Plus, ShoppingBasket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

interface OrdersListProps {
  onSelectOrder?: (orderId: number) => void;
  onViewOrder?: (orderId: number) => void;
  onCreateOrder?: () => void;
  selectedOrderId?: number | null;
}

export function OrdersList({ onViewOrder, onCreateOrder, onSelectOrder, selectedOrderId }: OrdersListProps) {
  const { orders, loading, isFetching, error } = useOrders();
  const { confirmOrder, isConfirming } = useConfirmOrder();
  const { cancelOrder, isCancelling } = useCancelOrder();
  const [processingOrderIds, setProcessingOrderIds] = useState<Set<number>>(new Set());
  
  // Use media query hook for responsive behavior
  const isMobile = !useMediaQuery("(min-width: 768px)");
  
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
  
  // Handle order confirmation
  const handleConfirmOrder = (orderId: number) => {
    setProcessingOrderIds((prev) => new Set(prev).add(orderId));
    confirmOrder(orderId, {
      onSettled: () => {
        setProcessingOrderIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
      },
    });
  };
  
  // Handle order cancellation
  const handleCancelOrder = (orderId: number) => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      setProcessingOrderIds((prev) => new Set(prev).add(orderId));
      cancelOrder(orderId, {
        onSettled: () => {
          setProcessingOrderIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(orderId);
            return newSet;
          });
        },
      });
    }
  };
  
  // Get status badge color based on order status
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
            <span className="text-amber-700 dark:text-amber-400">Pending</span>
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
            <span className="text-emerald-700 dark:text-emerald-400">Confirmed</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900">
            <span className="text-rose-700 dark:text-rose-400">Cancelled</span>
          </Badge>
        );
      case 'partially_cancelled':
        return (
          <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900">
            <span className="text-purple-700 dark:text-purple-400">Partially Cancelled</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <span>{status}</span>
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Loading order data...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse">Loading orders...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              Manage customer orders and inventory
            </CardDescription>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              disabled={isFetching}
              onClick={() => window.location.reload()}
              className="h-9"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
            {onCreateOrder && (
              <Button 
                size="sm" 
                onClick={onCreateOrder}
                className="h-9"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {orders?.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center text-muted-foreground border border-dashed rounded-md bg-muted/5">
            <ShoppingBasket className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-medium text-muted-foreground mb-1">No orders found</h3>
            <p className="text-sm text-muted-foreground/60 max-w-md mb-4">
              Create your first order to get started with inventory management.
            </p>
            {onCreateOrder && (
              <Button onClick={onCreateOrder} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="hidden md:table-cell">Items</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders && orders.length > 0 ? orders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    className={cn(
                      "hover:bg-muted/50 cursor-pointer",
                      selectedOrderId === order.id && "bg-muted/70"
                    )}
                    onClick={() => onSelectOrder?.(order.id)}
                  >
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(order.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.total_amount)}</TableCell>
                    <TableCell className="hidden md:table-cell">{order?.items?.length}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {onViewOrder && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => onViewOrder(order.id)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        )}
                        {order.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleConfirmOrder(order.id)}
                              disabled={isConfirming || processingOrderIds.has(order.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Confirm</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={isCancelling || processingOrderIds.has(order.id)}
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="sr-only">Cancel</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between border-t p-4 gap-2 sm:gap-0">
        <div className="flex items-center text-sm text-muted-foreground order-2 sm:order-1">
          <Badge variant="outline" className="mr-2">
            {orders && orders.length ? orders.length : 0}
          </Badge>
          orders found
        </div>
        <div className="order-1 sm:order-2 w-full sm:w-auto">
          <div className="flex flex-wrap gap-2 justify-between sm:justify-end">
            {isFetching && (
              <div className="flex items-center text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                Updating...
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 text-xs border-dashed"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Refresh
              </Button>
              {onCreateOrder && (
                <Button 
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={onCreateOrder}
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  New Order
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
