import React, { useState, useEffect } from 'react';
import { getProducts, updateProductStock } from './productsService';
import { calculateProductPricing } from './productLogic'; // Reutilizamos tu lógica matemática

const RestockForm = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Datos nuevos a ingresar
  const [newData, setNewData] = useState({
    costoBulto: '',
    cantidadBulto: '',
    cantidadComprada: ''
  });

  // Cargar productos para el buscador
  useEffect(() => {
    const load = async () => {
      const res = await getProducts();
      if (res.success) setProducts(res.data);
    };
    load();
  }, []);

  // Filtrar productos
  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.codigoBarras && p.codigoBarras.includes(searchTerm))
  );

  const handleSelect = (prod) => {
    setSelectedProduct(prod);
    setSearchTerm(''); // Limpiar busqueda
    // Pre-cargar valores existentes para facilitar
    setNewData({
      costoBulto: prod.costoBulto,
      cantidadBulto: prod.cantidadBulto,
      cantidadComprada: 1
    });
  };

  const handleReponer = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // 1. Calcular nuevo stock
    const unidadesNuevas = parseInt(newData.cantidadBulto) * parseInt(newData.cantidadComprada);
    const nuevoStockTotal = parseInt(selectedProduct.stockActual || 0) + unidadesNuevas;

    // 2. Recalcular precios (Si el costo del bulto cambió, el precio de venta debe cambiar)
    // Usamos tu función matemática existente
    const preciosNuevos = calculateProductPricing({
      costoBulto: newData.costoBulto,
      cantidadBulto: newData.cantidadBulto,
      margenGanancia: selectedProduct.margenGanancia, // Mantenemos el margen original
      tieneIVA: selectedProduct.tieneIVA
    });

    // 3. Preparar objeto para actualizar
    const updatePayload = {
      stockActual: nuevoStockTotal,
      costoBulto: parseFloat(newData.costoBulto),
      cantidadBulto: parseInt(newData.cantidadBulto),
      costoUnitario: parseFloat(preciosNuevos.costoUnitario),
      precioVenta: preciosNuevos.precioVenta
    };

    // 4. Guardar en Firebase
    const result = await updateProductStock(selectedProduct.id, updatePayload);

    if (result.success) {
      alert(`Stock actualizado. Nuevo total: ${nuevoStockTotal} unidades.`);
      setSelectedProduct(null); // Volver al buscador
      setNewData({ costoBulto: '', cantidadBulto: '', cantidadComprada: '' });
    } else {
      alert("Error al actualizar");
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Reponer Mercadería</h2>

      {/* Buscador */}
      {!selectedProduct && (
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Buscar por nombre o código..." 
            className="w-full p-3 border rounded shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <div className="bg-white border mt-1 rounded max-h-60 overflow-y-auto">
              {filteredProducts.map(p => (
                <div key={p.id} onClick={() => handleSelect(p)} className="p-3 hover:bg-blue-50 cursor-pointer border-b">
                  <div className="font-bold">{p.nombre}</div>
                  <div className="text-xs text-gray-500">Stock actual: {p.stockActual}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulario de Reposición */}
      {selectedProduct && (
        <form onSubmit={handleReponer} className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-blue-800">{selectedProduct.nombre}</h3>
            <button type="button" onClick={() => setSelectedProduct(null)} className="text-sm text-red-500 underline">Cambiar</button>
          </div>

          <div>
            <label className="block text-sm font-medium">Costo NUEVO del Bulto ($)</label>
            <input required type="number" value={newData.costoBulto} onChange={(e) => setNewData({...newData, costoBulto: e.target.value})} className="w-full border p-2 rounded" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Unidades x Bulto</label>
              <input required type="number" value={newData.cantidadBulto} onChange={(e) => setNewData({...newData, cantidadBulto: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">Bultos Comprados</label>
              <input required type="number" value={newData.cantidadComprada} onChange={(e) => setNewData({...newData, cantidadComprada: e.target.value})} className="w-full border p-2 rounded bg-yellow-50" />
            </div>
          </div>

          <div className="bg-gray-100 p-3 rounded text-sm text-center">
            Se agregarán <strong>{newData.cantidadBulto * newData.cantidadComprada}</strong> unidades al stock.
          </div>

          <button type="submit" className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">
            Confirmar y Actualizar Precio
          </button>
        </form>
      )}
    </div>
  );
};

export default RestockForm;
