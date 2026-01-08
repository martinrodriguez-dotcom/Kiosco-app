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
  Timestamp 
} from "firebase/firestore";

const PRODUCTS_COLLECTION = "products";
const PAYMENTS_COLLECTION = "supplier_payments";
const SALES_COLLECTION = "sales";
const CASHBOX_HISTORY_COLLECTION = "cashbox_history"; // Nueva colección

// ... (Tus funciones anteriores: createProduct, getProducts, updateProductStock, etc. SE MANTIENEN IGUAL)
// Copia aquí las funciones createProduct, getProducts, updateProductStock, getProductById, updateProduct, createSupplierPayment, getSupplierPayments
// RECUERDA NO BORRARLAS. Aquí solo pongo las nuevas o modificadas para ahorrar espacio visual, pero tú mantén todo.

// --- REPETICIÓN RÁPIDA DE FUNCIONES BÁSICAS PARA QUE NO SE PIERDAN ---
export const createProduct = async (productData) => { /* ... código igual al anterior ... */ try { const payload = { ...productData, createdAt: Timestamp.now(), updatedAt: Timestamp.now(), costoBulto: parseFloat(productData.costoBulto), cantidadBulto: parseInt(productData.cantidadBulto), cantidadComprada: parseInt(productData.cantidadComprada), margenGanancia: parseFloat(productData.margenGanancia), precioVenta: parseFloat(productData.precioVenta), costoUnitario: parseFloat(productData.costoUnitario), stockActual: parseInt(productData.cantidadComprada) }; const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), payload); return { success: true, id: docRef.id }; } catch (error) { return { success: false, error }; } };
export const getProducts = async () => { /* ... */ try { const q = await getDocs(collection(db, PRODUCTS_COLLECTION)); return { success: true, data: q.docs.map(d => ({ id: d.id, ...d.data() })) }; } catch (e) { return { success: false, error: e }; } };
export const updateProductStock = async (id, data) => { try { await updateDoc(doc(db, PRODUCTS_COLLECTION, id), { ...data, updatedAt: Timestamp.now() }); return { success: true }; } catch (e) { return { success: false, error: e }; } };
export const getProductById = async (id) => { try { const d = await getDoc(doc(db, PRODUCTS_COLLECTION, id)); return d.exists() ? { success: true, data: { id: d.id, ...d.data() } } : { success: false }; } catch (e) { return { success: false, error: e }; } };
export const updateProduct = async (id, data) => { try { await updateDoc(doc(db, PRODUCTS_COLLECTION, id), { ...data, updatedAt: Timestamp.now() }); return { success: true }; } catch (e) { return { success: false, error: e }; } };
export const createSupplierPayment = async (d) => { try { await addDoc(collection(db, PAYMENTS_COLLECTION), { ...d, createdAt: Timestamp.now(), monto: parseFloat(d.monto) }); return { success: true }; } catch (e) { return { success: false, error: e }; } };
export const getSupplierPayments = async () => { try { const q = query(collection(db, PAYMENTS_COLLECTION), orderBy("createdAt", "desc")); const s = await getDocs(q); return { success: true, data: s.docs.map(d => ({ id: d.id, ...d.data() })) }; } catch (e) { return { success: false, error: e }; } };
export const registerSale = async (cart, total, method) => { try { const b = writeBatch(db); const r = doc(collection(db, SALES_COLLECTION)); b.set(r, { items: cart, total, metodoPago: method, createdAt: Timestamp.now(), isClosed: false }); cart.forEach(i => { const p = doc(db, PRODUCTS_COLLECTION, i.id); b.update(p, { stockActual: parseInt(i.stockActual) - parseInt(i.cantidadVenta) }); }); await b.commit(); return { success: true }; } catch (e) { return { success: false, error: e }; } };

// --- CAMBIOS IMPORTANTES DESDE AQUÍ ---

// Modificamos getSales para traer solo las ventas "abiertas" (NO cerradas)
export const getActiveSales = async () => {
  try {
    // Traemos ventas ordenadas por fecha. Filtramos en cliente o usamos un índice compuesto.
    // Para simplificar sin crear índices complejos manuales, traemos todas y filtramos las cerradas.
    const q = query(collection(db, SALES_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    // Filtramos solo las que NO tienen isClosed = true
    const sales = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(sale => !sale.isClosed); 

    return { success: true, data: sales };
  } catch (error) {
    return { success: false, error };
  }
};

// NUEVA: CERRAR CAJA
// 1. Guarda el resumen en 'cashbox_history'
// 2. Marca todas las ventas actuales como 'isClosed: true'
export const closeCashbox = async (salesIds, summaryData) => {
  try {
    const batch = writeBatch(db);

    // 1. Crear registro histórico de la caja
    const historyRef = doc(collection(db, CASHBOX_HISTORY_COLLECTION));
    batch.set(historyRef, {
      ...summaryData,
      createdAt: Timestamp.now(),
      closedAt: Timestamp.now(),
      itemsCount: salesIds.length
    });

    // 2. Marcar ventas como cerradas (para que no salgan en la caja actual)
    salesIds.forEach(id => {
      const saleRef = doc(db, SALES_COLLECTION, id);
      batch.update(saleRef, { isClosed: true, cashboxId: historyRef.id });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};

// Mantenemos la vieja getSales por si acaso, pero la app usará getActiveSales
export const getSales = getActiveSales;
