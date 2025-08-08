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
  FiCreditCard,
  FiFileText,
  FiFolderPlus,
  FiList,
  FiTruck,
  FiHome,
  FiDollarSign,
  FiFolder,
  FiBarChart2,
  FiUsers,
  FiLayers,
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
  
  // Separate position states
  const [hoverTooltipPosition, setHoverTooltipPosition] = useState<{top: number, left: number} | null>(null);
  const [activeDropdownPosition, setActiveDropdownPosition] = useState<{top: number, left: number} | null>(null);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
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
          id: 'teklifler',
          label: 'Teklifler',
          icon: FiFileText,
          path: '/sales/quotes',
        },
        {
          id: 'faturalar',
          label: 'Faturalar',
          icon: FiCreditCard,
          path: '/sales/invoices',
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
          icon: FiList,
          path: '/expenses/list',
        },
        {
          id: 'tedarikciler',
          label: 'Tedarikçiler',
          icon: FiTruck,
          path: '/suppliers',
        },
        {
          id: 'calisanlar',
          label: 'Çalışanlar',
          icon: FiUsers,
          path: '/employees',
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
          id: 'hizmet-urunler',
          label: 'Hizmet ve Ürünler',
          icon: FiPackage,
          path: '/inventory/products-services',
        },
        {
          id: 'depolar',
          label: 'Depolar',
          icon: FiHome,
          path: '/inventory/warehouses',
        },
        {
          id: 'depolar-arasi-transfer',
          label: 'Depo Transferi',
          icon: FiTruck,
          path: '/inventory/warehouse-transfer',
        },
        {
          id: 'giden-irsaliye',
          label: 'Giden İrsaliye',
          icon: FiFileText,
          path: '/inventory/outgoing-delivery',
        },
        {
          id: 'gelen-irsaliye',
          label: 'Gelen İrsaliye',
          icon: FiFolder,
          path: '/inventory/incoming-delivery',
        },
        {
          id: 'fiyat-listesi',
          label: 'Fiyat Listesi',
          icon: FiDollarSign,
          path: '/inventory/price-list',
        },
        {
          id: 'stok-gecmisi',
          label: 'Stok Geçmişi',
          icon: FiBarChart2,
          path: '/inventory/stock-history',
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
                          ? 'bg-red-600 text-white border-r-2 border-red-400' 
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
        <div className="flex h-16 items-center justify-center border-b border-gray-800 px-4 flex-shrink-0 bg-white border-4 border-gray-800 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="93.5686mm" height="28.5119mm" style={{shapeRendering:"geometricPrecision", textRendering:"geometricPrecision", fillRule:"evenodd", clipRule:"evenodd"}} 
           viewBox="0 0 93.6499 28.5367" className="h-10 w-auto">
            <defs> 
             <style type="text/css"> 
              {`
               .str0 {stroke:#2B2A29;stroke-width:0.200174} 
               .fil0 {fill:none;fill-rule:nonzero} 
              `}
             </style> 
            </defs> 
            <g id="Layer_x0020_1"> 
             <metadata id="CorelCorpID_0Corel-Layer"/> 
             <path className="fil0 str0" d="M7.84181 16.2043c0,-2.4233 -1.52142,-2.531 -3.42067,-2.531l-1.13088 0 0 5.0756 1.13088 0c1.89925,0 3.42067,-0.107293 3.42067,-2.54461zm3.23 0c0,3.97215 -2.98879,4.71289 -5.93605,4.71289l-5.03567 0 0 -9.42448 5.03567 0c2.94726,0 5.93605,0.753154 5.93605,4.71159z"/> 
             <path className="fil0 str0" d="M21.5718 20.9158l-9.42408 0 0 -9.42308 9.29026 0 0 2.18059 -6.09879 0 0 1.32025 5.72106 0 0 2.18029 -5.72106 0 0 1.57507 6.23261 0 0 2.16688zm0 0z"/> 
             <path className="fil0 str0" d="M34.7783 11.4927l-4.36128 9.42308 -3.6894 0 -4.34857 -9.42308 3.31117 0 2.8816 7.05352 2.8811 -7.05352 3.32539 0zm0 0z"/> 
             <path className="fil0 str0" d="M48.616 15.7063l3.05635 0c0.943419,0 1.23857,-0.485421 1.23857,-1.09095 0,-0.619337 -0.390139,-0.942118 -1.23857,-0.942118l-3.05635 0 0 2.03306zm2.50477 2.15317l-2.50477 0 0 3.05625 -3.19007 0 0 -9.42418 6.70432 0c2.59876,0 4.02619,1.19844 4.02619,3.12381 0,1.42744 -0.726931,2.34333 -1.92537,2.82745l2.23434,3.47291 -3.43298 0 -1.91166 -3.05625zm0 0z"/> 
             <path className="fil0 str0" d="M64.6234 14.6831c0,-0.740743 -0.471709,-1.00988 -1.41373,-1.00988l-2.74728 0 0 2.15457 2.74728 0c0.996064,0 1.41373,-0.418063 1.41373,-1.14469zm3.24422 0c0,2.36956 -1.68286,3.29746 -4.28122,3.29746l-3.12401 0 0 2.93515 -3.19017 0 0 -9.42308 6.69061 0c2.59835,0 3.90479,1.2647 3.90479,3.19047z"/> 
             <path className="fil0 str0" d="M40.3917 11.4927l-3.6894 0 -4.34757 9.42308 7.06593 0 -0.866052 -2.11704 -2.01225 0 2.00554 -4.92377 2.8811 7.04081 3.32539 0 -4.36269 -9.42308zm0 0z"/> 
             <path className="fil0 str0" d="M93.0248 16.1283l-0.0318276 -0.178955 -0.0606526 -0.17275 -0.0925803 -0.162741 -0.121405 -0.155735 -0.151532 -0.146127 -0.180757 -0.136619 -0.209682 -0.128211 -0.239808 -0.118603 -0.267632 -0.109095 -0.295156 -0.0992862 -0.32268 -0.0882766 -0.350304 -0.0786683 -0.376727 -0.0688598 -0.402549 -0.0593515 -0.428972 -0.0469407 -0.452693 -0.0385334 -0.477014 -0.0261227 -0.499233 -0.0165143 -0.522954 -0.00570495 -0.544773 0.00420365 -0.565291 0.0166144 -0.584707 0.0261227 -0.604124 0.0360313 -0.623541 0.0466405 -0.638754 0.0578502 -0.65637 0.0678589 -0.671583 0.0786683 0.816308 0.814907 0.488324 -0.0592514 0.466104 -0.0494429 0.445587 -0.0416361 0.420565 -0.0314273 0.398646 -0.0237206 0.372423 -0.0151131 0.348903 -0.00570495 0.321279 0.00430373 0.295156 0.0123107 0.269033 0.0222193 0.240108 0.0304264 0.212284 0.0384334 0.182158 0.048342 0.155735 0.0565491 0.124208 0.0663576 0.0963836 0.0741644 0.0650565 0.0815708 0.0359312 0.091079 0.00670582 0.0977849 -0.0232202 0.106292 -0.0540469 0.114399 -0.084073 0.121505 -0.112998 0.128111 -0.142223 0.135217 -0.170948 0.142023 -0.201275 0.147528 -0.229099 0.154634 -0.256322 0.159939 -0.284247 0.165644 -0.310369 0.169447 -0.337893 0.176553 -0.362615 0.179356 -0.387736 0.183259 -0.412358 0.187863 -0.435678 0.191766 -0.457997 0.193068 -0.478816 0.197071 -0.500634 0.198772 -0.519751 0.199873 -0.538067 0.202676 -0.557184 0.202976 -0.572397 0.204077 -0.58751 0.202676 -0.602723 0.204077 -0.615034 0.204077 -0.627745 0.202676 -0.638454 0.200174 -0.646861 0.199873 -3.05765 -9.41177 8.34304 7.25199 2.64099 -1.09535 -17.3229 -17.3229 6.78699 25.3281 0.765464 -0.208281 0.762662 -0.216488 0.758758 -0.220692 0.753154 -0.227297 0.747449 -0.234504 0.739342 -0.237306 0.729533 -0.244312 0.721326 -0.246814 0.709015 -0.252419 0.696204 -0.254921 0.684294 -0.259525 0.670182 -0.262027 0.653867 -0.263329 0.638754 -0.266231 0.620338 -0.267632 0.602723 -0.270134 0.582305 -0.269033 0.563889 -0.270535 0.542271 -0.270034 0.519751 -0.270535 0.497832 -0.270435 0.474612 -0.267232 0.44979 -0.266231 0.42617 -0.26483 0.399647 -0.262328 0.373924 -0.257824 0.347502 -0.256623 0.320178 -0.251118 0.292354 -0.248215 0.26483 -0.243912 0.235905 -0.238707 0.20688 -0.233002 0.177954 -0.228799 0.148629 -0.222093 0.118703 -0.215387 0.0882766 -0.209782 0.0592514 -0.202676 0.0290252 -0.19557 -0.00250217 -0.187863zm0 0z"/> 
             <path className="fil0 str0" d="M92.6248 25.0921l-4.20665 -4.20525 -2.17639 1.07723 7.22687 6.28245 -0.843832 -3.15444zm0 0z"/> 
            </g> 
          </svg>
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
              }}
              className={`
                flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 w-full
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
                  // Büyük menüde ayarlar alt menüsünü aç/kapat
                  setExpandedItems(prev => 
                    prev.includes('ayarlar') 
                      ? prev.filter(id => id !== 'ayarlar')
                      : [...prev, 'ayarlar']
                  );
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
                {/* Üst kısım - AYARLAR ve Menüyü Sakla */}
                <div className="px-4 py-3 border-b border-gray-700 bg-gray-700 rounded-t-lg">
                  <div className="text-sm font-medium text-white text-left mb-2">
                    AYARLAR
                  </div>

                </div>
                
                {/* Alt kısım - Menü öğeleri */}
                <div className="py-2">
                  <NavLink
                    to="/ayarlar/firma-bilgileri"
                    className={`
                      flex items-center px-4 py-3 text-sm transition-colors
                      ${isItemActive('/ayarlar/firma-bilgileri') 
                        ? 'bg-red-600 text-white border-r-2 border-red-400' 
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
                    Firma Bilgileri
                  </NavLink>
                  <NavLink
                    to="/ayarlar/kategori-ve-etiketler"
                    className={`
                      flex items-center px-4 py-3 text-sm transition-colors
                      ${isItemActive('/ayarlar/kategori-ve-etiketler') 
                        ? 'bg-red-600 text-white border-r-2 border-red-400' 
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
                    Kategori ve Etiketler
                  </NavLink>
                  <NavLink
                    to="/ayarlar/kullanicilar"
                    className={`
                      flex items-center px-4 py-3 text-sm transition-colors
                      ${isItemActive('/ayarlar/kullanicilar') 
                        ? 'bg-red-600 text-white border-r-2 border-red-400' 
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
                    <FiUsers className="h-4 w-4 mr-3 flex-shrink-0" />
                    Kullanıcılar
                  </NavLink>
                </div>
              </div>
            )}

            {/* Büyük menüde ayarlar alt menüsü - Akordeon */}
            {sidebarOpen && expandedItems.includes('ayarlar') && (
              <div className="bg-gray-800">
                <NavLink
                  to="/ayarlar/firma-bilgileri"
                  className={`
                    flex items-center px-8 py-2 text-sm transition-all duration-200
                    ${isItemActive('/ayarlar/firma-bilgileri')
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
                  <FiUsers className="h-4 w-4 mr-3 flex-shrink-0" />
                  Firma Bilgileri
                </NavLink>
                <NavLink
                  to="/ayarlar/kategori-ve-etiketler"
                  className={`
                    flex items-center px-8 py-2 text-sm transition-all duration-200
                    ${isItemActive('/ayarlar/kategori-ve-etiketler')
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
                  <FiSettings className="h-4 w-4 mr-3 flex-shrink-0" />
                  Kategori ve Etiketler
                </NavLink>
                <NavLink
                  to="/ayarlar/kullanicilar"
                  className={`
                    flex items-center px-8 py-2 text-sm transition-all duration-200
                    ${isItemActive('/ayarlar/kullanicilar')
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
                  <FiUsers className="h-4 w-4 mr-3 flex-shrink-0" />
                  Kullanıcılar
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModernSidebar;