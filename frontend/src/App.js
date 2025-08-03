import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./config/queryClient";
import { Toaster } from "react-hot-toast";

// Import store
import { store } from "./store/store";

// Import components
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

// Import pages
import LoginPage from "./pages/Auth/LoginPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProductsPage from "./pages/Products/ProductsPage";
import ProductDetailPage from "./pages/Products/ProductDetailPage";
import InventoryPage from "./pages/Inventory/InventoryPage";
import CurrentStockPage from "./pages/Inventory/CurrentStockPage";
import StockReorderPage from "./pages/Inventory/StockReorderPage";
import StockTransfersPage from "./pages/Inventory/StockTransfersPage";
import StockAdjustmentsPage from "./pages/Inventory/StockAdjustmentsPage";
import StockCountsPage from "./pages/Inventory/StockCountsPage";
import StockroomScansPage from "./pages/Inventory/StockroomScansPage";
import SuppliersPage from "./pages/Purchasing/SuppliersPage";
import PurchaseOrdersPage from "./pages/Purchasing/PurchaseOrdersPage";
import PurchaseQuotesPage from "./pages/Purchasing/PurchaseQuotesPage";
import SalesOrdersPage from "./pages/Sales/SalesOrdersPage";
import SalesQuotesPage from "./pages/Sales/SalesQuotesPage";
import CustomersPage from "./pages/Customers/CustomersPage";
import ProductionPage from "./pages/Production/ProductionPage";
import ProductionDetailPage from "./pages/Production/ProductionDetailPage";
import BOMPage from "./pages/BOM/BOMPage";
import InteractiveBOMPage from "./pages/BOM/InteractiveBOMPage";
import ProjectsPage from "./pages/Projects/ProjectsPage";
import UsersPage from "./pages/Users/UsersPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import ReportsPage from "./pages/Dashboard/ReportsPage";
import OperationsPage from "./pages/Operations/OperationsPage";
import DataTableDemo from "./components/DataTableDemo";

// QueryClient is imported from config/queryClient.js

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router future={{ v7_startTransition: true }}>
          <div className="App">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/operations" element={<OperationsPage />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Products */}
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/:id" element={<ProductDetailPage />} />

                {/* Inventory */}
                <Route path="inventory" element={<InventoryPage />} />

                {/* Current Stock */}
                <Route path="current-stock" element={<CurrentStockPage />} />

                {/* Stock Reorder */}
                <Route path="reorder-stock" element={<StockReorderPage />} />

                {/* Stock Transfers */}
                <Route
                  path="stock-transfers"
                  element={<StockTransfersPage />}
                />

                {/* Stock Adjustments */}
                <Route
                  path="stock-adjustments"
                  element={<StockAdjustmentsPage />}
                />

                {/* Stock Counts */}
                <Route path="stock-counts" element={<StockCountsPage />} />

                {/* Stockroom Scans */}
                <Route
                  path="stockroom-scans"
                  element={<StockroomScansPage />}
                />

                {/* Suppliers */}
                <Route path="suppliers" element={<SuppliersPage />} />

                {/* Purchase Orders */}
                <Route
                  path="purchase-orders"
                  element={<PurchaseOrdersPage />}
                />

                {/* Purchase Quotes */}
                <Route
                  path="purchase-quotes"
                  element={<PurchaseQuotesPage />}
                />

                {/* Sales Orders */}
                <Route path="sales-orders" element={<SalesOrdersPage />} />

                {/* Sales Quotes */}
                <Route path="sales-quotes" element={<SalesQuotesPage />} />

                {/* Customers */}
                <Route path="customers" element={<CustomersPage />} />

                {/* Production */}
                <Route path="production" element={<ProductionPage />} />
                <Route
                  path="production/:id"
                  element={<ProductionDetailPage />}
                />

                {/* BOM (Bill of Materials) */}
                <Route path="bom" element={<BOMPage />} />
                <Route path="interactive-bom" element={<InteractiveBOMPage />} />

                {/* Projects */}
                <Route path="projects" element={<ProjectsPage />} />

                {/* Users (Admin only) */}
                <Route
                  path="users"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Settings */}
                <Route path="settings" element={<SettingsPage />} />
                
                {/* DataTable Demo */}
                <Route path="datatable-demo" element={<DataTableDemo />} />
              </Route>

              {/* 404 page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>

            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: "#22c55e",
                    secondary: "#fff",
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
