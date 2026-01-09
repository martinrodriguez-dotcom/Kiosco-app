import React, { useEffect, useState } from 'react';
import { getSalesForStats } from './productsService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, Award } from 'lucide-react';

const StatsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({ totalRevenue: 0, totalSales: 0, avgTicket: 0 });
  const [chartData, setChartData] = useState([]); // Datos para gráfico de barras
  const [paymentData, setPaymentData] = useState([]); // Datos para torta
  const [topProducts, setTopProducts] = useState([]); // Top 5

  useEffect(() => {
    processData();
  }, []);

  const processData = async () => {
    const res = await getSalesForStats();
    if (res.success) {
      const sales = res.data;
      
      // 1. Calcular KPIs Globales
      const totalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0);
      const totalSales = sales.length;
      const avgTicket = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
      setKpi({ totalRevenue, totalSales, avgTicket });

      // 2. Preparar Datos Gráfico Barras (Ventas por Día)
      const salesByDate = {};
      sales.forEach(sale => {
        const date = new Date(sale.createdAt.seconds * 1000).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        if (!salesByDate[date]) salesByDate[date] = 0;
        salesByDate[date] += sale.total;
      });

      const formattedChartData = Object.keys(salesByDate).map(date => ({
        name: date,
        total: salesByDate[date]
      }));
      setChartData(formattedChartData);

      // 3. Preparar Datos Gráfico Torta (Métodos de Pago)
      let efectivo = 0;
      let mp = 0;
      sales.forEach(s => {
        if(s.metodoPago === 'Efectivo') efectivo += s.total;
        else mp += s.total;
      });
      setPaymentData([
        { name: 'Efectivo', value: efectivo },
        { name: 'Mercado Pago', value: mp }
      ]);

      // 4. Calcular Top 5 Productos
      const productCount = {};
      sales.forEach(sale => {
        sale.items.forEach(item => {
          if (!productCount[item.nombre]) productCount[item.nombre] = 0;
          productCount[item.nombre] += item.cantidadVenta;
        });
      });
      
      // Convertir a array y ordenar
      const sortedProducts = Object.keys(productCount)
        .map(key => ({ name: key, count: productCount[key] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Solo los primeros 5
      
      setTopProducts(sortedProducts);
    }
    setLoading(false);
  };

  // Colores para gráficos
  const COLORS = ['#22c55e', '#3b82f6']; // Verde (Efec), Azul (MP)

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Calculando estadísticas...</div>;

  return (
    <div className="pb-24 animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6 p-2">
         <div className="bg-purple-100 p-3 rounded-full text-purple-700">
            <TrendingUp size={24} />
         </div>
         <div>
            <h2 className="text-2xl font-bold text-gray-800">Estadísticas</h2>
            <p className="text-sm text-gray-500">Rendimiento de los últimos 30 días</p>
         </div>
      </div>

      {/* 1. TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
               <p className="text-gray-400 text-xs font-bold uppercase">Ingresos Totales</p>
               <p className="text-2xl font-black text-gray-800">${kpi.totalRevenue}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full text-green-600"><DollarSign/></div>
         </div>
         
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
               <p className="text-gray-400 text-xs font-bold uppercase">Ventas Realizadas</p>
               <p className="text-2xl font-black text-gray-800">{kpi.totalSales}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-blue-600"><ShoppingBag/></div>
         </div>

         <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
               <p className="text-gray-400 text-xs font-bold uppercase">Ticket Promedio</p>
               <p className="text-2xl font-black text-gray-800">${kpi.avgTicket}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-full text-orange-600"><TrendingUp/></div>
         </div>
      </div>

      {/* 2. GRÁFICOS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
         
         {/* BARRAS: Ventas por día */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-6">Tendencia de Ventas (Diario)</h3>
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="name" tick={{fontSize: 10}} />
                     <YAxis tick={{fontSize: 10}} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`$${value}`, 'Venta']}
                     />
                     <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* TORTA: Métodos de Pago */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-6">Distribución de Pagos</h3>
            <div className="h-64 flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {paymentData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip formatter={(value) => [`$${value}`, 'Total']} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
               <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div> Efectivo
               </div>
               <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div> MP
               </div>
            </div>
         </div>
      </div>

      {/* 3. TOP PRODUCTOS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Award className="text-yellow-500"/> Top 5 Productos Más Vendidos
         </h3>
         <div className="space-y-4">
            {topProducts.map((prod, index) => (
               <div key={index} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                     <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                        #{index + 1}
                     </span>
                     <span className="font-medium text-gray-800">{prod.name}</span>
                  </div>
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                     {prod.count} u. vendidas
                  </span>
               </div>
            ))}
            {topProducts.length === 0 && <p className="text-gray-400 text-sm">No hay datos suficientes.</p>}
         </div>
      </div>

    </div>
  );
};

export default StatsDashboard;
