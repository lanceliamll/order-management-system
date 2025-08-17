import { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ArrowUp, ArrowDown, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { ErrorState } from '@/components/ui/error-state';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  fetchProductsWithLowStock, 
  adjustInventory,
  fetchInventoryLogs
} from '@/services/products-api';
import { 
  ProductListItem, 
  InventoryLog, 
  formatCurrency,
  formatDate
} from '@/types/product';

export function InventoryDashboard() {
  const [inventoryAction, setInventoryAction] = useState<'add' | 'remove'>('add');
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [lowStockProducts, setLowStockProducts] = useState<ProductListItem[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  
  // Loading and error states
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  
  const clearProductsError = () => setProductsError(null);
  const clearLogsError = () => setLogsError(null);
  
  // Fetch low stock products
  const fetchLowStockProducts = async () => {
    try {
      setProductsLoading(true);
      clearProductsError();
      
      const data = await fetchProductsWithLowStock();
      setLowStockProducts(data);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Failed to fetch low stock products');
    } finally {
      setProductsLoading(false);
    }
  };
  
  // Fetch inventory logs
  const fetchInventoryHistory = async () => {
    try {
      setLogsLoading(true);
      clearLogsError();
      
      const data = await fetchInventoryLogs();
      setInventoryLogs(data);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : 'Failed to fetch inventory logs');
    } finally {
      setLogsLoading(false);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchLowStockProducts();
    fetchInventoryHistory();
  }, []);
  
  // Handle inventory adjustment
  const handleAdjustInventory = async () => {
    if (!selectedProduct || !quantity || quantity <= 0) return;
    
    try {
      setAdjustLoading(true);
      
      const adjustment = {
        product_id: selectedProduct.id,
        quantity: inventoryAction === 'add' ? quantity : -quantity,
        reason: reason || (inventoryAction === 'add' ? 'Stock replenishment' : 'Inventory adjustment')
      };
      
      await adjustInventory(adjustment);
      
      // Refresh data after adjustment
      fetchLowStockProducts();
      fetchInventoryHistory();
      
      // Reset form
      setSelectedProduct(null);
      setQuantity(1);
      setReason('');
      setDialogOpen(false);
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : 'Failed to adjust inventory');
    } finally {
      setAdjustLoading(false);
    }
  };
  
  // Render low stock alerts
  const renderLowStockAlerts = () => {
    if (productsLoading) {
      return (
        <div className="py-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading low stock products...</p>
        </div>
      );
    }
    
    if (productsError) {
      return (
        <ErrorState 
          error={productsError} 
          onRetry={fetchLowStockProducts} 
        />
      );
    }
    
    if (lowStockProducts.length === 0) {
      return (
        <div className="py-6 text-center">
          <Info className="h-10 w-10 text-green-500 mx-auto" />
          <p className="mt-2 text-muted-foreground">All products have sufficient stock</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {lowStockProducts.map(product => (
          <div 
            key={product.id} 
            className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50"
          >
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  Current: {product.stock_quantity} | Reorder at: {product.reorder_point || 10}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedProduct(product);
                setInventoryAction('add');
                setDialogOpen(true);
              }}
            >
              Restock
            </Button>
          </div>
        ))}
      </div>
    );
  };
  
  // Render inventory history
  const renderInventoryHistory = () => {
    if (logsLoading) {
      return (
        <div className="py-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading inventory logs...</p>
        </div>
      );
    }
    
    if (logsError) {
      return (
        <ErrorState 
          error={logsError} 
          onRetry={fetchInventoryHistory} 
        />
      );
    }
    
    if (inventoryLogs.length === 0) {
      return (
        <div className="py-6 text-center">
          <Info className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="mt-2 text-muted-foreground">No inventory activity found</p>
        </div>
      );
    }
    
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryLogs.map(log => (
              <TableRow key={log.id}>
                <TableCell>{formatDate(log.created_at)}</TableCell>
                <TableCell>{log.product_name}</TableCell>
                <TableCell className="flex items-center">
                  {log.quantity > 0 ? (
                    <>
                      <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-600">+{log.quantity}</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-red-600">{log.quantity}</span>
                    </>
                  )}
                </TableCell>
                <TableCell>{log.reason}</TableCell>
                <TableCell>{log.user_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  return (
    <div className="space-y-8">
      {/* Inventory Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>Adjust stock levels and manage your inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="action">Action</Label>
              <Select 
                value={inventoryAction} 
                onValueChange={(value: 'add' | 'remove') => setInventoryAction(value)}
              >
                <SelectTrigger id="action">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="remove">Remove Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => setDialogOpen(true)}
              className="w-full md:w-auto"
            >
              Adjust Inventory
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Low Stock Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Low Stock Alerts</CardTitle>
            <CardDescription>Products that need restocking</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchLowStockProducts}
            disabled={productsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${productsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {renderLowStockAlerts()}
        </CardContent>
      </Card>
      
      {/* Inventory History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Inventory History</CardTitle>
            <CardDescription>Recent inventory adjustments</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchInventoryHistory}
            disabled={logsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${logsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {renderInventoryHistory()}
        </CardContent>
      </Card>
      
      {/* Inventory Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {inventoryAction === 'add' ? 'Add Stock' : 'Remove Stock'}
            </DialogTitle>
            <DialogDescription>
              Adjust the inventory level for a product.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={selectedProduct?.id.toString() || ''}
                onValueChange={(value) => {
                  const product = lowStockProducts.find(p => p.id.toString() === value);
                  setSelectedProduct(product || null);
                }}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {lowStockProducts.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - Current: {product.stock_quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={inventoryAction === 'add' ? "Stock replenishment" : "Inventory adjustment"}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={adjustLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustInventory} 
              disabled={!selectedProduct || quantity <= 0 || adjustLoading}
            >
              {adjustLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                inventoryAction === 'add' ? 'Add Stock' : 'Remove Stock'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
