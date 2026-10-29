import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  onSnapshot,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ProductItem,
  StockItem,
  SaleRecord,
  CustomerRecord,
  DuePaymentRecord,
  ExpenseRecord,
  SupplierRecord,
} from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDoc(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    console.warn('Firebase Firestore initialization notice (operating in local/offline cache mode):', error);
    return false;
  }
}

// User types
export interface AppUser {
  username: string;
  name: string;
  role: 'admin' | 'cashier' | 'manager';
  designation: string;
  phone?: string;
  avatar?: string;
}

export interface UserAccount {
  username: string;
  password: string;
  user: AppUser;
}

// Default Pre-Configured Accounts for 1 Admin + 5 Staff
export const DEFAULT_USERS: { [username: string]: UserAccount } = {
  admin: {
    username: 'admin',
    password: 'admin1234',
    user: {
      username: 'admin',
      name: 'সুপার অ্যাডমিন (মালিক)',
      role: 'admin',
      designation: 'Store Owner / Admin',
    },
  },
  cashier1: {
    username: 'cashier1',
    password: 'user1234',
    user: {
      username: 'cashier1',
      name: 'কাউন্টার ১ (ক্যাশিয়ার)',
      role: 'cashier',
      designation: 'Cashier Counter 1',
    },
  },
  cashier2: {
    username: 'cashier2',
    password: 'user1234',
    user: {
      username: 'cashier2',
      name: 'কাউন্টার ২ (ক্যাশিয়ার)',
      role: 'cashier',
      designation: 'Cashier Counter 2',
    },
  },
  salesman: {
    username: 'salesman',
    password: 'user1234',
    user: {
      username: 'salesman',
      name: 'বিক্রয় কর্মী (Sales)',
      role: 'cashier',
      designation: 'Sales Representative',
    },
  },
  manager: {
    username: 'manager',
    password: 'user1234',
    user: {
      username: 'manager',
      name: 'স্টোর ম্যানেজার',
      role: 'manager',
      designation: 'Store Manager',
    },
  },
  inventory: {
    username: 'inventory',
    password: 'user1234',
    user: {
      username: 'inventory',
      name: 'স্টক ইনচার্জ',
      role: 'manager',
      designation: 'Inventory Keeper',
    },
  },
};

// Real-time Firestore Listeners
export function subscribeToUsers(callback: (accounts: { [username: string]: UserAccount }) => void) {
  const colRef = collection(db, 'users');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const accMap: { [username: string]: UserAccount } = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserAccount;
        if (data && data.username) {
          accMap[data.username.toLowerCase()] = data;
        }
      });
      callback(accMap);
    },
    (err) => console.warn('Firestore users listener error:', err)
  );
}

export async function saveUserToFirestore(account: UserAccount) {
  try {
    const cleanUsername = account.username.toLowerCase().trim();
    await setDoc(doc(db, 'users', cleanUsername), {
      username: cleanUsername,
      password: account.password,
      user: {
        ...account.user,
        username: cleanUsername,
      },
    });
    return true;
  } catch (err) {
    console.warn('Saving user to Firestore note:', err);
    return false;
  }
}

export async function deleteUserFromFirestore(username: string) {
  try {
    await deleteDoc(doc(db, 'users', username.toLowerCase().trim()));
    return true;
  } catch (err) {
    console.warn('Deleting user from Firestore note:', err);
    return false;
  }
}

// Real-time Firestore Listeners
export function subscribeToProducts(callback: (products: ProductItem[]) => void) {
  const colRef = collection(db, 'products');
  return onSnapshot(colRef, (snapshot) => {
    const list: ProductItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ProductItem);
    });
    callback(list);
  }, (err) => console.warn('Firestore products listener error:', err));
}

export function subscribeToStock(callback: (stock: StockItem[]) => void) {
  const colRef = collection(db, 'stock');
  return onSnapshot(colRef, (snapshot) => {
    const list: StockItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as StockItem);
    });
    callback(list);
  }, (err) => console.warn('Firestore stock listener error:', err));
}

export function subscribeToSales(callback: (sales: SaleRecord[]) => void) {
  const colRef = collection(db, 'sales');
  return onSnapshot(colRef, (snapshot) => {
    const list: SaleRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as SaleRecord);
    });
    callback(list);
  }, (err) => console.warn('Firestore sales listener error:', err));
}

export function subscribeToCustomers(callback: (customers: CustomerRecord[]) => void) {
  const colRef = collection(db, 'customers');
  return onSnapshot(colRef, (snapshot) => {
    const list: CustomerRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as CustomerRecord);
    });
    callback(list);
  }, (err) => console.warn('Firestore customers listener error:', err));
}

export function subscribeToExpenses(callback: (expenses: ExpenseRecord[]) => void) {
  const colRef = collection(db, 'expenses');
  return onSnapshot(colRef, (snapshot) => {
    const list: ExpenseRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ExpenseRecord);
    });
    callback(list);
  }, (err) => console.warn('Firestore expenses listener error:', err));
}

export function subscribeToDuePayments(callback: (duePayments: DuePaymentRecord[]) => void) {
  const colRef = collection(db, 'duePayments');
  return onSnapshot(colRef, (snapshot) => {
    const list: DuePaymentRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as DuePaymentRecord);
    });
    callback(list);
  }, (err) => console.warn('Firestore due payments listener error:', err));
}

// Sync single entities to Firestore
export async function syncProductToFirestore(product: ProductItem) {
  try {
    await setDoc(doc(db, 'products', product.id), product);
  } catch (e) {
    console.warn('Saving product to Firestore note:', e);
  }
}

export async function deleteProductFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (e) {
    console.warn('Deleting product from Firestore note:', e);
  }
}

export async function syncStockItemToFirestore(stockItem: StockItem) {
  try {
    await setDoc(doc(db, 'stock', stockItem.id), stockItem);
  } catch (e) {
    console.warn('Saving stock to Firestore note:', e);
  }
}

export async function deleteStockFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'stock', id));
  } catch (e) {
    console.warn('Deleting stock from Firestore note:', e);
  }
}

export async function syncSaleToFirestore(sale: SaleRecord) {
  try {
    await setDoc(doc(db, 'sales', sale.invoiceNo), sale);
  } catch (e) {
    console.warn('Saving sale to Firestore note:', e);
  }
}

export async function deleteSaleFromFirestore(invoiceNo: string) {
  try {
    await deleteDoc(doc(db, 'sales', invoiceNo));
  } catch (e) {
    console.warn('Deleting sale from Firestore note:', e);
  }
}

export async function syncCustomerToFirestore(customer: CustomerRecord) {
  try {
    await setDoc(doc(db, 'customers', customer.id), customer);
  } catch (e) {
    console.warn('Saving customer to Firestore note:', e);
  }
}

export async function deleteCustomerFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'customers', id));
  } catch (e) {
    console.warn('Deleting customer from Firestore note:', e);
  }
}

export async function syncExpenseToFirestore(expense: ExpenseRecord) {
  try {
    await setDoc(doc(db, 'expenses', expense.id), expense);
  } catch (e) {
    console.warn('Saving expense to Firestore note:', e);
  }
}

export async function deleteExpenseFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'expenses', id));
  } catch (e) {
    console.warn('Deleting expense from Firestore note:', e);
  }
}

export async function syncDuePaymentToFirestore(payment: DuePaymentRecord) {
  try {
    await setDoc(doc(db, 'duePayments', payment.id), payment);
  } catch (e) {
    console.warn('Saving due payment to Firestore note:', e);
  }
}

export async function deleteDuePaymentFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, 'duePayments', id));
  } catch (e) {
    console.warn('Deleting due payment from Firestore note:', e);
  }
}

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_DATABASE_ID = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const FIREBASE_CONSOLE_URL = `https://console.firebase.google.com/project/${FIREBASE_PROJECT_ID}/firestore/databases/${FIREBASE_DATABASE_ID}/data`;

// Batch upload all initial data to Firestore if cloud is empty
export async function seedInitialDataIfEmpty(data: {
  products: ProductItem[];
  stock: StockItem[];
  sales: SaleRecord[];
  customers: CustomerRecord[];
  expenses: ExpenseRecord[];
  duePayments: DuePaymentRecord[];
}) {
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    if (!productsSnap.empty) {
      return false; // Already has data
    }
    
    // Seed initial demo data
    const batch = writeBatch(db);
    data.products.forEach((p) => batch.set(doc(db, 'products', p.id), p));
    data.stock.forEach((s) => batch.set(doc(db, 'stock', s.id), s));
    data.sales.forEach((s) => batch.set(doc(db, 'sales', s.invoiceNo), s));
    data.customers.forEach((c) => batch.set(doc(db, 'customers', c.id), c));
    data.expenses.forEach((e) => batch.set(doc(db, 'expenses', e.id), e));
    data.duePayments.forEach((d) => batch.set(doc(db, 'duePayments', d.id), d));

    await batch.commit();
    console.log('Initial data seeded to Firestore successfully!');
    return true;
  } catch (e) {
    console.warn('Seeding initial data notice:', e);
    return false;
  }
}

// Force sync all local items to Firestore
export async function forceSyncAllToFirestore(data: {
  products: ProductItem[];
  stock: StockItem[];
  sales: SaleRecord[];
  customers: CustomerRecord[];
  expenses: ExpenseRecord[];
  duePayments: DuePaymentRecord[];
}): Promise<{ success: boolean; count: number; message: string }> {
  try {
    let count = 0;
    const batch = writeBatch(db);
    data.products.forEach((p) => {
      batch.set(doc(db, 'products', p.id), p);
      count++;
    });
    data.stock.forEach((s) => {
      batch.set(doc(db, 'stock', s.id), s);
      count++;
    });
    data.sales.forEach((s) => {
      batch.set(doc(db, 'sales', s.invoiceNo), s);
      count++;
    });
    data.customers.forEach((c) => {
      batch.set(doc(db, 'customers', c.id), c);
      count++;
    });
    data.expenses.forEach((e) => {
      batch.set(doc(db, 'expenses', e.id), e);
      count++;
    });
    data.duePayments.forEach((d) => {
      batch.set(doc(db, 'duePayments', d.id), d);
      count++;
    });

    await batch.commit();
    return {
      success: true,
      count,
      message: `${count} টি রেকর্ড সরাসরি ফায়ারবেস ক্লাউডে নিশ্চিতভাবে আপলোড ও সিঙ্ক হয়েছে!`,
    };
  } catch (err: any) {
    console.error('Error force syncing to Firestore:', err);
    return {
      success: false,
      count: 0,
      message: err?.message || 'সিঙ্ক ব্যর্থ হয়েছে। ইন্টারনেট বা পারমিশন চেক করুন।',
    };
  }
}

