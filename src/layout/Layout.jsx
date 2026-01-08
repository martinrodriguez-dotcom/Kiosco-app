import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { 
  Menu, X, Home, Package, ShoppingCart, Truck, 
  FileText, ClipboardList, LogOut, User 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // Importamos el contexto de autenticación

const Layout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Obtenemos los datos del usuario y la función logout
  const { user, userRole, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  // Función para obtener el nombre corto (sin @kiosco.com)
  const getUsername = () => {
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Usuario';
  };

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
        
        {/* Pequeño indicador de usuario en la barra superior (opcional) */}
        <div className="text-xs bg-blue-900 px-3 py-1 rounded-full flex items-center gap-2">
          <User size={14} />
          <span className="capitalize font-bold">{getUsername()}</span>
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
        
        {/* Lista de Enlaces (con padding inferior extra para no tapar el footer del usuario) */}
        <div className="py-4 overflow-y-auto h-[calc(100%-140px)]">
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
               <button className="w-full flex items-center gap-3 p-3 text-gray-400 cursor-not-allowed text-left">
                 <FileText size={20} /> Reportes (Próximamente)
               </button>
            </li>
          </ul>
        </div>

        {/* FOOTER DEL MENÚ: INFORMACIÓN DE USUARIO Y LOGOUT */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold uppercase text-sm shadow-sm">
                {user?.email?.substring(0,2) || 'US'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-gray-800 capitalize truncate w-32">
                   {getUsername()}
                </p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border border-gray-300 rounded px-1 inline-block bg-white">
                    {userRole || 'Cajero'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => { logout(); closeMenu(); }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition font-bold shadow-sm"
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
         </div>

      </aside>

      {/* 3. Contenido Principal */}
      <main className="max-w-4xl mx-auto min-h-screen">
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout;
