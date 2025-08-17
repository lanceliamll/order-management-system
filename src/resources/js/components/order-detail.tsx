import { useState } from 'react';
import { useOrder, useCancelOrderItems, useConfirmOrder, useCancelOrder } from '@/hooks/use-orders';
import { CancelOrderItemsRequest, OrderItem } from '@/services/orders-api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, RefreshCw, XCircle, Check, CalendarIcon, CircleDollarSign, Truck, ShoppingBasket, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

interface OrderDetailProps {
  orderId?: number;
  order?: any; // We'll define the correct type below
  onBack?: () => void;
}

export function OrderDetail({ orderId, order: initialOrder, onBack }: OrderDetailProps) {
  const { order: fetchedOrder, loading, isFetching, error } = orderId ? useOrder(orderId) : { order: null, loading: false, isFetching: false, error: null };
  
  // Use either the provided order or the fetched order
  const order = initialOrder || fetchedOrder;
  const { cancelItems, isCancelling } = useCancelOrderItems();
  const { confirmOrder, isConfirming } = useConfirmOrder();
  const { cancelOrder, isCancelling: isCancellingOrder } = useCancelOrder();
  const [cancelQuantities, setCancelQuantities] = useState<Record<number, number>>({});
  const [processingItemIds, setProcessingItemIds] = useState<Set<number>>(new Set());
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  
  // If no order is available, show a placeholder
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBasket className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <div className="text-muted-foreground">Select an order to view details</div>
      </div>
    );
  }
  
  // If onBack prop is provided, show a back button (mobile view)
  const backButton = onBack && (
    <Button 
      variant="ghost" 
      size="sm" 
      className="mb-4 -ml-2.5 text-muted-foreground" 
      onClick={onBack}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to orders
    </Button>
  );
  
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
  
  // Handle item cancellation quantity change
  const handleCancelQuantityChange = (itemId: number, quantity: number, max: number) => {
    // Ensure quantity is between 1 and max
    const validQuantity = Math.max(1, Math.min(max, quantity));
    setCancelQuantities({ ...cancelQuantities, [itemId]: validQuantity });
  };
  
  // Handle item cancellation
  const handleCancelItem = (itemId: number) => {
    if (!order) return;
    
    const item = order.items.find((i: any) => i.id === itemId);
    if (!item) return;
    
    const quantity = cancelQuantities[itemId] || item.quantity;
    const remainingQuantity = item.cancelled_quantity ? item.quantity - item.cancelled_quantity : item.quantity;
    
    if (quantity > remainingQuantity) {
      alert(`You can only cancel up to ${remainingQuantity} items`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to cancel ${quantity} of ${item.product_name}? This action cannot be undone.`)) {
      const cancelRequest: CancelOrderItemsRequest = {
        items: [{
          order_item_id: itemId,
          quantity
        }]
      };
      
      setProcessingItemIds((prev) => new Set(prev).add(itemId));
      
      cancelItems({
        orderId: order.id,
        items: cancelRequest
      }, {
        onSettled: () => {
          setProcessingItemIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
          // Reset the cancel quantity
          setCancelQuantities({ ...cancelQuantities, [itemId]: 0 });
        },
      });
    }
  };
  
  // Handle order confirmation
  const handleConfirmOrder = () => {
    if (!order) return;
    
    if (window.confirm('Are you sure you want to confirm this order? This will reduce inventory and mark the order as confirmed.')) {
      setIsProcessingOrder(true);
      confirmOrder(order.id, {
        onSettled: () => {
          setIsProcessingOrder(false);
        },
      });
    }
  };
  
  // Handle cancelling the entire order
  const handleCancelOrder = () => {
    if (!order) return;
    
    if (window.confirm('Are you sure you want to cancel this entire order? This action cannot be undone and will attempt to return all items to inventory.')) {
      setIsProcessingOrder(true);
      cancelOrder(order.id, {
        onSettled: () => {
          setIsProcessingOrder(false);
        },
      });
    }
  };
  
  // Get status badge color based on order status
  const getStatusBadge = (status: string) => {
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
  
  // Render cancel UI for items that can be cancelled
  const renderCancelUI = (item: OrderItem) => {
    if (!order || order.status === 'cancelled') return null;
    if (order.status !== 'confirmed' && order.status !== 'partially_cancelled') return null;
    
    const remainingQuantity = item.cancelled_quantity ? item.quantity - item.cancelled_quantity : item.quantity;
    if (remainingQuantity <= 0) return null;
    
    return (
      <div className="flex items-center gap-2 mt-2">
        <Input
          type="number"
          min={1}
          max={remainingQuantity}
          value={cancelQuantities[item.id] || remainingQuantity}
          onChange={(e) => handleCancelQuantityChange(item.id, parseInt(e.target.value) || 1, remainingQuantity)}
          className="w-20 h-8"
        />
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleCancelItem(item.id)}
          disabled={isCancelling || processingItemIds.has(item.id)}
          className="h-8"
        >
          {processingItemIds.has(item.id) ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Processing...
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" /> Cancel
            </>
          )}
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Loading order data...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <div className="animate-pulse">Loading order details...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            Order not found
          </div>
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="mt-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <CardTitle className="flex items-center gap-2">
                Order #{order.order_number} {getStatusBadge(order.status)}
              </CardTitle>
              <CardDescription>
                Created on {formatDate(order.created_at)}
              </CardDescription>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            disabled={isFetching}
            onClick={() => window.location.reload()}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <CalendarIcon className="h-4 w-4" /> Order Date
            </div>
            <div className="font-medium">{formatDate(order.created_at)}</div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800/30 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
              <CircleDollarSign className="h-4 w-4" /> Order Total
            </div>
            <div className="font-medium text-amber-800 dark:text-amber-300">{formatCurrency(order.total_amount)}</div>
          </div>
          
          <div className={cn(
            "p-4 rounded-lg border shadow-sm bg-gradient-to-br",
            order.status === 'confirmed' 
              ? "from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800/30" 
              : order.status === 'cancelled'
                ? "from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/20 border-rose-200 dark:border-rose-800/30"
                : order.status === 'partially_cancelled'
                  ? "from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 border-amber-200 dark:border-amber-800/30"
                  : "from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-200 dark:border-blue-800/30"
          )}>
            <div className={cn(
              "flex items-center gap-2 text-sm font-medium mb-2",
              order.status === 'confirmed' 
                ? "text-emerald-700 dark:text-emerald-400"
                : order.status === 'cancelled'
                  ? "text-rose-700 dark:text-rose-400"
                  : order.status === 'partially_cancelled'
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-blue-700 dark:text-blue-400"
            )}>
              <Truck className="h-4 w-4" /> Status
            </div>
            <div className={cn(
              "font-medium capitalize",
              order.status === 'confirmed' 
                ? "text-emerald-800 dark:text-emerald-300"
                : order.status === 'cancelled'
                  ? "text-rose-800 dark:text-rose-300"
                  : order.status === 'partially_cancelled'
                    ? "text-amber-800 dark:text-amber-300"
                    : "text-blue-800 dark:text-blue-300"
            )}>
              {order.status.replace('_', ' ')}
            </div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
              <ShoppingBasket className="h-4 w-4" /> Items
            </div>
            <div className="font-medium">{order?.items?.length} product(s)</div>
          </div>
        </div>

        <Separator />
        
        {/* Order Items */}
        <div>
          <h3 className="font-medium mb-3">Order Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(order?.items || [])?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.product_name}</div>
                      {item.product_sku && (
                        <div className="text-sm text-muted-foreground">SKU: {item.product_sku}</div>
                      )}
                      {item.cancelled_quantity && item.cancelled_quantity > 0 && (
                        <Badge variant="outline" className="mt-1 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200">
                          {item.cancelled_quantity} cancelled
                        </Badge>
                      )}
                      {renderCancelUI(item)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                  <TableCell className="text-center">
                    {item.quantity}
                    {item.cancelled_quantity && item.cancelled_quantity > 0 && (
                      <span className="text-muted-foreground text-sm ml-1">
                        ({item.quantity - (item.cancelled_quantity || 0)} active)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Order Total */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-2 border rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 shadow-sm p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax:</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping:</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span className="text-lg">{formatCurrency(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between border-t p-4 gap-4">
        <div className="flex items-center text-muted-foreground text-sm order-2 sm:order-1">
          <CalendarIcon className="h-3 w-3 mr-1.5" /> Last updated: {formatDate(order.updated_at)}
        </div>
        <div className="order-1 sm:order-2 flex flex-wrap gap-3 justify-between sm:justify-end items-center">
          {order.status === 'pending' ? (
            <div className="flex gap-3 items-center">
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
                <span className="text-amber-700 dark:text-amber-400">Awaiting Confirmation</span>
              </Badge>
              <Button
                size="sm"
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConfirmOrder}
                disabled={isConfirming || isProcessingOrder}
              >
                {isProcessingOrder ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Confirm Order
                  </>
                )}
              </Button>
            </div>
          ) : order.status === 'confirmed' || order.status === 'partially_cancelled' ? (
            <div className="flex gap-3 items-center">
              <Badge variant={order.status === 'confirmed' ? 
                "outline" : "outline"} 
                className={order.status === 'confirmed' ? 
                  "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900" : 
                  "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900"
                }
              >
                <span className={order.status === 'confirmed' ? 
                  "text-emerald-700 dark:text-emerald-400" : 
                  "text-purple-700 dark:text-purple-400"
                }>
                  {order.status === 'confirmed' ? 'Confirmed' : 'Partially Cancelled'}
                </span>
              </Badge>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleCancelOrder}
                disabled={isCancellingOrder || isProcessingOrder}
              >
                {isProcessingOrder ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5 mr-1.5" /> Cancel Order
                  </>
                )}
              </Button>
            </div>
          ) : null}
          {isFetching && (
            <div className="flex items-center text-muted-foreground">
              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
              Updating...
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
