import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layout/Layout';
import ProductList from './modules/products/ProductList';
import AddProductForm from './modules/products/AddProductForm';
import RestockForm from './modules/products/RestockForm'; // Importar
import SupplierPaymentForm from './modules/products/SupplierPaymentForm'; // Importar

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          
          <Route index element={<ProductList />} />
          <Route path="nuevo-producto" element={<AddProductForm />} />
          
          {/* Nuevas rutas */}
          <Route path="reponer-stock" element={<RestockForm />} />
          <Route path="pago-proveedores" element={<SupplierPaymentForm />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
