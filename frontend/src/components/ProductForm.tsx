import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';

interface ProductFormProps {
  onSubmit?: (productData: any) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock_quantity: '',
  });

  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Ürün Ekle</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ürün Adı */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Ürün Adı
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Kategori Seçimi */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
            Kategori
          </label>
          {categoriesLoading ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
              Kategoriler yükleniyor...
            </div>
          ) : categoriesError ? (
            <div className="w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-500">
              Kategoriler yüklenirken hata oluştu
            </div>
          ) : (
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Kategori seçiniz</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Açıklama */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Açıklama
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Fiyat */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Fiyat (₺)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Stok Miktarı */}
        <div>
          <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Stok Miktarı
          </label>
          <input
            type="number"
            id="stock_quantity"
            name="stock_quantity"
            value={formData.stock_quantity}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
        >
          Ürün Ekle
        </button>
      </form>
    </div>
  );
};

export default ProductForm;