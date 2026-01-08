import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Layout y Login
import Layout from './layout/Layout';
import Login from './modules/auth/Login';

// Módulos
import ShopDashboard from './modules/products/ShopDashboard';
import AddProductForm from './modules/products/AddProductForm';
import RestockForm from './modules/products/RestockForm';
import EditProductForm from './modules/products/EditProductForm';
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
            <Route index element={<ShopDashboard />} />
            
            <Route path="nuevo-producto" element={<AddProductForm />} />
            <Route path="reponer-stock" element={<RestockForm />} />
            <Route path="editar-producto/:id" element={<EditProductForm />} />
            
            <Route path="pago-proveedores" element={<SupplierPaymentForm />} />
            <Route path="cuenta-proveedores" element={<SupplierAccount />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
