import React, { useRef, useEffect, useCallback, useState } from 'react';

const StickyFooter = ({
  currentPage,
  totalPages,
  onPageChange,
  tableWrapperRef,
  customScrollbarRef
}) => {
  // Sync scrolling between table and custom scrollbar
  const handleCustomScrollbarScroll = useCallback(() => {
    if (tableWrapperRef.current && customScrollbarRef.current) {
      tableWrapperRef.current.scrollLeft = customScrollbarRef.current.scrollLeft;
    }
  }, [tableWrapperRef, customScrollbarRef]);

  useEffect(() => {
    const customScrollbar = customScrollbarRef.current;
    if (customScrollbar) {
      customScrollbar.addEventListener('scroll', handleCustomScrollbarScroll);
      return () => {
        customScrollbar.removeEventListener('scroll', handleCustomScrollbarScroll);
      };
    }
  }, [handleCustomScrollbarScroll, customScrollbarRef]);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`px-3 py-1 mx-1 text-sm rounded ${
            i === currentPage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="sticky bottom-0 z-10 w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {/* Custom Horizontal Scrollbar */}
      <div className="w-full h-4" style={{ backgroundColor: '#de1717' }}>
        <div
          ref={customScrollbarRef}
          className="w-full h-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800"
        >
          <div className="h-1 min-w-full" style={{ width: '200%', backgroundColor: '#ffff' }}></div>
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Sayfa {currentPage} / {totalPages}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
          >
            İlk
          </button>
          
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
          >
            Önceki
          </button>
          
          {renderPageNumbers()}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
          >
            Sonraki
          </button>
          
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
          >
            Son
          </button>
        </div>
      </div>
    </div>
  );
};

// Main DataTable component
const DataTable = ({
  columns,
  data,
  pageSize = 10,
  className = ''
}) => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
   
  // Refs for DOM elements
  const tableWrapperRef = useRef(null);
  const customScrollbarRef = useRef(null);
  
  // Calculate pagination
  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = data.slice(startIndex, endIndex);
  
  // Handle page change
  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  // Sync scrolling from table to custom scrollbar
  const handleTableScroll = useCallback(() => {
    if (tableWrapperRef.current && customScrollbarRef.current) {
      customScrollbarRef.current.scrollLeft = tableWrapperRef.current.scrollLeft;
    }
  }, []);
  
  // Set up scroll synchronization
  useEffect(() => {
    const tableWrapper = tableWrapperRef.current;
    if (tableWrapper) {
      tableWrapper.addEventListener('scroll', handleTableScroll);
      return () => {
        tableWrapper.removeEventListener('scroll', handleTableScroll);
      };
    }
  }, [handleTableScroll]);
  
  // Update custom scrollbar width based on table content
  useEffect(() => {
    if (tableWrapperRef.current && customScrollbarRef.current) {
      const tableWidth = tableWrapperRef.current.scrollWidth;
      const wrapperWidth = tableWrapperRef.current.clientWidth;
      const scrollbarContent = customScrollbarRef.current.firstElementChild;
       
      if (scrollbarContent) {
        scrollbarContent.style.width = `${(tableWidth / wrapperWidth) * 100}%`;
      }
    }
  }, [columns, currentData]);
  
  return (
    <div className={`relative ${className}`}>
      {/* Table Container */}
      <div className="mb-20"> {/* Add margin bottom for sticky footer */}
        <div
          ref={tableWrapperRef}
          className="overflow-x-auto"
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              .overflow-x-auto::-webkit-scrollbar {
                display: none;
              }
            `
          }} />
          
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-6 py-3 whitespace-nowrap"
                    style={{ width: column.width || 'auto', minWidth: '150px' }}
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((record, index) => (
                <tr
                  key={index}
                  className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap"
                    >
                      {column.render
                        ? column.render(record[column.key], record, startIndex + index)
                        : record[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Sticky Footer with Pagination and Custom Scrollbar */}
      <StickyFooter
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        tableWrapperRef={tableWrapperRef}
        customScrollbarRef={customScrollbarRef}
      />
    </div>
  );
};

export default DataTable;