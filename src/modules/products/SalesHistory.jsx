import React, { useEffect, useState } from 'react';
import { getActiveSales, closeCashbox, checkActiveSession, openCashboxSession, getPaymentsBySession } from './productsService';
import { Calendar, CreditCard, Banknote, Download, X, CheckCircle, Lock, Play, Truck, PlusCircle } from 'lucide-react';
import { jsPDF } from "jspdf";
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Importante para saber quién cierra

const SalesHistory = () => {
  const { user } = useAuth(); // Obtenemos el usuario logueado
  
  // Estados de Datos
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de Interfaz
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  const [openingData, setOpeningData] = useState({
    cambioInicial: '',
    montoReservado: '',
    proveedorReserva: ''
  });
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [closingData, setClosingData] = useState(null);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    setLoading(true);
    // 1. Chequear si hay caja abierta
    const sessionRes = await checkActiveSession();
    
    if (sessionRes.isOpen) {
      setIsSessionOpen(true);
      setSession(sessionRes.data);
      
      // 2. Cargar Ventas activas
      const salesRes = await getActiveSales();
      if (salesRes.success) setSales(salesRes.data);

      // 3. Cargar Pagos realizados en esta sesión
      const payRes = await getPaymentsBySession(sessionRes.data.id);
      if (payRes.success) setPayments(payRes.data);

    } else {
      setIsSessionOpen(false);
      setSales([]);
      setPayments([]);
    }
    setLoading(false);
  };

  // --- APERTURA DE CAJA ---
  const handleOpenCashbox = async (e) => {
    e.preventDefault();
    if (openingData.cambioInicial === '') {
        alert("Por favor ingresa el cambio inicial (o 0).");
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
        initPage(); 
    } else {
        alert("Error al abrir la caja.");
        setLoading(false);
    }
  };

  // --- CÁLCULOS MATEMÁTICOS (FORMULA NUEVA) ---
  const totalVentasEfectivo = sales.filter(s => s.metodoPago === 'Efectivo').reduce((acc, curr) => acc + curr.total, 0);
  const totalVentasMP = sales.filter(s => s.metodoPago === 'Mercado Pago').reduce((acc, curr) => acc + curr.total, 0);
  
  // Sumamos pagos realizados en Efectivo
  const totalPagosEfectivo = payments.filter(p => p.metodo === 'Efectivo').reduce((acc, curr) => acc + curr.monto, 0);

  const inicioCaja = session ? parseFloat(session.cambioInicial) : 0;
  const reservadoInicial = session ? parseFloat(session.montoReservado) : 0;
  
  // 1. SUBTOTAL FÍSICO (Lo que hay en el cajón de billetes)
  // Fórmula: (Cambio + Reserva + VentasEfec) - PagosEfec
  const subTotalFisico = (inicioCaja + reservadoInicial + totalVentasEfectivo) - totalPagosEfectivo;

  // 2. TOTAL GENERAL (La suma de todo el valor generado, físico + virtual)
  const totalGeneral = subTotalFisico + totalVentasMP;

  // Visualización de reserva restante (para saber si me gasté la reserva)
  const reservaRestante = Math.max(0, reservadoInicial - totalPagosEfectivo);


  // --- CIERRE DE CAJA ---
  const handleConfirmClose = async () => {
    // Preparamos el objeto con TODOS los datos calculados
    const finalData = {
      inicioCaja,
      reservadoInicial,
      efectivoVentas: totalVentasEfectivo,
      pagosRealizados: totalPagosEfectivo,
      subTotalFisico, // El dinero en cajón
      mpVentas: totalVentasMP,
      totalGeneral,   // El total final
      
      closedBy: user?.email || 'Desconocido', // Guardamos quién cerró
      salesSnapshot: [...sales],
      paymentsSnapshot: [...payments],
      date: new Date()
    };

    const salesIds = sales.map(s => s.id);
    // Enviamos a Firebase
    const res = await closeCashbox(salesIds, finalData, session?.id); 

    if (res.success) {
      setClosingData(finalData);
      setSales([]);
      setPayments([]);
      setSession(null);
      setIsSessionOpen(false);
      setShowConfirmClose(false);
      setShowFinalReport(true);
    } else {
      alert("Error al cerrar la caja. Intente nuevamente.");
    }
  };

  // --- GENERACIÓN DE PDF (ESTRUCTURA SOLICITADA) ---
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
    
    doc.setFontSize(10);
    doc.text(`Responsable: ${data.closedBy}`, 105, 30, null, null, "center");
    doc.text(`${fecha} - ${hora}`, 105, 35, null, null, "center");
    
    doc.setTextColor(0, 0, 0);
    let y = 60;
    
    // Helper para filas alineadas
    const addRow = (label, value, isBold = false, isRed = false, isTotal = false) => {
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setFontSize(isTotal ? 14 : 12);
        doc.setTextColor(isRed ? 200 : 0, 0, 0);
        doc.text(label, 20, y);
        doc.text(`$ ${parseFloat(value).toFixed(2)}`, 190, y, null, null, "right");
        y += isTotal ? 15 : 10;
        doc.setTextColor(0,0,0); // Reset color
    };

    // SECCIÓN 1: CAJÓN FÍSICO
    doc.setFontSize(14); 
    doc.setFont("helvetica", "bold"); 
    doc.text("BALANCE DE EFECTIVO (CAJÓN)", 20, y); 
    y += 10;
    doc.setDrawColor(200);
    doc.line(20, y-2, 190, y-2);
    
    addRow("(+) Cambio Inicial", data.inicioCaja);
    addRow("(+) Reserva Proveedores", data.reservadoInicial);
    addRow("(+) Ventas Efectivo", data.efectivoVentas);
    addRow("(-) Pagos a Proveedores", data.pagosRealizados, false, true); // Rojo
    
    doc.line(20, y-2, 190, y-2);
    // Subtotal Físico
    addRow("(=) SUBTOTAL CAJA (FÍSICO)", data.subTotalFisico, true, false, true);

    // SECCIÓN 2: TOTAL GENERAL
    addRow("(+) Ventas Mercado Pago", data.mpVentas);
    
    // Fondo gris para el total final
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y-5, 180, 15, 'F');
    y += 5;
    
    doc.setTextColor(0, 0, 150); // Azul oscuro
    addRow("(=) TOTAL GENERAL DE CAJA", data.totalGeneral, true, false, true);

    // Pie de firma
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("__________________________", 105, 250, null, null, "center");
    doc.text(`Firma: ${data.closedBy.split('@')[0]}`, 105, 258, null, null, "center");

    doc.save(`Cierre_${fecha.replace(/\//g,'-')}.pdf`);
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-gray-500 font-bold">Cargando datos de caja...</div>;

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
                <div className="bg-green-50 p-5 rounded-xl border border-green-200">
                    <label className="block text-green-800 font-bold text-sm mb-2 flex items-center gap-2">
                        <Banknote size={20}/> Cambio Inicial
                    </label>
                    <input 
                        type="number" 
                        required
                        className="w-full p-3 rounded-lg border-2 border-green-200 focus:border-green-500 outline-none text-2xl font-bold text-gray-700 placeholder-green-200/50"
                        placeholder="$ 0"
                        value={openingData.cambioInicial}
                        onChange={e => setOpeningData({...openingData, cambioInicial: e.target.value})}
                    />
                </div>

                <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
                    <label className="block text-orange-800 font-bold text-sm mb-3 flex items-center gap-2">
                        <Lock size={20}/> Reserva Proveedor (Opcional)
                    </label>
                    <div className="space-y-3">
                        <input 
                            type="number" 
                            className="w-full p-2 rounded-lg border border-orange-200 outline-none font-bold text-lg"
                            placeholder="Monto ($)"
                            value={openingData.montoReservado}
                            onChange={e => setOpeningData({...openingData, montoReservado: e.target.value})}
                        />
                        <input 
                            type="text" 
                            className="w-full p-2 rounded-lg border border-orange-200 outline-none"
                            placeholder="Nombre Proveedor"
                            value={openingData.proveedorReserva}
                            onChange={e => setOpeningData({...openingData, proveedorReserva: e.target.value})}
                        />
                    </div>
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
      
      {/* HEADER: Estado del Dinero */}
      {session && (
        <div className="bg-gray-800 text-white p-5 rounded-2xl shadow-lg mb-6 flex flex-wrap justify-between items-center gap-4">
           <div className="flex gap-6">
               <div>
                  <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Cambio Inicial</p>
                  <p className="font-bold text-xl">${session.cambioInicial}</p>
               </div>
               
               {reservadoInicial > 0 && (
                 <div>
                    <p className="text-orange-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                        <Lock size={10}/> Reserva ({session.proveedorReserva})
                    </p>
                    <p className={`font-bold text-xl ${reservaRestante === 0 ? 'text-gray-500 line-through' : 'text-orange-200'}`}>
                        ${reservaRestante} <span className="text-[10px] text-gray-400 font-normal">/ ${reservadoInicial}</span>
                    </p>
                 </div>
               )}
           </div>

            <div className="bg-gray-700 px-4 py-2 rounded-xl text-right border border-gray-600">
                <p className="text-green-400 text-[10px] uppercase font-bold tracking-wider mb-1">En Cajón (Físico)</p>
                <p className="font-black text-3xl text-white tracking-tight">${subTotalFisico}</p>
            </div>
        </div>
      )}

      {/* BOTONES DE ACCIÓN */}
      <div className="flex justify-between items-center mb-4 px-1">
         <div className="flex gap-2">
            <Link to="/pago-proveedores" className="bg-orange-100 text-orange-700 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-200 transition">
                <PlusCircle size={16}/> Pagar Proveedor
            </Link>
         </div>
         <button 
          onClick={() => setShowConfirmClose(true)}
          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 border border-red-100 text-sm flex items-center gap-2 shadow-sm"
        >
          <X size={16} /> Cerrar Caja
        </button>
      </div>

      {/* SECCIÓN PAGOS A PROVEEDORES (Visualización en lista) */}
      {payments.length > 0 && (
         <div className="mb-6 animate-fadeIn">
            <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm">
                <Truck size={16} className="text-orange-500"/> Pagos Realizados (Salidas)
            </h3>
            <div className="bg-orange-50 border border-orange-100 rounded-xl overflow-hidden shadow-sm">
                {payments.map(p => (
                    <div key={p.id} className="p-3 border-b border-orange-100 last:border-0 flex justify-between items-center text-sm">
                        <div>
                            <span className="font-bold text-orange-900 block">{p.proveedor}</span>
                            <span className="text-xs text-orange-600/70">{p.concepto || 'Sin concepto'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                             <span className="text-[10px] font-bold text-orange-600 bg-orange-200/50 px-2 py-0.5 rounded uppercase">{p.metodo}</span>
                             <span className="font-black text-red-600">-${p.monto}</span>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      )}

      {/* SECCIÓN VENTAS (Visualización en lista) */}
      <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2 text-sm">
        <Calendar size={16} className="text-blue-500"/> Ventas del día (Entradas)
      </h3>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[150px]">
        {sales.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                <p className="text-gray-400 font-medium text-sm">No hay ventas registradas aún.</p>
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
                    <p className="text-xs text-gray-500">{sale.items.length} productos</p>
                </div>
                <span className="font-bold text-gray-800 text-lg">${sale.total}</span>
            </div>
            ))
        )}
      </div>

      {/* --- MODAL CONFIRMACIÓN DE CIERRE --- */}
      {showConfirmClose && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800 text-center w-full">Resumen de Cierre</h3>
                  <button onClick={() => setShowConfirmClose(false)} className="absolute right-6"><X size={20} className="text-gray-400"/></button>
              </div>
              
              {/* Tabla de resumen idéntica al PDF */}
              <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 text-sm space-y-2">
                 <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 border-b pb-1">Dinero Físico (Cajón)</h4>
                 
                 <div className="flex justify-between text-gray-600">
                    <span>(+) Cambio Inicial:</span> <span>${inicioCaja}</span>
                 </div>
                 <div className="flex justify-between text-gray-600">
                    <span>(+) Reserva Prov:</span> <span>${reservadoInicial}</span>
                 </div>
                 <div className="flex justify-between text-gray-600">
                    <span>(+) Ventas Efectivo:</span> <span>${totalVentasEfectivo}</span>
                 </div>
                 <div className="flex justify-between text-red-600 font-medium bg-red-50 p-1 rounded -mx-1">
                    <span>(-) Pagos Prov:</span> <span>-${totalPagosEfectivo}</span>
                 </div>
                 
                 <div className="border-t border-gray-300 my-2"></div>
                 <div className="flex justify-between font-bold text-gray-800 bg-gray-200 p-2 rounded -mx-2">
                    <span>(=) SUBTOTAL CAJA:</span> <span>${subTotalFisico}</span>
                 </div>
                 
                 <h4 className="text-xs font-bold text-gray-400 uppercase mt-4 mb-2 border-b pb-1">Total General</h4>
                 <div className="flex justify-between pt-1">
                    <span>(+) Ventas MP:</span> <span className="text-blue-600 font-bold">${totalVentasMP}</span>
                 </div>
                 
                 <div className="border-t border-gray-300 my-2"></div>
                 <div className="flex justify-between font-black text-xl text-blue-900">
                    <span>TOTAL GENERAL:</span> <span>${totalGeneral}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setShowConfirmClose(false)} className="bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50">Cancelar</button>
                 <button onClick={handleConfirmClose} className="bg-blue-900 text-white py-3 rounded-xl font-bold hover:bg-blue-800 shadow-lg">Confirmar Cierre</button>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL ÉXITO FINAL --- */}
      {showFinalReport && closingData && (
        <div className="fixed inset-0 bg-blue-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
           <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl transform scale-105">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                 <CheckCircle size={40} className="text-green-600"/>
              </div>
              <h3 className="text-3xl font-black text-gray-800 mb-2">¡Caja Cerrada!</h3>
              <p className="text-gray-500 text-sm mb-4">La sesión ha finalizado correctamente.</p>
              <div className="text-xs text-gray-400 mb-6 bg-gray-50 p-2 rounded">
                 Cerrado por: <b>{user?.email}</b>
              </div>
              
              <button onClick={() => generatePDF(closingData)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 mb-4 shadow-lg hover:bg-blue-700 transition">
                 <Download size={22}/> Descargar PDF
              </button>
              
              <button onClick={() => { setShowFinalReport(false); initPage(); }} className="text-gray-400 text-sm hover:text-gray-600 hover:underline">
                 Volver al inicio
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default SalesHistory;
