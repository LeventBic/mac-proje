import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600">404</h1>
          <h2 className="text-2xl font-bold text-secondary-900 mt-4">
            Sayfa Bulunamadı
          </h2>
          <p className="text-secondary-600 mt-2">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="btn-primary inline-flex items-center"
          >
            <FiHome className="h-5 w-5 mr-2" />
            Ana Sayfaya Dön
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="btn-secondary inline-flex items-center ml-4"
          >
            <FiArrowLeft className="h-5 w-5 mr-2" />
            Geri Dön
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
