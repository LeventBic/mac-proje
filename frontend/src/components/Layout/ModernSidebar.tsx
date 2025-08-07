import React, { useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
  FiPackage,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiShoppingCart,
  FiCreditCard,
  FiBox,
  FiLayers,
  FiUsers,
  FiFileText,
  FiFolderPlus,
} from 'react-icons/fi';
import { toggleSidebar } from '../../store/slices/uiSlice';
import { setActiveMenu, clearActiveMenu } from '../../store/slices/navigationSlice';
import { MenuItem } from '../../types/index';

const ModernSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector((state: { ui: { sidebarOpen: boolean } }) => state.ui);
  const { activeMenuId } = useSelector((state: { navigation: { activeMenuId: string | null } }) => state.navigation);
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  // Separate states for hover and active behaviors
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredSettings, setHoveredSettings] = useState<boolean>(false);
  const [clickedSettings, setClickedSettings] = useState<boolean>(false);
  const [isToggleCooldown, setIsToggleCooldown] = useState<boolean>(false);
  
  // Separate position states
  const [hoverTooltipPosition, setHoverTooltipPosition] = useState<{top: number, left: number} | null>(null);
  const [activeDropdownPosition, setActiveDropdownPosition] = useState<{top: number, left: number} | null>(null);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const lastToggleTime = useRef<number>(0);
  const menuItemRefs = useRef<{[key: string]: HTMLElement | null}>({});

  // Position calculation functions
  const calculateTooltipPosition = useCallback((itemId: string) => {
    const element = menuItemRefs.current[itemId];
    if (element) {
      const rect = element.getBoundingClientRect();
      setHoverTooltipPosition({
        top: rect.top,
        left: rect.right + 8 // 8px boşluk
      });
    }
  }, []);

  const calculateDropdownPosition = useCallback((itemId: string) => {
    const element = menuItemRefs.current[itemId];
    if (element) {
      const rect = element.getBoundingClientRect();
      setActiveDropdownPosition({
        top: rect.top,
        left: rect.right + 8 // 8px boşluk
      });
    }
  }, []);

  // Menü öğeleri
  const menuItems: MenuItem[] = [
    {
      id: 'guncel-durum',
      label: 'GÜNCEL DURUM',
      icon: FiBarChart,
      path: '/dashboard',
    },
    {
      id: 'satislar',
      label: 'SATIŞLAR',
      icon: FiTrendingUp,
      path: '/sales',
      children: [
        {
          id: 'satis-listesi',
          label: 'Satış Listesi',
          icon: FiShoppingCart,
          path: '/sales/list',
        },
        {
          id: 'satis-raporlari',
          label: 'Satış Raporları',
          icon: FiFileText,
          path: '/sales/reports',
        },
        {
          id: 'musteriler',
          label: 'Müşteriler',
          icon: FiUsers,
          path: '/sales/customers',
        },
      ],
    },
    {
      id: 'giderler',
      label: 'GİDERLER',
      icon: FiTrendingDown,
      path: '/expenses',
      children: [
        {
          id: 'gider-listesi',
          label: 'Gider Listesi',
          icon: FiCreditCard,
          path: '/expenses/list',
        },
        {
          id: 'gider-kategorileri',
          label: 'Gider Kategorileri',
          icon: FiLayers,
          path: '/expenses/categories',
        },
        {
          id: 'gider-raporlari',
          label: 'Gider Raporları',
          icon: FiFileText,
          path: '/expenses/reports',
        },
      ],
    },
    {
      id: 'projeler',
      label: 'PROJELER',
      icon: FiLayers,
      path: '/projects',
      children: [
        {
          id: 'bop',
          label: 'BOP',
          icon: FiFileText,
          path: '/projects/bop',
        },
        {
          id: 'interaktif-bop',
          label: 'İNTERAKTİF BOP',
          icon: FiFolderPlus,
          path: '/projects/interactive-bop',
        },
        {
          id: 'projeler-sayfasi',
          label: 'Projeler Sayfası',
          icon: FiFolderPlus,
          path: '/projects/page',
        },
      ],
    },
    {
      id: 'stok',
      label: 'STOK',
      icon: FiPackage,
      path: '/inventory',
      children: [
        {
          id: 'urun-listesi',
          label: 'Ürün Listesi',
          icon: FiBox,
          path: '/products',
        },
        {
          id: 'stok-hareketleri',
          label: 'Stok Hareketleri',
          icon: FiLayers,
          path: '/inventory/movements',
        },
        {
          id: 'stok-raporlari',
          label: 'Stok Raporları',
          icon: FiFileText,
          path: '/inventory/reports',
        },
      ],
    },
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isItemActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  const hasActiveChild = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some(child => isItemActive(child.path));
  };

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = isItemActive(item.path);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const hasActiveChildItem = hasActiveChild(item.children);
    const isParentActive = isActive || hasActiveChildItem;

    return (
      <div key={item.id} className="mb-1">
        {/* Ana menü öğesi - Her buton ayrı div içinde */}
        <div 
          className="relative"
          ref={(el) => { menuItemRefs.current[item.id] = el; }}
        >
          {hasChildren ? (
            <button
              onClick={() => {
                if (sidebarOpen) {
                  toggleExpanded(item.id);
                } else {
                  // Küçük menüde tıklandığında
                  // Önce tüm açık dropdown'ları kapat
                  setClickedSettings(false);
                  setHoveredSettings(false);
                  
                  if (activeMenuId === item.id) {
                    dispatch(clearActiveMenu());
                    setActiveDropdownPosition(null);
                  } else {
                    dispatch(setActiveMenu(item.id));
                    calculateDropdownPosition(item.id);
                  }
                  setHoveredItem(null);
                  setHoverTooltipPosition(null);
                }
              }}
              onMouseEnter={() => {
                if (!sidebarOpen && activeMenuId !== item.id) {
                  setHoveredItem(item.id);
                  calculateTooltipPosition(item.id);
                }
              }}
              onMouseLeave={() => {
                if (!sidebarOpen) {
                  setHoveredItem(null);
                  setHoverTooltipPosition(null);
                }
              }}
              className={`
                w-full flex items-center justify-between px-4 py-3 text-sm font-medium relative
                ${isParentActive 
                  ? 'text-white bg-gray-700' 
                  : sidebarOpen 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-300 hover:text-white'
                }
                ${!sidebarOpen ? 'justify-center px-2' : ''}
              `}
            >
              <div className="flex items-center">
                {Icon && (
                  <Icon 
                    className={`
                      h-5 w-5 flex-shrink-0
                      ${!sidebarOpen ? '' : 'mr-3'}
                    `} 
                  />
                )}

          {/* Hover Tooltip - Only show when NOT active and sidebar is collapsed */}
          {!sidebarOpen && hoveredItem === item.id && hoverTooltipPosition && activeMenuId !== item.id && (
            <div 
              className="fixed z-[9999] bg-gray-700 text-white rounded-lg shadow-xl border border-gray-600 px-4 py-3"
              style={{
                top: `${hoverTooltipPosition.top}px`,
                left: `${hoverTooltipPosition.left}px`
              }}
            >
              <div className="text-sm font-medium whitespace-nowrap">
                {item.id === 'guncel-durum' ? 'GÜNCEL DURUM' : item.label}
              </div>
            </div>
          )}

          {/* Active Dropdown - Only show when clicked */}
          {!sidebarOpen && activeMenuId === item.id && activeDropdownPosition && (
            <div 
              className="fixed z-[9999] bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-w-48"
              style={{
                top: `${activeDropdownPosition.top}px`,
                left: `${activeDropdownPosition.left}px`
              }}
            >
              <div className="px-4 py-3 border-b border-gray-700 bg-gray-700 rounded-t-lg">
                <div className="text-sm font-medium text-white text-left">
                  {item.label}
                </div>
              </div>
              <div className="py-2">
                {item.children?.map(child => {
                  const ChildIcon = child.icon;
                  const isChildActive = isItemActive(child.path);
                  return (
                    <NavLink
                      key={child.id}
                      to={child.path}
                      className={`
                        flex items-center px-4 py-3 text-sm transition-colors
                        ${isChildActive 
                          ? 'bg-blue-600 text-white border-r-2 border-blue-400' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                      `}
                      onClick={() => {
                      dispatch(clearActiveMenu());
                      setActiveDropdownPosition(null);
                      if (window.innerWidth < 1024) {
                        dispatch(toggleSidebar());
                      }
                    }}
                    >
                      {ChildIcon && (
                        <ChildIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                      )}
                      <span className="font-medium">{child.label}</span>
                      {child.isNew && (
                        <span className="ml-auto px-2 py-1 text-xs font-medium bg-red-500 text-white rounded">
                          YENİ
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
                {sidebarOpen && (
                  <span className={`font-medium tracking-wide ${item.id === 'guncel-durum' ? 'whitespace-nowrap' : ''}`}>
                    {item.label}
                  </span>
                )}
              </div>
              {sidebarOpen && (
                 <div className="flex items-center">
                   {item.isNew && (
                     <span className="mr-2 px-2 py-1 text-xs font-medium bg-red-500 text-white rounded">
                       YENİ
                     </span>
                   )}
                   {isExpanded ? (
                     <FiChevronUp className="h-4 w-4" />
                   ) : (
                     <FiChevronDown className="h-4 w-4" />
                   )}
                 </div>
               )}
            </button>
          ) : (
            <NavLink
              to={item.path}
              className={`
                flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 relative
                ${isActive 
                  ? 'text-white bg-gray-700' 
                  : sidebarOpen 
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-300 hover:text-white'
                }
                ${!sidebarOpen ? 'justify-center px-2' : ''}
              `}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  dispatch(toggleSidebar());
                }
              }}
              onMouseEnter={() => {
                if (!sidebarOpen) {
                  setHoveredItem(item.id);
                  calculateTooltipPosition(item.id);
                }
              }}
              onMouseLeave={() => {
                if (!sidebarOpen) {
                  setHoveredItem(null);
                  setHoverTooltipPosition(null);
                }
              }}
            >
              {Icon && (
                <Icon 
                  className={`
                    h-5 w-5 flex-shrink-0 transition-all duration-200
                    ${!sidebarOpen ? 'scale-110' : 'mr-3'}
                  `} 
                />
              )}
              {sidebarOpen && (
                <span className={`font-medium tracking-wide ${item.id === 'guncel-durum' ? 'whitespace-nowrap' : ''}`}>
                  {item.label}
                </span>
              )}
              {item.isNew && sidebarOpen && (
                <span className="ml-auto px-2 py-1 text-xs font-medium bg-red-500 text-white rounded">
                  YENİ
                </span>
              )}
            </NavLink>
          )}
        </div>

        {/* Alt menü öğeleri - Akordeon (Büyük menü için) */}
        {hasChildren && isExpanded && sidebarOpen && (
          <div className="bg-gray-800">
            {item.children!.map(child => (
              <NavLink
                key={child.id}
                to={child.path}
                className={`
                  flex items-center px-8 py-2 text-sm transition-all duration-200
                  ${isItemActive(child.path)
                    ? 'text-white bg-gray-700'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }
                `}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    dispatch(toggleSidebar());
                  }
                }}
              >
                {child.icon && (
                  <child.icon 
                    className="h-4 w-4 mr-3 flex-shrink-0" 
                  />
                )}
                {child.label}
                {child.isNew && (
                  <span className="ml-auto px-2 py-1 text-xs font-medium bg-red-500 text-white rounded">
                    YENİ
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

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
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-40 bg-gray-900 transition-all duration-300 ease-in-out flex flex-col
          lg:static lg:inset-0 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-16'}
        `}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-center border-b border-gray-800 px-4 flex-shrink-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500">
            <div className="h-6 w-6 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map(item => renderMenuItem(item))}
        </div>

        {/* Footer - Sabit alt kısım */}
        <div className="border-t border-gray-800 py-4 flex-shrink-0 mt-auto space-y-1">
          {/* MENÜYÜ SAKLA */}
          <button
              onClick={() => {
                const now = Date.now();
                const cooldownTime = 330; // 0.33 saniye cooldown
                
                // Cooldown kontrolü
                if (now - lastToggleTime.current < cooldownTime) {
                  return; // Cooldown aktifse işlemi engelle
                }
                
                // Cooldown başlat
                setIsToggleCooldown(true);
                lastToggleTime.current = now;
                
                // Tüm açık durumları sıfırla
                setHoveredItem(null);
                dispatch(clearActiveMenu());
                setActiveDropdownPosition(null);
                setHoverTooltipPosition(null);
                setHoveredSettings(false);
                setClickedSettings(false);
                setExpandedItems([]);
                
                // Menüyü aç/kapat
                dispatch(toggleSidebar());
                
                // Cooldown'u kaldır
                setTimeout(() => {
                  setIsToggleCooldown(false);
                }, cooldownTime);
              }}
              className={`
                flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 w-full
                ${isToggleCooldown ? 'opacity-50' : ''}
                ${sidebarOpen ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-300 hover:text-white'}
                ${!sidebarOpen ? 'justify-center px-2' : ''}
              `}
          >
            <div className="flex items-center">
              {sidebarOpen ? (
                <FiChevronLeft className="h-5 w-5 flex-shrink-0 mr-3" />
              ) : (
                <FiChevronRight className="h-5 w-5 flex-shrink-0" />
              )}
              {sidebarOpen && (
                <span className="font-medium tracking-wide whitespace-nowrap">MENÜYÜ SAKLA</span>
              )}
            </div>
          </button>

          {/* AYARLAR - Ayrı div içinde */}
          <div className="relative">
            <button
              onClick={() => {
                if (sidebarOpen) {
                  // Büyük menüde ayarlar sayfasına git
                  window.location.href = '/settings';
                } else {
                  // Küçük menüde tıklandığında
                  // Önce diğer açık dropdown'ları kapat
                  dispatch(clearActiveMenu());
                  setActiveDropdownPosition(null);
                  setHoveredItem(null);
                  setHoverTooltipPosition(null);
                  
                  setClickedSettings(!clickedSettings);
                  setHoveredSettings(false);
                }
              }}
              onMouseEnter={() => {
                if (!sidebarOpen && !clickedSettings) {
                  setHoveredSettings(true);
                }
              }}
              onMouseLeave={() => {
                if (!sidebarOpen && !clickedSettings) {
                  setHoveredSettings(false);
                }
              }}
              className={`
                flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 w-full
                ${isItemActive('/settings') 
                  ? 'text-white bg-gray-700' 
                  : sidebarOpen 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                    : 'text-gray-300 hover:text-white'
                }
                ${!sidebarOpen ? 'justify-center px-2' : ''}
              `}
            >
              <FiSettings 
                className={`
                  h-5 w-5 flex-shrink-0 transition-all duration-200
                  ${!sidebarOpen ? 'scale-110' : 'mr-3'}
                `} 
              />
              {sidebarOpen && (
                <span className="font-medium tracking-wide">AYARLAR</span>
              )}
            </button>

            {/* Ayarlar için hover tooltip - ayarlar click'li değilse göster */}
            {!sidebarOpen && hoveredSettings && !clickedSettings && (
              <div 
                className="fixed z-[9999] bg-gray-700 text-white rounded-lg shadow-xl border border-gray-600 px-4 py-3"
                style={{
                  bottom: 8,
                  left: sidebarRef.current?.getBoundingClientRect().right! + 8
                }}
              >
                <div className="text-sm font-medium whitespace-nowrap">
                  AYARLAR
                </div>
              </div>
            )}

            {/* Ayarlar için tıklama dropdown - yukarı doğru açılır */}
            {!sidebarOpen && clickedSettings && (
              <div 
                className="fixed z-[9999] bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-w-48"
                style={{
                  bottom: 8,
                  left: sidebarRef.current?.getBoundingClientRect().right! + 8
                }}
              >
                <div className="py-2">
                  <NavLink
                    to="/settings/profile"
                    className={`
                      flex items-center px-4 py-3 text-sm transition-colors
                      ${isItemActive('/settings/profile') 
                        ? 'bg-blue-600 text-white border-r-2 border-blue-400' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                    onClick={() => {
                        setClickedSettings(false);
                        if (window.innerWidth < 1024) {
                          dispatch(toggleSidebar());
                        }
                      }}
                  >
                    <FiUsers className="h-4 w-4 mr-3 flex-shrink-0" />
                    Profil
                  </NavLink>
                  <NavLink
                    to="/settings/general"
                    className={`
                      flex items-center px-4 py-3 text-sm transition-colors
                      ${isItemActive('/settings/general') 
                        ? 'bg-blue-600 text-white border-r-2 border-blue-400' 
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                    onClick={() => {
                      setClickedSettings(false);
                      setHoveredSettings(false);
                      if (window.innerWidth < 1024) {
                        dispatch(toggleSidebar());
                      }
                    }}
                  >
                    <FiSettings className="h-4 w-4 mr-3 flex-shrink-0" />
                    Genel
                  </NavLink>
                </div>
                <div className="px-4 py-3 border-t border-gray-700 bg-gray-700 rounded-b-lg">
                  <div className="text-sm font-medium text-white text-left">
                    AYARLAR
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernSidebar;