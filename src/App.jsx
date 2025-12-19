import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout Principal (El marco de la app)
import Layout from './layout/Layout';

// Módulos de Productos y Ventas
import ProductList from './modules/products/ProductList';        // Pantalla Principal (POS/Ventas)
import AddProductForm from './modules/products/AddProductForm';  // Cargar Nuevo
import RestockForm from './modules/products/RestockForm';        // Reponer Mercadería
import EditProductForm from './modules/products/EditProductForm';// Editar Producto (Admin)

// Módulos de Proveedores
import SupplierPaymentForm from './modules/products/SupplierPaymentForm'; // Registrar Pago
import SupplierAccount from './modules/products/SupplierAccount';         // Ver Historial Pagos

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* El Layout envuelve a todas las rutas para que siempre se vea el menú */}
        <Route path="/" element={<Layout />}>
          
          {/* Ruta principal: Lista de productos / Punto de Venta */}
          <Route index element={<ProductList />} />
          
          {/* Rutas de Gestión de Productos */}
          <Route path="nuevo-producto" element={<AddProductForm />} />
          <Route path="reponer-stock" element={<RestockForm />} />
          <Route path="editar-producto/:id" element={<EditProductForm />} /> {/* Ruta dinámica con ID */}
          
          {/* Rutas de Proveedores */}
          <Route path="pago-proveedores" element={<SupplierPaymentForm />} />
          <Route path="cuenta-proveedores" element={<SupplierAccount />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
