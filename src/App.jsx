import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layout y Login
import Layout from './layout/Layout';
import Login from './modules/auth/Login';

// Módulos de Productos y Ventas
import ShopDashboard from './modules/products/ShopDashboard';
import AddProductForm from './modules/products/AddProductForm';
import RestockForm from './modules/products/RestockForm';
import EditProductForm from './modules/products/EditProductForm';
import CashboxHistoryList from './modules/products/CashboxHistoryList'; // <--- NUEVO IMPORT

// Módulos de Proveedores
import SupplierPaymentForm from './modules/products/SupplierPaymentForm';
import SupplierAccount from './modules/products/SupplierAccount';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta Pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Privadas (Protegidas) */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Ruta Index: Dashboard (POS y Caja Actual) */}
            <Route index element={<ShopDashboard />} />
            
            {/* Gestión de Productos */}
            <Route path="nuevo-producto" element={<AddProductForm />} />
            <Route path="reponer-stock" element={<RestockForm />} />
            <Route path="editar-producto/:id" element={<EditProductForm />} />
            
            {/* Gestión de Proveedores */}
            <Route path="pago-proveedores" element={<SupplierPaymentForm />} />
            <Route path="cuenta-proveedores" element={<SupplierAccount />} />
            
            {/* Gestión de Cajas */}
            <Route path="historial-cajas" element={<CashboxHistoryList />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
