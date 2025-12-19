import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Menu, X, Home, BarChart2, History, Package } from 'lucide-react';

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* 1. Navbar Superior */}
      <nav className="bg-blue-700 text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={toggleMenu} className="p-1 hover:bg-blue-600 rounded">
            <Menu size={28} />
          </button>
          <h1 className="text-lg font-bold">Mi Kiosco</h1>
        </div>
      </nav>

      {/* 2. Menú Lateral (Drawer) */}
      {/* Fondo oscuro (Overlay) */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMenu}
        />
      )}

      {/* El Menú en sí */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b flex justify-between items-center bg-blue-50">
          <span className="font-bold text-blue-900">Menú</span>
          <button onClick={toggleMenu} className="text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <ul className="p-4 space-y-2">
          <li>
            <Link to="/" onClick={toggleMenu} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 rounded-lg">
              <Home size={20} /> Inicio / Productos
            </Link>
          </li>
          <li>
            <Link to="/nuevo-producto" onClick={toggleMenu} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-blue-50 rounded-lg">
              <Package size={20} /> Cargar Producto
            </Link>
          </li>
          {/* Secciones Futuras */}
          <li className="pt-4 border-t border-gray-100">
            <span className="text-xs uppercase text-gray-400 font-bold px-3">Próximamente</span>
          </li>
          <li>
            <button className="w-full flex items-center gap-3 p-3 text-gray-400 cursor-not-allowed">
              <BarChart2 size={20} /> Estadísticas
            </button>
          </li>
          <li>
            <button className="w-full flex items-center gap-3 p-3 text-gray-400 cursor-not-allowed">
              <History size={20} /> Historial Caja
            </button>
          </li>
        </ul>
      </aside>

      {/* 3. Contenido Principal */}
      <main className="max-w-4xl mx-auto">
        {/* Aquí se renderizará la ruta seleccionada (AddProduct o List) */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout;
