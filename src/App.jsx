import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'sonner'; // <--- Librería de notificaciones moderna
import Loading from './components/ui/Loading'; // <--- Nuestro spinner bonito

// Layout y Login (Carga normal porque son vitales)
import Layout from './layout/Layout';
import Login from './modules/auth/Login';

// --- LAZY LOADING (Carga diferida para velocidad extrema) ---
// Solo se descargan cuando el usuario hace clic en ellos
const ShopDashboard = React.lazy(() => import('./modules/products/ShopDashboard'));
const AddProductForm = React.lazy(() => import('./modules/products/AddProductForm'));
const RestockForm = React.lazy(() => import('./modules/products/RestockForm'));
const EditProductForm = React.lazy(() => import('./modules/products/EditProductForm'));
const CashboxHistoryList = React.lazy(() => import('./modules/products/CashboxHistoryList'));
const StatsDashboard = React.lazy(() => import('./modules/products/StatsDashboard'));
const SupplierPaymentForm = React.lazy(() => import('./modules/products/SupplierPaymentForm'));
const SupplierAccount = React.lazy(() => import('./modules/products/SupplierAccount'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Notificaciones globales (Arriba al centro, bonitas) */}
        <Toaster position="top-center" richColors />
        
        <Routes>
          {/* Ruta Pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Privadas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            {/* Envuelve todo en Suspense para mostrar Loading mientras carga cada módulo */}
            <Route index element={
              <Suspense fallback={<Loading />}>
                <ShopDashboard />
              </Suspense>
            } />
            
            <Route path="nuevo-producto" element={
              <Suspense fallback={<Loading />}>
                <AddProductForm />
              </Suspense>
            } />
            
            <Route path="reponer-stock" element={
              <Suspense fallback={<Loading />}>
                <RestockForm />
              </Suspense>
            } />
            
            <Route path="editar-producto/:id" element={
              <Suspense fallback={<Loading />}>
                <EditProductForm />
              </Suspense>
            } />
            
            <Route path="pago-proveedores" element={
              <Suspense fallback={<Loading />}>
                <SupplierPaymentForm />
              </Suspense>
            } />
            
            <Route path="cuenta-proveedores" element={
              <Suspense fallback={<Loading />}>
                <SupplierAccount />
              </Suspense>
            } />
            
            <Route path="historial-cajas" element={
              <Suspense fallback={<Loading />}>
                <CashboxHistoryList />
              </Suspense>
            } />
            
            <Route path="estadisticas" element={
              <Suspense fallback={<Loading />}>
                <StatsDashboard />
              </Suspense>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
