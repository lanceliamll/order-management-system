import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ProductsTable from '@/components/products/products-table';
import { Product, fetchProducts, ProductsResponse } from '@/services/products-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProductForm from '@/components/products/product-form';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Function to load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetchProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle editing a product
  const handleEdit = (id: number) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setEditingProduct(product);
      setFormOpen(true);
    }
  };

  // Handle creating a new product
  const handleCreate = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = async (formData: any) => {
    // TODO: Implement API calls for creating/updating products
    console.log('Form submitted:', formData);
    
    // Close the form
    setFormOpen(false);
    
    // Refresh products list
    loadProducts();
  };

  return (
    <AppLayout>
      <Head title="Products" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Products</h1>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          <div className="overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6 border-b">
              <ProductsTable
                products={products}
                loading={loading}
                onEdit={handleEdit}
                onRefresh={loadProducts}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update the details of this product.'
                : 'Fill in the details to add a new product.'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Product Form */}
          <ProductForm 
            product={editingProduct || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
