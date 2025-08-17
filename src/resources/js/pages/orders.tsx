import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OrdersList } from '@/components/orders-list';
import { OrderDetail } from '@/components/order-detail';
import { OrderForm } from '@/components/order-form';
import { useOrders } from '@/hooks/use-orders';
import { Order } from '@/services/orders-api';
import { useMediaQuery } from '@/hooks/use-media-query';

export default function Orders() {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  
  // Use media query hook for responsive behavior
  const isMobile = !useMediaQuery("(min-width: 768px)");
  
  const { 
    orders, 
    loading: ordersLoading 
  } = useOrders();
  
  const selectedOrder = selectedOrderId && orders && orders.length > 0
    ? orders.find((order: any) => order.id === selectedOrderId) 
    : null;
    
  // Show details view on mobile when an order is selected
  useEffect(() => {
    if (selectedOrderId && isMobile) {
      setShowMobileDetail(true);
    }
  }, [selectedOrderId, isMobile]);
  
  // Handle back button on mobile
  const handleBackToList = () => {
    setShowMobileDetail(false);
  };

  return (
    <AppLayout>
      <Head title="Orders" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile header with back button when showing details */}
          {isMobile && showMobileDetail ? (
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2 p-0 h-9 w-9" 
                onClick={handleBackToList}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {selectedOrder ? `Order #${selectedOrder.order_number}` : 'Order Details'}
              </h1>
            </div>
          ) : (
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Orders
              </h1>
              
              <Dialog open={isCreatingOrder} onOpenChange={setIsCreatingOrder}>
                <DialogTrigger asChild>
                  <Button size="sm" className="shadow-sm">
                    <Plus className="mr-1.5 h-4 w-4" />
                    New Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Order</DialogTitle>
                    <DialogDescription>
                      Enter customer details and add products to create a new order.
                    </DialogDescription>
                  </DialogHeader>
                  <OrderForm 
                    onSuccess={() => {
                      setIsCreatingOrder(false);
                      // Reset any selected order on successful creation
                      setShowMobileDetail(false);
                    }}
                    onCancel={() => setIsCreatingOrder(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="grid md:grid-cols-12 gap-6">
            {/* Orders List - Hidden on mobile when showing details */}
            <div 
              className={`md:col-span-5 space-y-6 ${isMobile && showMobileDetail ? 'hidden' : ''}`}
            >
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>All Orders</CardTitle>
                  <CardDescription>
                    Manage and track customer orders
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OrdersList 
                    onSelectOrder={setSelectedOrderId} 
                    selectedOrderId={selectedOrderId} 
                  />
                </CardContent>
              </Card>
            </div>

            {/* Order Details - Full width on mobile when showing details */}
            <div 
              className={`
                md:col-span-7 space-y-6 
                ${isMobile && !showMobileDetail ? 'hidden' : ''}
                ${isMobile && showMobileDetail ? 'col-span-12' : ''}
              `}
            >
              <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>
                    {selectedOrderId ? 'Order Details' : 'Select an Order'}
                  </CardTitle>
                  <CardDescription>
                    {selectedOrderId 
                      ? `Order #${selectedOrderId} details and actions` 
                      : 'Click on an order from the list to view details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <OrderDetail 
                    order={selectedOrder} 
                    onBack={isMobile ? handleBackToList : undefined}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Floating Action Button on mobile */}
          {isMobile && !showMobileDetail && (
            <div className="fixed right-6 bottom-6">
              <Dialog open={isCreatingOrder} onOpenChange={setIsCreatingOrder}>
                <DialogTrigger asChild>
                  <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                    <Plus className="h-6 w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Order</DialogTitle>
                    <DialogDescription>
                      Enter customer details and add products to create a new order.
                    </DialogDescription>
                  </DialogHeader>
                  <OrderForm 
                    onSuccess={() => setIsCreatingOrder(false)}
                    onCancel={() => setIsCreatingOrder(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
