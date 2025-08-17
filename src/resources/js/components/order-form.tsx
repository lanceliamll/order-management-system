import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useCreateOrder } from '@/hooks/use-orders';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '@/services/products-api';

interface OrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OrderForm({ onSuccess, onCancel }: OrderFormProps) {
  const [customer, setCustomer] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }]);
  
  const { createOrder, isCreating: isPending } = useCreateOrder();
  
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts(),
    select: (response) => {
      if (response.status !== 'success') {
        throw new Error(response.message || 'Failed to fetch products');
      }
      return response.data;
    },
  });
  
  const products = productsData || [];

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!customer.trim()) {
      alert('Please enter a customer name');
      return;
    }
    
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    
    const validItems = items.filter(
      item => item.product_id && Number(item.quantity) > 0
    );
    
    if (validItems.length === 0) {
      alert('Please select products and quantities for all items');
      return;
    }
    
    // Create order request
    const orderData = {
      products: validItems.map(item => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity)
      }))
    };
    
    createOrder(orderData, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
      },
      onError: (error: Error) => {
        alert(`Error creating order: ${error.message}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="customer">Customer Name</Label>
          <Input
            id="customer"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Enter customer name"
            required
          />
        </div>
        
        <div className="space-y-3">
          <Label>Order Items</Label>
          
          {items.map((item, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <Select
                      value={item.product_id.toString()}
                      onValueChange={(value) => updateItem(index, 'product_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} - ${product.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="w-full">
                      <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            className="w-full"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Order
        </Button>
      </div>
    </form>
  );
}
