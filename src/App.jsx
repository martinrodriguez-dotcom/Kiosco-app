import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layout/Layout';
import ProductList from './modules/products/ProductList';
import AddProductForm from './modules/products/AddProductForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* El Layout envuelve a todas las rutas internas */}
        <Route path="/" element={<Layout />}>
          
          {/* Ruta principal: Lista de productos */}
          <Route index element={<ProductList />} />
          
          {/* Ruta: Cargar nuevo producto */}
          <Route path="nuevo-producto" element={<AddProductForm />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
