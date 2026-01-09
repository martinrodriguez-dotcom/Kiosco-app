import React, { useEffect, useState } from 'react';
import { getActiveSales, closeCashbox, checkActiveSession, openCashboxSession } from './productsService';
import { Calendar, CreditCard, Banknote, Download, X, AlertTriangle, CheckCircle, Lock, Play } from 'lucide-react';
import { jsPDF } from "jspdf";

const SalesHistory = () => {
  // Estados de Datos
  const [sales, setSales] = useState([]);
  const [session, setSession] = useState(null); // Datos de la sesión actual (cambio inicial, etc)
  const [loading, setLoading] = useState(true);
  
  // Estados de Interfaz (Apertura)
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [openingData, setOpeningData] = useState({
    cambioInicial: '',
    montoReservado: '',
    proveedorReserva: ''
  });

  // Estados de Interfaz (Cierre)
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [closingData, setClosingData] = useState(null);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setLoading(true);
    // 1. Chequear si la caja está abierta
    const sessionRes = await checkActiveSession();
    
    if (sessionRes.isOpen) {
      setIsSessionOpen(true);
      setSession(sessionRes.data);
      // 2. Si está abierta, cargar ventas activas
      const salesRes = await getActiveSales();
      if (salesRes.success) setSales(salesRes.data);
    } else {
      setIsSessionOpen(false);
      setSales([]);
    }
    setLoading(false);
  };

  // --- LÓGICA DE APERTURA (INICIAR DÍA) ---
  const handleOpenCashbox = async (e) => {
    e.preventDefault();
    
    // Validación simple
    if (openingData.cambioInicial === '') {
        alert("Por favor ingresa el cambio inicial (o 0 si no hay).");
        return;
    }

    const payload = {
        cambioInicial: parseFloat(openingData.cambioInicial) || 0,
        montoReservado: parseFloat(openingData.montoReservado) || 0,
        proveedorReserva: openingData.proveedorReserva || 'N/A'
    };

    setLoading(true);
    const res = await openCashboxSession(payload);
    
    if (res.success) {
        // Recargar la página para que detecte la sesión abierta
        initPage(); 
    } else {
        alert("Error al abrir la caja. Intenta nuevamente.");
        setLoading(false);
    }
  };

  // --- CÁLCULOS EN VIVO ---
  const totalVentasEfectivo = sales.filter(s => s.metodoPago === 'Efectivo').reduce((acc, curr) => acc + curr.total, 0);
  const totalVentasMP = sales.filter(s => s.metodoPago === 'Mercado Pago').reduce((acc, curr) => acc + curr.total, 0);
  
  // Totales Reales en el Cajón (Solo si hay sesión activa)
  const inicioCaja = session ? parseFloat(session.cambioInicial) : 0;
  const reservado = session ? parseFloat(session.montoReservado) : 0;
  
  // Dinero Físico TOTAL en el cajón = Cambio Inicial + Reserva + Ventas Efectivo
  const dineroFisicoEnCaja = inicioCaja + reservado + totalVentasEfectivo;

  // --- LÓGICA DE CIERRE ---
  const handleConfirmClose = async () => {
    // Preparamos el resumen final
    const finalData = {
      efectivoVentas: totalVentasEfectivo,
      mpVentas: totalVentasMP,
      totalVentas: totalVentasEfectivo + totalVentasMP,
      inicioCaja: inicioCaja,
      reservado: reservado,
      totalFisicoEsperado: dineroFisicoEnCaja, // Lo que debería haber contando todo
      salesSnapshot: [...sales],
      date: new Date()
    };

    const salesIds = sales.map(s => s.id);
    
    // Pasamos el ID de sesión para cerrarla en BD
    const res = await closeCashbox(salesIds, finalData, session?.id); 

    if (res.success) {
      setClosingData(finalData);
      setSales([]);
      setSession(null);
      setIsSessionOpen(false);
      setShowConfirmClose(false);
      setShowFinalReport(true);
    } else {
      alert("Error al cerrar la caja");
    }
  };

  // --- GENERAR PDF ---
  const generatePDF = (data) => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString();
    
    // Encabezado
    doc.setFillColor(30, 58, 138); // Azul
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Cierre de Caja", 105, 20, null, null, "center");
    doc.setFontSize(12);
    doc.text(`${fecha} - ${hora}`, 105, 30, null, null, "center");
    
    doc.setTextColor(0, 0, 0);
    let y = 50;

    // Sección 1: Dinero Físico (Lo importante)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CONTROL DE EFECTIVO (CAJÓN)", 20, y);
    y += 10;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`(+) Cambio Inicial: $${data.inicioCaja}`, 20, y); y += 8;
    if (data.reservado > 0) {
        doc.text(`(+) Reserva (${session?.proveedorReserva || 'Prov'}): $${data.reservado}`, 20, y); y += 8;
    }
    doc.text(`(+) Ventas Efectivo: $${data.efectivoVentas}`, 20, y); y += 10;
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`(=) TOTAL EN CAJÓN: $${data.totalFisicoEsperado}`, 20, y); 
    y += 20;

    // Sección 2: Otros
    doc.setFontSize(14);
    doc.text("OTROS MEDIOS", 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Mercado Pago: $${data.mpVentas}`, 20, y); y += 15;

    // Total Ventas (Ganancia Bruta del turno)
    doc.setDrawColor(0);
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL VENTAS NETAS: $${data.totalVentas}`, 20, y);

    doc.save(`Cierre_${fecha.replace(/\//g,'-')}.pdf`);
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-500 font-bold">Consultando estado de caja...</div>;

  // ----------------------------------------------------
  // VISTA 1: CAJA CERRADA (FORMULARIO DE APERTURA)
  // ----------------------------------------------------
  if (!isSessionOpen && !showFinalReport) {
    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl border border-blue-100 animate-fadeIn">
            <div className="text-center mb-8">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm">
                    <Play size={40} fill="currentColor" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Abrir Caja</h2>
                <p className="text-gray-500 mt-2">Inicia el turno ingresando los valores iniciales.</p>
            </div>

            <form onSubmit={handleOpenCashbox} className="space-y-6">
                
                {/* 1. Cambio (Caja Chica) */}
                <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                    <label className="block text-green-800 font-bold text-sm mb-2 flex items-center gap-2">
                        <Banknote size={20}/> Cambio Inicial (Suelto)
                    </label>
                    <input 
                        type="number" 
                        required
                        className="w-full p-3 rounded-lg border-2 border-green-200 focus:border-green-500 outline-none text-2xl font-bold text-gray-700 placeholder-green-200/50"
                        placeholder="$ 0"
                        value={openingData.cambioInicial}
                        onChange={e => setOpeningData({...openingData, cambioInicial: e.target.value})}
                    />
                    <p className="text-xs text-green-600 mt-2 font-medium">Dinero en billetes chicos para dar vuelto.</p>
                </div>

                {/* 2. Reserva Proveedor */}
                <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
                    <label className="block text-orange-800 font-bold text-sm mb-3 flex items-center gap-2">
                        <Lock size={20}/> Reserva Proveedor (Opcional)
                    </label>
                    
                    <div className="space-y-3">
                        <div>
                            <span className="text-xs text-orange-700 font-bold uppercase tracking-wide block mb-1">Monto a Guardar ($)</span>
                            <input 
                                type="number" 
                                className="w-full p-2 rounded-lg border border-orange-200 focus:border-orange-500 outline-none font-bold text-lg"
                                placeholder="$ 0"
                                value={openingData.montoReservado}
                                onChange={e => setOpeningData({...openingData, montoReservado: e.target.value})}
                            />
                        </div>
                        <div>
                            <span className="text-xs text-orange-700 font-bold uppercase tracking-wide block mb-1">Nombre Proveedor</span>
                            <input 
                                type="text" 
                                className="w-full p-2 rounded-lg border border-orange-200 focus:border-orange-500 outline-none"
                                placeholder="Ej: Coca Cola, Arcor..."
                                value={openingData.proveedorReserva}
                                onChange={e => setOpeningData({...openingData, proveedorReserva: e.target.value})}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-orange-600 mt-3 flex items-center gap-1 font-medium bg-orange-100 p-2 rounded-lg">
                        <AlertTriangle size={14}/> Este dinero NO es ganancia.
                    </p>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-xl shadow-lg transition transform active:scale-95 flex justify-center items-center gap-2">
                    CONFIRMAR APERTURA
                </button>
            </form>
        </div>
    );
  }

  // ----------------------------------------------------
  // VISTA 2: CAJA ABIERTA (DASHBOARD)
  // ----------------------------------------------------
  return (
    <div className="animate-fadeIn pb-24 px-1">
      
      {/* HEADER: Estado del Dinero Inicial */}
      {session && (
        <div className="bg-gray-800 text-white p-5 rounded-2xl shadow-lg mb-6 flex flex-wrap justify-between items-center gap-4">
           <div className="flex gap-6">
               <div>
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Cambio Inicial</p>
                  <p className="font-bold text-xl">${session.cambioInicial}</p>
               </div>
               
               {session.montoReservado > 0 && (
                 <div>
                    <p className="text-orange-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <Lock size={10}/> Reservado ({session.proveedorReserva})
                    </p>
                    <p className="font-bold text-xl text-orange-200">${session.montoReservado}</p>
                 </div>
               )}
           </div>

            <div className="bg-gray-700 px-4 py-2 rounded-xl text-right border border-gray-600">
                <p className="text-green-400 text-[10px] uppercase font-bold tracking-wider mb-1">Total Físico en Cajón</p>
                <p className="font-black text-3xl text-white tracking-tight">${dineroFisicoEnCaja}</p>
            </div>
        </div>
      )}

      {/* TÍTULO Y BOTÓN CERRAR */}
      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600"/> Movimientos del Día
        </h2>
        <button 
          onClick={() => setShowConfirmClose(true)}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 border border-red-100 transition text-sm flex items-center gap-2 shadow-sm"
        >
          <X size={18} /> Cerrar Caja
        </button>
      </div>

      {/* RESUMEN VENTAS */}
      <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
            <span className="text-gray-400 text-xs uppercase font-bold flex items-center gap-1"><Banknote size={14}/> Ventas Efectivo</span>
            <p className="text-3xl font-black text-gray-800">${totalVentasEfectivo}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-24">
            <span className="text-blue-400 text-xs uppercase font-bold flex items-center gap-1"><CreditCard size={14}/> Ventas MP</span>
            <p className="text-3xl font-black text-blue-600">${totalVentasMP}</p>
          </div>
      </div>

      {/* LISTA MOVIMIENTOS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[200px]">
        {sales.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <Calendar size={30} className="text-gray-300"/>
                </div>
                <p className="text-gray-400 font-medium">Caja abierta.</p>
                <p className="text-xs text-gray-400">Esperando primeras ventas...</p>
            </div>
        ) : (
            sales.map((sale) => (
            <div key={sale.id} className="p-4 border-b last:border-0 flex justify-between items-center hover:bg-gray-50 transition">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${sale.metodoPago === 'Efectivo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {sale.metodoPago}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                            {new Date(sale.createdAt.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500">
                        {sale.items.length} productos
                    </p>
                </div>
                <span className="font-bold text-gray-800 text-lg">${sale.total}</span>
            </div>
            ))
        )}
      </div>

      {/* MODAL CONFIRMACIÓN CIERRE */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-800">¿Cerrar Caja?</h3>
                  <button onClick={() => setShowConfirmClose(false)} className="bg-gray-100 p-1 rounded-full"><X size={20}/></button>
              </div>
              
              <p className="text-gray-500 text-sm mb-6">
                Estás a punto de finalizar el turno. Verifica que el dinero físico coincida.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                <div className="flex justify-between mb-2 text-sm">
                    <span className="text-gray-500">Debe haber en cajón:</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-3xl font-black text-gray-800">${dineroFisicoEnCaja}</span>
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold uppercase">Contar Esto</span>
                </div>
                <div className="mt-2 text-xs text-gray-400 border-t pt-2 flex gap-2">
                    <span>Incluye: Cambio + Reservas + Ventas Efec.</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setShowConfirmClose(false)} className="bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50">Cancelar</button>
                 <button onClick={handleConfirmClose} className="bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg">Confirmar Cierre</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL ÉXITO FINAL */}
      {showFinalReport && closingData && (
        <div className="fixed inset-0 bg-blue-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
           <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl transform scale-105">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                 <CheckCircle size={40} className="text-green-600"/>
              </div>
              <h3 className="text-3xl font-black text-gray-800 mb-2">¡Turno Cerrado!</h3>
              <p className="text-gray-500 text-sm mb-8">La caja ha sido guardada correctamente.</p>
              
              <button onClick={() => generatePDF(closingData)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 mb-4 shadow-lg hover:bg-blue-700 transition">
                 <Download size={22}/> Descargar Reporte PDF
              </button>
              
              <button onClick={() => { setShowFinalReport(false); initPage(); }} className="text-gray-400 text-sm hover:text-gray-600 hover:underline">
                 Volver a la pantalla de Apertura
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default SalesHistory;
