import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, updateProduct } from './productsService';
import { calculateProductPricing } from './productLogic';

const EditProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const loadData = async () => {
      const res = await getProductById(id);
      if (res.success) {
        setFormData(res.data);
      } else {
        alert("Producto no encontrado");
        navigate('/');
      }
      setLoading(false);
    };
    loadData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Recalcular precios si se toca el botón de "Recalcular"
  const handleRecalculate = () => {
    const calculos = calculateProductPricing(formData);
    setFormData({
      ...formData,
      costoUnitario: calculos.costoUnitario,
      precioVenta: calculos.precioVenta
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProduct(id, formData);
    if (result.success) {
      alert("Producto actualizado");
      navigate('/');
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Editar Producto</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        
        <div>
          <label className="block text-sm font-bold">Nombre</label>
          <input className="w-full border p-2 rounded" name="nombre" value={formData.nombre} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold">Costo Bulto</label>
            <input type="number" className="w-full border p-2 rounded" name="costoBulto" value={formData.costoBulto} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-bold">Unidades x Bulto</label>
            <input type="number" className="w-full border p-2 rounded" name="cantidadBulto" value={formData.cantidadBulto} onChange={handleChange} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold">Margen (%)</label>
          <input type="number" className="w-full border p-2 rounded" name="margenGanancia" value={formData.margenGanancia} onChange={handleChange} />
        </div>

        <button type="button" onClick={handleRecalculate} className="text-sm text-blue-600 underline mb-4">
          Recalcular Precio Venta basado en nuevos costos
        </button>

        <div className="bg-gray-100 p-3 rounded text-center">
            <label className="block text-sm font-bold text-gray-500">Precio Venta Actual</label>
            <input type="number" className="w-full bg-transparent text-center font-bold text-xl" name="precioVenta" value={formData.precioVenta} onChange={handleChange} />
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold">Guardar Cambios</button>
      </form>
    </div>
  );
};

export default EditProductForm;
