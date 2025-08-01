import React from 'react';
import { FaTrash } from 'react-icons/fa';

const DeleteButton = ({
  onClick,
  isLoading = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        bg-red-600 hover:bg-red-700 disabled:bg-red-400
        text-white rounded transition-colors
        flex items-center justify-center
        ${sizeClasses[size]}
        ${className}
      `}
      type="button"
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
      ) : (
        <>
          <FaTrash className="mr-1" size={iconSizes[size]} />
          Sil
        </>
      )}
    </button>
  );
};

export default DeleteButton;