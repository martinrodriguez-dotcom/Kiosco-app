import { db } from "../../firebase/config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc, 
  writeBatch, 
  query, 
  orderBy, 
  where,
  limit,
  Timestamp 
} from "firebase/firestore";

const PRODUCTS_COLLECTION = "products";
const PAYMENTS_COLLECTION = "supplier_payments";
const SALES_COLLECTION = "sales";
const CASHBOX_HISTORY_COLLECTION = "cashbox_history";
const SESSIONS_COLLECTION = "cashbox_sessions"; 

// --- GESTIÓN DE PRODUCTOS ---

/**
 * 1. Crea un nuevo producto
 */
export const createProduct = async (productData) => {
  try {
    const payload = {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      costoBulto: parseFloat(productData.costoBulto),
      cantidadBulto: parseInt(productData.cantidadBulto),
      cantidadComprada: parseInt(productData.cantidadComprada), 
      margenGanancia: parseFloat(productData.margenGanancia),
      precioVenta: parseFloat(productData.precioVenta),
      costoUnitario: parseFloat(productData.costoUnitario),
      stockActual: parseInt(productData.cantidadComprada) // Stock inicial
    };

    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al guardar producto:", error);
    return { success: false, error };
  }
};

/**
 * 2. Obtiene todos los productos (Catálogo)
 */
export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: products };
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return { success: false, error };
  }
};

/**
 * 3. Actualiza stock (Reposición rápida)
 */
export const updateProductStock = async (id, data) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(productRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    return { success: false, error };
  }
};

/**
 * 4. Obtiene un producto por ID (Para edición)
 */
export const getProductById = async (id) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: "Producto no encontrado" };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * 5. Actualiza un producto completo (Edición Admin)
 */
export const updateProduct = async (id, data) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(productRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error("Error al editar producto:", error);
    return { success: false, error };
  }
};

// --- GESTIÓN DE PROVEEDORES ---

/**
 * 6. Registra pago a proveedor
 */
export const createSupplierPayment = async (paymentData) => {
  try {
    const payload = {
      ...paymentData,
      createdAt: Timestamp.now(),
      monto: parseFloat(paymentData.monto)
    };
    await addDoc(collection(db, PAYMENTS_COLLECTION), payload);
    return { success: true };
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return { success: false, error };
  }
};

/**
 * 7. Historial de pagos a proveedores
 */
export const getSupplierPayments = async () => {
  try {
    const q = query(collection(db, PAYMENTS_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: payments };
  } catch (error) {
    return { success: false, error };
  }
};

// --- GESTIÓN DE VENTAS Y CAJA ---

/**
 * 8. Registrar Venta (Descuenta stock y guarda registro)
 */
export const registerSale = async (cartItems, total, paymentMethod) => {
  try {
    const batch = writeBatch(db);

    // A. Crear registro de venta (Abierta por defecto)
    const saleRef = doc(collection(db, SALES_COLLECTION));
    batch.set(saleRef, {
      items: cartItems,
      total: total,
      metodoPago: paymentMethod,
      createdAt: Timestamp.now(),
      isClosed: false // Importante para el cierre de caja
    });

    // B. Descontar stock
    cartItems.forEach((item) => {
      const productRef = doc(db, PRODUCTS_COLLECTION, item.id);
      const newStock = parseInt(item.stockActual) - parseInt(item.cantidadVenta);
      batch.update(productRef, { stockActual: newStock });
    });

    // C. Ejecutar todo
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error en la venta:", error);
    return { success: false, error };
  }
};

/**
 * 9. Obtener Ventas Activas (Solo las NO cerradas)
 */
export const getActiveSales = async () => {
  try {
    // Traemos ordenado por fecha
    const q = query(collection(db, SALES_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    // Filtramos en memoria las que no están cerradas (isClosed != true)
    const sales = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(sale => !sale.isClosed); 

    return { success: true, data: sales };
  } catch (error) {
    return { success: false, error };
  }
};

// --- GESTIÓN DE SESIONES DE CAJA (NUEVO) ---

/**
 * 10. Verificar si hay una caja abierta
 */
export const checkActiveSession = async () => {
  try {
    // Buscamos una sesión que NO tenga fecha de cierre (status == "open")
    const q = query(
      collection(db, SESSIONS_COLLECTION), 
      where("status", "==", "open"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0];
      return { success: true, isOpen: true, data: { id: docData.id, ...docData.data() } };
    }
    return { success: true, isOpen: false };
  } catch (error) {
    console.error("Error checking session:", error);
    return { success: false, error };
  }
};

/**
 * 11. ABRIR CAJA (Iniciar Día)
 */
export const openCashboxSession = async (initData) => {
  try {
    const payload = {
      ...initData, // Aquí viene el cambio inicial y lo del proveedor
      createdAt: Timestamp.now(),
      status: "open",
      closedAt: null
    };
    const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * 12. CERRAR CAJA (Actualizada con Sesiones)
 */
export const closeCashbox = async (salesIds, summaryData, sessionId) => {
  try {
    const batch = writeBatch(db);

    // A. Actualizamos la sesión a "cerrada"
    if (sessionId) {
        const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
        batch.update(sessionRef, {
            status: "closed",
            closedAt: Timestamp.now(),
            finalSummary: summaryData // Guardamos el resumen final en la sesión
        });
    }

    // B. Crear registro histórico de cierre (Backup en colección antigua por seguridad)
    const historyRef = doc(collection(db, CASHBOX_HISTORY_COLLECTION));
    batch.set(historyRef, {
      ...summaryData,
      createdAt: Timestamp.now(),
      closedAt: Timestamp.now(),
      itemsCount: salesIds.length,
      sessionId: sessionId || null
    });

    // C. Marcar ventas como cerradas
    salesIds.forEach(id => {
      const saleRef = doc(db, SALES_COLLECTION, id);
      batch.update(saleRef, { 
        isClosed: true, 
        cashboxId: historyRef.id,
        sessionId: sessionId || null
      });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error al cerrar caja:", error);
    return { success: false, error };
  }
};

// Alias para compatibilidad con componentes anteriores
export const getSales = getActiveSales;

/**
 * 13. Obtener Historial de Sesiones Cerradas
 */
export const getClosedSessions = async () => {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION), 
      where("status", "==", "closed"),
      orderBy("closedAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: sessions };
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return { success: false, error };
  }
};

/**
 * 14. Obtener Ventas para Estadísticas (Últimos 30 días)
 */
export const getSalesForStats = async () => {
  try {
    // Calculamos la fecha de hace 30 días
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);
    const timestampLimit = Timestamp.fromDate(dateLimit);

    // Traemos ventas desde esa fecha
    const q = query(
      collection(db, SALES_COLLECTION),
      where("createdAt", ">=", timestampLimit),
      orderBy("createdAt", "asc")
    );

    const querySnapshot = await getDocs(q);
    const sales = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return { success: true, data: sales };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { success: false, error };
  }
};
