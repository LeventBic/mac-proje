import React from 'react';
import { FiEdit } from 'react-icons/fi';

interface EditButtonProps {
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'modern' | 'classic';
  className?: string;
  title?: string;
  showText?: boolean;
}

const EditButton: React.FC<EditButtonProps> = ({
  onClick,
  disabled = false,
  size = 'md',
  variant = 'primary',
  className = '',
  title = 'Düzenle',
  showText = false
}) => {
  // Size classes for padding and icon size
  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2', 
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // Base classes
  const baseClasses = `
    inline-flex items-center justify-center
    border border-solid
    rounded
    font-medium
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:shadow-sm
  `;

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 focus:ring-blue-500',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500 focus:ring-gray-500',
    outline: 'bg-transparent hover:bg-blue-50 text-blue-600 border-blue-500 focus:ring-blue-500',
    modern: 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-transparent focus:ring-purple-500 shadow-lg hover:shadow-xl transform hover:scale-105',
    classic: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 focus:ring-amber-500 shadow-md hover:shadow-lg'
  };

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${buttonClasses} ${showText ? 'gap-2' : ''}`}
      title={title}
    >
      <FiEdit className={iconSizes[size]} />
      {showText && (
        <span className="font-medium">
          Düzenle
        </span>
      )}
    </button>
  );
};

export default EditButton;