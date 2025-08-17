import { type LowStockProduct, type LowStockSummary } from "@/hooks/use-low-stock";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LowStockCardProps {
  products: LowStockProduct[];
  summary: LowStockSummary | null;
  loading: boolean;
  isFetching?: boolean; // Added isFetching flag for refresh state
  error: string | null;
  onRefresh?: () => void;
}

export function LowStockCard({ products, summary, loading, isFetching = false, error, onRefresh }: LowStockCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Low Stock Products</CardTitle>
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
            <CardTitle>Low Stock Products</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Low Stock Products</CardTitle>
            <CardDescription>
              Products with stock below the threshold ({summary?.threshold_used || 10})
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
        {products.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No low stock products found.
          </div>
        ) : (
          <div className="max-h-[300px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${product.stock_quantity === 0 ? 'text-destructive' : 'text-amber-500'}`}>
                        {product.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${product.inventory_value.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {summary && (
        <CardFooter className="flex flex-col items-start border-t px-6 py-4">
          <div className="grid w-full grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Low Stock Items</p>
              <p className="font-medium">{summary.low_stock_count}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Out of Stock</p>
              <p className="font-medium text-destructive">{summary.out_of_stock_count}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Total Value at Risk</p>
              <p className="font-medium">${summary.total_value_at_risk.toFixed(2)}</p>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
