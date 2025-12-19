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
  Timestamp 
} from "firebase/firestore";

const PRODUCTS_COLLECTION = "products";
const PAYMENTS_COLLECTION = "supplier_payments";
const SALES_COLLECTION = "sales";

// --- PRODUCTOS ---
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
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: products };
  } catch (error) {
    return { success: false, error };
  }
};

export const updateProductStock = async (id, data) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(productRef, { ...data, updatedAt: Timestamp.now() });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const getProductById = async (id) => {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    return { success: false, error: "No encontrado" };
  } catch (error) {
    return { success: false, error };
  }
};

export const updateProduct = async (id, data) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(productRef, { ...data, updatedAt: Timestamp.now() });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// --- PROVEEDORES ---
export const createSupplierPayment = async (paymentData) => {
  try {
    const payload = { ...paymentData, createdAt: Timestamp.now(), monto: parseFloat(paymentData.monto) };
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

// --- VENTAS Y CAJA ---
export const registerSale = async (cartItems, total, paymentMethod) => {
  try {
    const batch = writeBatch(db);
    const saleRef = doc(collection(db, SALES_COLLECTION));
    
    batch.set(saleRef, {
      items: cartItems,
      total: total,
      metodoPago: paymentMethod,
      createdAt: Timestamp.now()
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

// NUEVA: Obtener historial de ventas
export const getSales = async () => {
  try {
    const q = query(collection(db, SALES_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const sales = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: sales };
  } catch (error) {
    return { success: false, error };
  }
};
