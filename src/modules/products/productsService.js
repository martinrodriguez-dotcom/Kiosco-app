import { db } from "../../firebase/config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,       // Nuevo
  writeBatch,   // Nuevo
  query,        // Nuevo
  orderBy,      // Nuevo
  Timestamp 
} from "firebase/firestore";

const PRODUCTS_COLLECTION = "products";
const PAYMENTS_COLLECTION = "supplier_payments";
const SALES_COLLECTION = "sales";

// --- FUNCIONES BÁSICAS DE PRODUCTOS ---

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
      stockActual: parseInt(productData.cantidadComprada) // Stock inicial directo
    };

    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al guardar producto:", error);
    return { success: false, error };
  }
};

/**
 * 2. Obtiene la lista de productos
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
 * 3. Reponer Stock (Actualiza cantidad y costos)
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

// --- FUNCIONES DE PROVEEDORES ---

/**
 * 4. Registrar Pago a Proveedor
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
 * 5. Ver Historial de Pagos
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

// --- FUNCIONES NUEVAS (EDICIÓN Y VENTAS) ---

/**
 * 6. Obtener un producto por ID (Para editar)
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
 * 7. Editar Producto (Admin)
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

/**
 * 8. REGISTRAR VENTA (Descuenta stock masivamente)
 */
export const registerSale = async (cartItems, total, paymentMethod) => {
  try {
    const batch = writeBatch(db);

    // A. Crear registro de venta
    const saleRef = doc(collection(db, SALES_COLLECTION));
    batch.set(saleRef, {
      items: cartItems,
      total: total,
      metodoPago: paymentMethod,
      createdAt: Timestamp.now()
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
