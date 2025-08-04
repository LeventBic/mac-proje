import React from 'react';
import { FaTrash } from 'react-icons/fa';

const DeleteButton = ({
  onClick,
  isLoading = false,
  size = 'md',
  className = ''
}) => {
  // Boyut sınıfları - EditButton ile aynı
  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  // İkon boyutları - EditButton ile aynı format
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const baseClasses = `
    inline-flex items-center justify-center
    border rounded-md
    transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:shadow-sm
  `;

  const variantClasses = 'bg-white hover:bg-gray-50 text-red-500 border-red-500';

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={buttonClasses}
      title="Sil"
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
      ) : (
        <FaTrash className={iconSizes[size]} />
      )}
    </button>
  );
};

export default DeleteButton;