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
      stockActual: parseInt(productData.cantidadComprada)
    };

    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error };
  }
};

export const getProducts = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const products = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error };
  }
};

export const updateProductStock = async (id, data) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(productRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

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

export const updateProduct = async (id, data) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(productRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// --- GESTIÓN DE PROVEEDORES (ACTUALIZADO) ---

/**
 * Registra pago a proveedor (Recibe sessionId opcional)
 */
export const createSupplierPayment = async (paymentData, sessionId = null) => {
  try {
    const payload = {
      ...paymentData,
      createdAt: Timestamp.now(),
      monto: parseFloat(paymentData.monto),
      sessionId: sessionId // Vinculamos a la caja
    };
    await addDoc(collection(db, PAYMENTS_COLLECTION), payload);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

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

/**
 * Obtener pagos de UNA sesión específica (Para restar de la caja)
 */
export const getPaymentsBySession = async (sessionId) => {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION), 
      where("sessionId", "==", sessionId)
    );
    const querySnapshot = await getDocs(q);
    return { success: true, data: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
  } catch (error) {
    return { success: false, error };
  }
};

// --- GESTIÓN DE VENTAS ---

export const registerSale = async (cartItems, total, paymentMethod) => {
  try {
    const batch = writeBatch(db);
    const saleRef = doc(collection(db, SALES_COLLECTION));
    batch.set(saleRef, {
      items: cartItems,
      total: total,
      metodoPago: paymentMethod,
      createdAt: Timestamp.now(),
      isClosed: false
    });

    cartItems.forEach((item) => {
      const productRef = doc(db, PRODUCTS_COLLECTION, item.id);
      const newStock = parseInt(item.stockActual) - parseInt(item.cantidadVenta);
      batch.update(productRef, { stockActual: newStock });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const getActiveSales = async () => {
  try {
    const q = query(collection(db, SALES_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const sales = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(sale => !sale.isClosed); 
    return { success: true, data: sales };
  } catch (error) {
    return { success: false, error };
  }
};

// --- GESTIÓN DE SESIONES DE CAJA ---

export const checkActiveSession = async () => {
  try {
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
    return { success: false, error };
  }
};

export const openCashboxSession = async (initData) => {
  try {
    const payload = {
      ...initData,
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

export const closeCashbox = async (salesIds, summaryData, sessionId) => {
  try {
    const batch = writeBatch(db);

    if (sessionId) {
        const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
        batch.update(sessionRef, {
            status: "closed",
            closedAt: Timestamp.now(),
            finalSummary: summaryData
        });
    }

    const historyRef = doc(collection(db, CASHBOX_HISTORY_COLLECTION));
    batch.set(historyRef, {
      ...summaryData,
      createdAt: Timestamp.now(),
      closedAt: Timestamp.now(),
      itemsCount: salesIds.length,
      sessionId: sessionId || null
    });

    salesIds.forEach(id => {
      const saleRef = doc(db, SALES_COLLECTION, id);
      batch.update(saleRef, { isClosed: true, cashboxId: historyRef.id, sessionId: sessionId || null });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * CORRECCIÓN HISTORIAL: Ordenamiento en cliente para evitar error de índices
 */
export const getClosedSessions = async () => {
  try {
    const q = query(
      collection(db, SESSIONS_COLLECTION), 
      where("status", "==", "closed")
    );
    const querySnapshot = await getDocs(q);
    
    const sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Ordenamos aquí en Javascript
    sessions.sort((a, b) => b.closedAt?.seconds - a.closedAt?.seconds);

    return { success: true, data: sessions };
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return { success: false, error };
  }
};

// Estadísticas
export const getSalesForStats = async () => {
  try {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);
    const timestampLimit = Timestamp.fromDate(dateLimit);

    const q = query(
      collection(db, SALES_COLLECTION),
      where("createdAt", ">=", timestampLimit),
      orderBy("createdAt", "asc")
    );

    const querySnapshot = await getDocs(q);
    const sales = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: sales };
  } catch (error) {
    return { success: false, error };
  }
};

export const getSales = getActiveSales;
