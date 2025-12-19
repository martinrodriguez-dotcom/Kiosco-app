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

export const createProduct = async (productData) => {
  try {
    const payload = {
      ...productData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      
      // Conversiones numéricas
      costoBulto: parseFloat(productData.costoBulto),
      cantidadBulto: parseInt(productData.cantidadBulto),
      // AHORA: cantidadComprada son UNIDADES, no bultos
      cantidadComprada: parseInt(productData.cantidadComprada), 
      margenGanancia: parseFloat(productData.margenGanancia),
      precioVenta: parseFloat(productData.precioVenta),
      costoUnitario: parseFloat(productData.costoUnitario),
      
      // AHORA: El stock inicial es directo lo que ingresaste en cantidadComprada
      stockActual: parseInt(productData.cantidadComprada)
    };

    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al guardar producto:", error);
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
    console.error("Error al obtener productos:", error);
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
    console.error("Error al actualizar stock:", error);
    return { success: false, error };
  }
};

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
