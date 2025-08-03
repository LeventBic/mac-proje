import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiPackage,
  FiLayers,
  FiTool,
  FiUsers,
  FiSettings,
  FiX,
  FiBriefcase,
} from 'react-icons/fi';
import { toggleSidebar } from '../../store/slices/uiSlice';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: FiHome,
      roles: ['admin', 'operator', 'viewer'],
    },
    {
      name: 'Ürünler',
      href: '/products',
      icon: FiPackage,
      roles: ['admin', 'operator', 'viewer'],
    },
    {
      name: 'Stok',
      href: '/inventory',
      icon: FiLayers,
      roles: ['admin', 'operator', 'viewer'],
    },
    {
      name: 'Üretim',
      href: '/production',
      icon: FiTool,
      roles: ['admin', 'operator', 'viewer'],
    },
    {
      name: 'BOM',
      href: '/bom',
      icon: FiLayers,
      roles: ['admin', 'operator'],
    },
    {
      name: 'İnteraktif BOM',
      href: '/interactive-bom',
      icon: FiTool,
      roles: ['admin', 'operator'],
    },
    {
      name: 'Projeler',
      href: '/projects',
      icon: FiBriefcase,
      roles: ['admin', 'operator', 'viewer'],
    },
    {
      name: 'Kullanıcılar',
      href: '/users',
      icon: FiUsers,
      roles: ['admin'],
    },
    {
      name: 'Ayarlar',
      href: '/settings',
      icon: FiSettings,
      roles: ['admin', 'operator', 'viewer'],
    },
  ];

  // Filter navigation items based on user role
  const filteredNavigation = navigationItems.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out
        lg:static lg:inset-0 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b border-secondary-200 px-6">
          <div className="flex items-center">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-600">
              <span className="text-lg font-bold text-white">iF</span>
            </div>
            <h1 className="ml-3 text-xl font-bold text-secondary-900">
              inFlow
            </h1>
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="rounded-md p-1 hover:bg-secondary-100 lg:hidden"
          >
            <FiX className="h-6 w-6 text-secondary-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {filteredNavigation.map(item => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/dashboard' &&
                  location.pathname.startsWith(item.href));

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`
                    ${isActive ? 'nav-item-active' : 'nav-item-inactive'}
                    group flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200
                  `}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      dispatch(toggleSidebar());
                    }
                  }}
                >
                  <Icon
                    className={`
                    mr-3 h-5 w-5 flex-shrink-0
                    ${isActive ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'}
                  `}
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-secondary-200 p-4">
          <div className="flex items-center">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
              <span className="text-sm font-medium text-primary-600">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-secondary-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs capitalize text-secondary-500">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
