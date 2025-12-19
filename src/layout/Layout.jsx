import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, X, Home, Package, ShoppingCart, Truck, FileText, ClipboardList } from 'lucide-react';

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false); // Función auxiliar para cerrar al hacer click

  return (
    <div className="min-h-screen bg-gray-100 relative">
      
      {/* 1. Navbar Superior */}
      <nav className="bg-blue-800 text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={toggleMenu} className="p-1 hover:bg-blue-700 rounded transition">
            <Menu size={28} />
          </button>
          <h1 className="text-lg font-bold tracking-wide">Mi Kiosco</h1>
        </div>
      </nav>

      {/* 2. Menú Lateral (Drawer) */}
      
      {/* Overlay Oscuro (Fondo) */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={closeMenu}
        />
      )}

      {/* El Menú Deslizante */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Cabecera del Menú */}
        <div className="p-5 border-b flex justify-between items-center bg-blue-50">
          <span className="font-bold text-blue-900 text-lg">Menú Principal</span>
          <button onClick={closeMenu} className="text-gray-500 hover:text-red-500 transition">
            <X size={26} />
          </button>
        </div>
        
        {/* Lista de Enlaces */}
        <div className="py-4 overflow-y-auto h-full">
          <ul className="space-y-1 px-3">
            
            {/* SECCIÓN VENTAS */}
            <li>
              <Link to="/" onClick={closeMenu} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition font-medium">
                <Home size={20} /> Inicio / Caja (Vender)
              </Link>
            </li>

            <div className="my-4 border-t border-gray-100"></div>
            <p className="px-3 text-xs font-bold text-gray-400 uppercase mb-2">Gestión de Stock</p>

            <li>
              <Link to="/nuevo-producto" onClick={closeMenu} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition">
                <Package size={20} /> Cargar Nuevo Producto
              </Link>
            </li>
            <li>
              <Link to="/reponer-stock" onClick={closeMenu} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition">
                <ShoppingCart size={20} /> Reponer Mercadería
              </Link>
            </li>

            <div className="my-4 border-t border-gray-100"></div>
            <p className="px-3 text-xs font-bold text-gray-400 uppercase mb-2">Proveedores & Pagos</p>

            <li>
              <Link to="/pago-proveedores" onClick={closeMenu} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition">
                <Truck size={20} /> Registrar Pago
              </Link>
            </li>
            <li>
              <Link to="/cuenta-proveedores" onClick={closeMenu} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition">
                <ClipboardList size={20} /> Ver Ctas. Ctes.
              </Link>
            </li>

            <div className="my-4 border-t border-gray-100"></div>
             {/* Futuras secciones */}
            <li>
               <button className="w-full flex items-center gap-3 p-3 text-gray-400 cursor-not-allowed">
                 <FileText size={20} /> Reportes (Próximamente)
               </button>
            </li>

          </ul>
        </div>
      </aside>

      {/* 3. Contenido Principal (Aquí se carga cada pantalla) */}
      <main className="max-w-4xl mx-auto min-h-screen">
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout;
