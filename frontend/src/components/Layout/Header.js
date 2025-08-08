import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FiMenu, 
  FiBell, 
  FiUser, 
  FiSettings, 
  FiLogOut,
  FiChevronDown 
} from 'react-icons/fi';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { logoutUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      toast.success('Çıkış yapıldı');
      navigate('/login');
    } catch (error) {
      toast.error('Çıkış yaparken hata oluştu');
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side - Mobile menu button */}
        <div className="flex items-center bg-gray-900 px-4 py-2 rounded-lg">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <FiMenu className="h-6 w-6" />
          </button>
          
          {/* Page title will be added later */}
          <h1 className="ml-4 text-lg font-semibold text-gray-300 lg:ml-0">
            Stok ve Üretim Yönetimi
          </h1>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
            <FiBell className="h-6 w-6" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 block h-2 w-2 bg-error-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-primary-600 font-medium text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <FiChevronDown className="ml-1 h-4 w-4" />
              </div>
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-20">
                  <div className="px-4 py-2 border-b border-secondary-200">
                    <p className="text-sm font-medium text-secondary-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-secondary-500 capitalize">
                      {user?.role}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                  >
                    <FiSettings className="mr-3 h-4 w-4" />
                    Ayarlar
                  </button>
                  
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      // Navigate to profile page when implemented
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                  >
                    <FiUser className="mr-3 h-4 w-4" />
                    Profil
                  </button>
                  
                  <hr className="my-1 border-secondary-200" />
                  
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-error-700 hover:bg-error-50"
                  >
                    <FiLogOut className="mr-3 h-4 w-4" />
                    Çıkış Yap
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;