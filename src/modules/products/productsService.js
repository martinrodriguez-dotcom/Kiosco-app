import { db } from "../../firebase/config";
import { 
  collection, addDoc, getDocs, doc, updateDoc, getDoc, writeBatch, Timestamp, query, orderBy 
} from "firebase/firestore";

const PRODUCTS_COLLECTION = "products";
const PAYMENTS_COLLECTION = "supplier_payments";
const SALES_COLLECTION = "sales";

// ... (createProduct, getProducts, updateProductStock, createSupplierPayment SE MANTIENEN IGUAL) ...
// Copia tus funciones anteriores aquí (createProduct, getProducts, etc.) o pídeme si quieres que repita todo el archivo.

// --- NUEVAS FUNCIONES ---

/**
 * 5. Obtiene un solo producto por ID (Para la edición)
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
 * 6. Edita un producto completo (Admin)
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
 * 7. Obtiene el historial de pagos a proveedores
 */
export const getSupplierPayments = async () => {
  try {
    // Ordenamos por fecha de creación descendente (lo más nuevo arriba)
    const q = query(collection(db, PAYMENTS_COLLECTION), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: payments };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * 8. REGISTRAR VENTA (POS): Crea la venta y descuenta stock en una sola operación
 */
export const registerSale = async (cartItems, total, paymentMethod) => {
  try {
    const batch = writeBatch(db);

    // 1. Crear el registro de venta
    const saleRef = doc(collection(db, SALES_COLLECTION));
    batch.set(saleRef, {
      items: cartItems, // Guardamos qué se vendió
      total: total,
      metodoPago: paymentMethod, // 'Efectivo' o 'Mercado Pago'
      createdAt: Timestamp.now()
    });

    // 2. Descontar stock de cada producto
    cartItems.forEach((item) => {
      const productRef = doc(db, PRODUCTS_COLLECTION, item.id);
      const newStock = item.stockActual - item.cantidadVenta;
      batch.update(productRef, { stockActual: newStock });
    });

    // 3. Ejecutar todo junto
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error en la venta:", error);
    return { success: false, error };
  }
};
