import { db } from "../../firebase/config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  Timestamp 
} from "firebase/firestore";

const PRODUCTS_COLLECTION = "products";
const PAYMENTS_COLLECTION = "supplier_payments";

/**
 * 1. Crea un nuevo producto en la base de datos
 */
export const createProduct = async (productData) => {
  try {
    const payload = {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      
      // Aseguramos tipos de datos numéricos
      costoBulto: parseFloat(productData.costoBulto),
      cantidadBulto: parseInt(productData.cantidadBulto),
      cantidadComprada: parseInt(productData.cantidadComprada), 
      margenGanancia: parseFloat(productData.margenGanancia),
      precioVenta: parseFloat(productData.precioVenta),
      costoUnitario: parseFloat(productData.costoUnitario),
      
      // Calculamos el stock total inicial
      stockActual: parseInt(productData.cantidadBulto) * parseInt(productData.cantidadComprada)
    };

    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al guardar producto:", error);
    return { success: false, error };
  }
};

/**
 * 2. Obtiene la lista completa de productos
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
 * 3. Actualiza el stock y el precio de un producto existente (Reposición)
 */
export const updateProductStock = async (id, data) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    
    // Solo actualizamos los campos que nos llegan y la fecha de modificación
    await updateDoc(productRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar stock del producto:", error);
    return { success: false, error };
  }
};

/**
 * 4. Registra un pago a proveedor (Nueva colección)
 */
export const createSupplierPayment = async (paymentData) => {
  try {
    const payload = {
      ...paymentData,
      createdAt: Timestamp.now(),
      // Aseguramos que el monto sea un número
      monto: parseFloat(paymentData.monto)
    };

    await addDoc(collection(db, PAYMENTS_COLLECTION), payload);
    return { success: true };
  } catch (error) {
    console.error("Error al registrar pago a proveedor:", error);
    return { success: false, error };
  }
};
