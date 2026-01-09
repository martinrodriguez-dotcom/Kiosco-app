import React, { useState, useEffect } from 'react';
import { calculateProductPricing } from './productLogic';
import { createProduct } from './productsService';
import { Camera, ScanBarcode } from 'lucide-react'; // Iconos nuevos
import BarcodeScanner from './BarcodeScanner'; // Importamos el componente nuevo

const AddProductForm = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    codigoBarras: '',
    costoBulto: 0,
    cantidadBulto: 1,     
    cantidadComprada: 0,  
    margenGanancia: 40,
    tieneIVA: true,
  });

  const [preciosCalculados, setPreciosCalculados] = useState({ costoUnitario: 0, precioVenta: 0 });
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false); // Estado para mostrar/ocultar cámara

  useEffect(() => {
    const calculos = calculateProductPricing(formData);
    setPreciosCalculados(calculos);
  }, [formData.costoBulto, formData.cantidadBulto, formData.margenGanancia, formData.tieneIVA]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Manejo especial para lector USB (Prevenir envío al dar Enter)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Evita que el formulario se envíe solo
      // Opcional: Podrías mover el foco al siguiente campo aquí si quisieras
    }
  };

  // Cuando la cámara detecta un código
  const handleScanSuccess = (code) => {
    setFormData(prev => ({ ...prev, codigoBarras: code }));
    setShowCamera(false); // Cerramos la cámara
    // Opcional: Sonido de "bip"
    new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3').play().catch(e => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dataToSave = {
      ...formData,
      precioVenta: preciosCalculados.precioVenta,
      costoUnitario: preciosCalculados.costoUnitario
    };

    const result = await createProduct(dataToSave);
    
    if (result.success) {
      alert("¡Producto guardado correctamente!");
      setFormData({ ...formData, nombre: '', codigoBarras: '', costoBulto: 0, cantidadComprada: 0 });
    } else {
      alert("Error al guardar");
    }
    setLoading(false);
  };

  const inputClass = "w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="max-w-2xl mx-auto mt-4 p-4 pb-24">
      
      {/* RENDERIZADO CONDICIONAL DE LA CÁMARA */}
      {showCamera && (
        <BarcodeScanner 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">📦 Cargar Nuevo Producto</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Nombre */}
          <div>
            <label className={labelClass}>Nombre del Producto</label>
            <input 
              required 
              type="text" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              className={inputClass} 
              placeholder="Ej: Galletitas Oreo" 
            />
          </div>
            
          {/* SECCIÓN CÓDIGO DE BARRAS MEJORADA */}
          <div>
            <label className={labelClass}>Código de Barras</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ScanBarcode className="text-gray-400" size={20} />
                </div>
                <input 
                  type="text" 
                  name="codigoBarras" 
                  value={formData.codigoBarras} 
                  onChange={handleChange} 
                  onKeyDown={handleKeyDown} // Para lector USB
                  className={`${inputClass} pl-10`} 
                  placeholder="Escanea con pistola o cámara..." 
                  autoFocus // Al entrar, el cursor va aquí listo para la pistola USB
                />
              </div>
              
              <button 
                type="button" // Importante para que no envíe el form
                onClick={() => setShowCamera(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg border border-gray-300 transition"
                title="Escanear con Cámara"
              >
                <Camera size={24} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              * Para pistola USB: Solo haz clic en el campo y dispara.
            </p>
          </div>

          {/* SECCIÓN COSTOS */}
          <div className="col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-blue-800 font-bold mb-3 text-sm uppercase">Definición de Costos</h3>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className={labelClass}>Costo del Bulto ($)</label>
                      <input required type="number" name="costoBulto" value={formData.costoBulto} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                      <label className={labelClass}>Unidades por Bulto</label>
                      <input required type="number" name="cantidadBulto" value={formData.cantidadBulto} onChange={handleChange} className={inputClass} />
                  </div>
              </div>
              <div className="mt-3 text-right">
                  <span className="text-blue-800 text-sm">Costo unitario: </span>
                  <span className="font-bold text-blue-900">${preciosCalculados.costoUnitario}</span>
              </div>
          </div>

          {/* SECCIÓN STOCK */}
          <div>
            <label className={labelClass}>Unidades Totales Compradas (Stock)</label>
            <input required type="number" name="cantidadComprada" value={formData.cantidadComprada} onChange={handleChange} className={inputClass} placeholder="Ej: 24" />
          </div>

          <div>
            <label className={labelClass}>Margen Ganancia (%)</label>
            <input required type="number" name="margenGanancia" value={formData.margenGanancia} onChange={handleChange} className={inputClass} />
          </div>

          <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
            <input type="checkbox" name="tieneIVA" checked={formData.tieneIVA} onChange={handleChange} id="iva" className="h-5 w-5 text-blue-600" />
            <label htmlFor="iva" className="text-sm font-medium text-gray-700">El precio incluye IVA (21%)</label>
          </div>

          <div className="bg-green-50 p-6 rounded-xl border-2 border-green-100 flex flex-col items-center justify-center">
            <span className="text-green-600 font-semibold uppercase tracking-wider text-xs">Precio de Venta Sugerido</span>
            <span className="text-5xl font-black text-green-700 mt-2">${preciosCalculados.precioVenta}</span>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white font-bold text-lg p-4 rounded-xl hover:bg-blue-700 transition shadow-lg">
            {loading ? 'Guardando...' : '✅ Guardar Producto'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductForm;
