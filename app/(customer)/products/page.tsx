'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import apiClient from '@/lib/api';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function ProductsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProducts();
    
    // Load previously selected products from sessionStorage if they exist
    // This allows users to edit their order and see what they already selected
    const savedItems = sessionStorage.getItem('orderItems');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        // Convert array of {productId, quantity} to Record<string, number>
        const selectedProductsMap: Record<string, number> = {};
        parsedItems.forEach((item: { productId: string; quantity: number }) => {
          selectedProductsMap[item.productId] = item.quantity;
        });
        setSelectedProducts(selectedProductsMap);
        console.log('Loaded previously selected products:', selectedProductsMap);
      } catch (error) {
        console.error('Failed to load selected products:', error);
      }
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 0) return;
    if (quantity === 0) {
      const newSelected = { ...selectedProducts };
      delete newSelected[productId];
      setSelectedProducts(newSelected);
    } else {
      setSelectedProducts({
        ...selectedProducts,
        [productId]: quantity,
      });
    }
  };

  const handleOrder = () => {
    const items = Object.entries(selectedProducts)
      .filter(([_, quantity]) => quantity > 0) // Only include products with quantity > 0
      .map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

    if (items.length === 0) {
      alert('Please select at least one product');
      return;
    }

    // Store selected items in sessionStorage and redirect to order placement
    const itemsJson = JSON.stringify(items);
    console.log('Saving order items to sessionStorage:', items); // Debug log
    console.log('JSON string:', itemsJson); // Debug log
    
    // Set flag first, then items (to ensure flag is set before navigation)
    sessionStorage.setItem('fromProducts', 'true');
    sessionStorage.setItem('orderItems', itemsJson);
    
    // Verify it was saved
    const verify = sessionStorage.getItem('orderItems');
    console.log('Verified saved items:', verify); // Debug log
    
    router.push('/orders/new');
  };

  const getTotalPrice = () => {
    return products.reduce((total, product) => {
      const quantity = selectedProducts[product.id] || 0;
      return total + product.pricePerLiter * quantity;
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Fuel Products</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                {product.description && (
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                )}
                <p className="text-2xl font-bold text-primary-600 mb-4">
                  {formatCurrency(product.pricePerLiter)} / {product.unit}
                </p>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleQuantityChange(product.id, (selectedProducts[product.id] || 0) - 1)}
                    disabled={!selectedProducts[product.id]}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={selectedProducts[product.id] || 0}
                    onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center"
                    placeholder="0"
                  />
                  <button
                    onClick={() => handleQuantityChange(product.id, (selectedProducts[product.id] || 0) + 1)}
                    className="w-10 h-10 rounded-full bg-primary-600 text-white hover:bg-primary-700 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600">liters</span>
                </div>
                {selectedProducts[product.id] && (
                  <p className="mt-4 text-sm text-gray-600">
                    Subtotal: {formatCurrency(product.pricePerLiter * selectedProducts[product.id])}
                  </p>
                )}
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No products available at the moment.</p>
            </div>
          )}

          {Object.keys(selectedProducts).length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total Items: {Object.keys(selectedProducts).length}</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalPrice())}</p>
                </div>
                <button
                  onClick={handleOrder}
                  className="bg-primary-600 text-white px-8 py-3 rounded-md hover:bg-primary-700 font-medium transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

