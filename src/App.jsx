import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout Principal
import Layout from './layout/Layout';

// Dashboard Principal (Con pestañas de Venta y Caja)
import ShopDashboard from './modules/products/ShopDashboard';

// Módulos de Productos
import AddProductForm from './modules/products/AddProductForm';
import RestockForm from './modules/products/RestockForm';
import EditProductForm from './modules/products/EditProductForm';

// Módulos de Proveedores
import SupplierPaymentForm from './modules/products/SupplierPaymentForm';
import SupplierAccount from './modules/products/SupplierAccount';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          
          {/* Ruta principal: Carga el Dashboard con Pestañas */}
          <Route index element={<ShopDashboard />} />
          
          {/* Rutas de Gestión */}
          <Route path="nuevo-producto" element={<AddProductForm />} />
          <Route path="reponer-stock" element={<RestockForm />} />
          <Route path="editar-producto/:id" element={<EditProductForm />} />
          
          {/* Rutas de Proveedores */}
          <Route path="pago-proveedores" element={<SupplierPaymentForm />} />
          <Route path="cuenta-proveedores" element={<SupplierAccount />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
