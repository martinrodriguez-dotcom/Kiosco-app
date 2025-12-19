import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Si ya creaste el context

import Layout from './layout/Layout';
import ShopDashboard from './modules/products/ShopDashboard'; // <-- IMPORTANTE: USAR ESTE
import AddProductForm from './modules/products/AddProductForm';
import RestockForm from './modules/products/RestockForm';
import EditProductForm from './modules/products/EditProductForm';
import SupplierPaymentForm from './modules/products/SupplierPaymentForm';
import SupplierAccount from './modules/products/SupplierAccount';
import Login from './modules/auth/Login'; // Si ya creaste el login

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<Layout />}>
            {/* Ahora el index carga el Dashboard con pestañas */}
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
