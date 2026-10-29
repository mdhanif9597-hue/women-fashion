import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Printer,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { SaleInvoiceItem, StockItem } from '../types';

// Bengali to English fashion apparel mapping
const BENGALI_PRODUCT_MAP: Record<string, string[]> = {
  shirt: ['শার্ট', 'শাট', 'shirt'],
  pant: ['প্যান্ট', 'পেন্ট', 'pant'],
  panjabi: ['পাঞ্জাবি', 'পাঞ্জাবী', 'panjabi'],
  't-shirt': ['টি শার্ট', 'টি-শার্ট', 't-shirt', 'tshirt', 'টিশার্ট'],
  polo: ['পোলো', 'polo'],
  jeans: ['জিন্স', 'jeans'],
  sharee: ['শাড়ি', 'শাড়ী', 'sharee', 'saree'],
  kurti: ['কুর্তি', 'kurti'],
  three_piece: ['থ্রি পিস', 'থ্রিপিস', 'three piece'],
  shoes: ['জুতো', 'জুতা', 'shoes', 'shoe'],
};

function findStockProduct(query: string, stockList: StockItem[]): StockItem | null {
  if (!query || !query.trim()) return null;
  const q = query.trim().toLowerCase();

  // 1. Exact ID
  let match = stockList.find((s) => (s.id || '').toLowerCase() === q);
  if (match) return match;

  // 2. Exact Name
  match = stockList.find((s) => (s.productName || '').toLowerCase() === q);
  if (match) return match;

  // 3. Bengali mapping check
  for (const s of stockList) {
    const sName = (s.productName || '').toLowerCase();
    for (const [key, aliases] of Object.entries(BENGALI_PRODUCT_MAP)) {
      if (sName.includes(key)) {
        if (aliases.some((alias) => q.includes(alias) || alias.includes(q))) {
          return s;
        }
      }
    }
  }

  // 4. Numeric ID match (e.g. '1' matches 'P0001')
  const num = q.replace(/\D/g, '');
  if (num) {
    const numInt = parseInt(num, 10);
    match = stockList.find((s) => {
      const sNum = (s.id || '').replace(/\D/g, '');
      return sNum && parseInt(sNum, 10) === numInt;
    });
    if (match) return match;
  }

  // 5. Prefix match on ID (e.g. 'P00' or 'p000')
  if (q.length >= 2) {
    match = stockList.find((s) => (s.id || '').toLowerCase().startsWith(q));
    if (match) return match;
  }

  // 6. Substring match on product name
  if (q.length >= 2) {
    match = stockList.find((s) => (s.productName || '').toLowerCase().includes(q));
    if (match) return match;
  }

  return null;
}

export const SaleEntryModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    stock,
    products,
    customers,
    processSale,
    getNextInvoiceNo,
  } = useShop();

  const isOpen = activeModal === 'sale_pos';

  // Product ID Search, Product Name Search & Quick Selection
  const [searchId, setSearchId] = useState<string>('P0001');
  const [searchProductName, setSearchProductName] = useState<string>('SHIRT');
  const [editCategory, setEditCategory] = useState<string>('clothing');
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);

  // Editable fields for the selected product before adding
  const [editQty, setEditQty] = useState<number>(1);
  const [editSalePrice, setEditSalePrice] = useState<number>(700);
  const [editPurchasePrice, setEditPurchasePrice] = useState<number>(500);
  const [editDiscount, setEditDiscount] = useState<number>(0);

  // Available categories (dynamic list from stock, products, and standard fashion categories)
  const availableCategories = useMemo(() => {
    const list = ['clothing', 'fashion', 'accessories', 'footwear'];
    stock.forEach((s) => {
      if (s.category && !list.includes(s.category)) list.push(s.category);
    });
    products.forEach((p) => {
      if (p.category && !list.includes(p.category)) list.push(p.category);
    });
    return list;
  }, [stock, products]);

  // Invoice Items
  const [cartItems, setCartItems] = useState<SaleInvoiceItem[]>([]);

  // Customer Info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'bKash' | 'Nagad' | 'Bank' | 'Card'>('Cash');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [extraDiscount, setExtraDiscount] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Function to apply a stock item to all form fields
  const applyProduct = (item: StockItem) => {
    setSelectedStockItem(item);
    setSearchId(item.id);
    setSearchProductName(item.productName);
    setEditCategory(item.category || 'clothing');
    setEditSalePrice(item.salePrice);
    setEditPurchasePrice(item.purchasePrice);
    setEditQty(1);
    setEditDiscount(0);
    setErrorMsg('');
  };

  // When modal opens or stock becomes available, auto-select P0001 or first item
  useEffect(() => {
    if (isOpen && stock.length > 0) {
      if (!selectedStockItem) {
        const defaultItem = stock.find((s) => s.id.toUpperCase() === 'P0001') || stock[0];
        if (defaultItem) {
          applyProduct(defaultItem);
        }
      }
    }
  }, [isOpen, stock]);

  // Search by Product ID (auto-matches live as user types)
  const handleSearchByProductId = (idVal: string) => {
    setSearchId(idVal);
    if (!idVal.trim()) {
      setSelectedStockItem(null);
      return;
    }

    const matched = findStockProduct(idVal, stock);
    if (matched) {
      setSelectedStockItem(matched);
      setSearchProductName(matched.productName);
      setEditCategory(matched.category || 'clothing');
      setEditSalePrice(matched.salePrice);
      setEditPurchasePrice(matched.purchasePrice);
      setEditQty(1);
      setErrorMsg('');
    } else {
      setSelectedStockItem(null);
    }
  };

  // Search by Product Name (auto-matches live as user types or picks datalist)
  const handleSearchByProductName = (nameVal: string) => {
    setSearchProductName(nameVal);
    if (!nameVal.trim()) {
      setSelectedStockItem(null);
      return;
    }

    const matched = findStockProduct(nameVal, stock);
    if (matched) {
      setSelectedStockItem(matched);
      setSearchId(matched.id);
      setEditCategory(matched.category || 'clothing');
      setEditSalePrice(matched.salePrice);
      setEditPurchasePrice(matched.purchasePrice);
      setEditQty(1);
      setErrorMsg('');
    }
  };

  // When customer is selected from suggestion
  const handleSelectCustomer = (name: string, phone: string) => {
    setCustomerName(name);
    setCustomerPhone(phone && phone !== 'N/A' ? phone : '');
  };

  // Add current selected product to invoice cart
  const handleAddToCart = () => {
    if (!selectedStockItem && !searchProductName.trim()) {
      setErrorMsg('অনুগ্রহ করে সঠিক প্রোডাক্ট আইডি বা নাম দিন');
      return;
    }

    if (editQty <= 0) {
      setErrorMsg('পরিমাণ অন্তত ১ হতে হবে');
      return;
    }

    const availableStock = selectedStockItem ? selectedStockItem.currentStock : 999;
    if (selectedStockItem && editQty > availableStock) {
      setErrorMsg(`স্টকে মাত্র ${selectedStockItem.currentStock} টি রয়েছে!`);
      return;
    }

    const purchaseP = selectedStockItem ? selectedStockItem.purchasePrice : editPurchasePrice;
    const total = editQty * editSalePrice - editDiscount;
    const profit = total - editQty * purchaseP;

    const newItem: SaleInvoiceItem = {
      productId: selectedStockItem ? selectedStockItem.id : (searchId.trim() || 'P0001'),
      productName: selectedStockItem ? selectedStockItem.productName : searchProductName.trim(),
      category: editCategory.trim() || (selectedStockItem ? selectedStockItem.category : 'clothing'),
      qty: editQty,
      purchasePrice: purchaseP,
      salePrice: editSalePrice,
      discount: editDiscount,
      total: Math.max(0, total),
      profit: profit,
    };

    setCartItems((prev) => [...prev, newItem]);
    setErrorMsg('');
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const netTotal = Math.max(0, subtotal - extraDiscount);
  const dueAmount = Math.max(0, netTotal - paidAmount);

  // Update paid amount when cart items change if not customized
  useEffect(() => {
    if (cartItems.length > 0 && paidAmount === 0) {
      setPaidAmount(netTotal);
    }
  }, [netTotal]);

  const handleCompleteSale = () => {
    if (cartItems.length === 0) {
      setErrorMsg('কার্টে অন্তত একটি প্রোডাক্ট যুক্ত করুন');
      return;
    }

    const saleCustomer = customerName.trim() || 'Cash Customer';
    const salePhone = customerPhone.trim() || 'N/A';

    processSale({
      customerName: saleCustomer,
      phone: salePhone,
      items: cartItems,
      subtotal,
      discount: extraDiscount,
      netTotal,
      payment: paidAmount,
      due: dueAmount,
      paymentMethod,
      remarks,
    });

    // Close POS modal & open Invoice Print modal
    setActiveModal('invoice_print');

    // Reset state
    setCartItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaidAmount(0);
    setExtraDiscount(0);
    setRemarks('');
    setSearchId('P0001');
  };

  if (!isOpen) return null;

  return (
    <div
      id="sale-pos-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#1e824c] px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-emerald-200" />
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">
                সেল এন্ট্রি পপ-আপ (POS Sale Entry)
              </h2>
              <p className="text-xs text-emerald-100">
                ইনভয়েস নং: {getNextInvoiceNo()} • লাইভ স্টক ও ডিউ সিঙ্ক
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Product ID / Product Name Search & Auto-Fill Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                ১. প্রোডাক্ট সার্চ ও তথ্য নির্বাচন (Product ID বা Name দিয়ে সার্চ করুন)
              </h3>
              <span className="text-[11px] text-emerald-700 font-medium">
                আইডি বা নাম লিখলেই সম্পূর্ণ তথ্য অটো-ফিল হবে
              </span>
            </div>

            {/* Input fields grid: Product ID, Product Name, Category, Sale Price, Qty */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              {/* 1. Product ID search input */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  প্রোডাক্ট আইডি (Product ID)
                </label>
                <div className="relative">
                  <input
                    id="pos-search-id-input"
                    type="text"
                    placeholder="P0001"
                    value={searchId}
                    onChange={(e) => handleSearchByProductId(e.target.value)}
                    className="w-full text-xs font-mono font-medium pl-8 pr-3 py-2 bg-white border-2 border-slate-800 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 uppercase"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* 2. Product Name search input (Auto-fill or Type to Search) */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  প্রোডাক্ট নাম (Product Name)
                </label>
                <div className="relative">
                  <input
                    id="pos-search-name-input"
                    type="text"
                    list="stock-products-datalist"
                    value={searchProductName}
                    onChange={(e) => handleSearchByProductName(e.target.value)}
                    placeholder="যেমন: SHIRT বা PANT"
                    className="w-full text-xs font-bold text-slate-800 px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                  <datalist id="stock-products-datalist">
                    {stock.map((s) => (
                      <option key={s.id} value={s.productName}>
                        {s.id} - ৳{s.salePrice} (স্টক: {s.currentStock})
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* 3. Category (Dropdown + Manual Typing) */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                  <span>ক্যাটাগরি (Category)</span>
                  <span className="text-[10px] text-emerald-700 font-normal">সিলেক্ট/টাইপ</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="pos-category-input"
                    type="text"
                    list="pos-categories-list"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    placeholder="ক্যাটাগরি লিখুন বা বেছে নিন"
                    className="w-full text-xs font-medium text-slate-800 pl-2.5 pr-7 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                  />
                  {/* Dropdown helper picker */}
                  <select
                    id="pos-category-select-dropdown"
                    title="ক্যাটাগরি তালিকা থেকে বেছে নিন"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setEditCategory(e.target.value);
                    }}
                    className="absolute right-1 w-6 h-7 opacity-70 hover:opacity-100 bg-transparent border-0 cursor-pointer text-slate-500 text-xs"
                  >
                    <option value="" disabled>
                      ▼
                    </option>
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <datalist id="pos-categories-list">
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* 4. Sale Price */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  বিক্রয় মূল্য (৳)
                </label>
                <input
                  id="pos-sale-price-input"
                  type="number"
                  value={editSalePrice || ''}
                  onChange={(e) => setEditSalePrice(Number(e.target.value))}
                  className="w-full text-xs font-bold text-slate-800 px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 5. Quantity */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  পরিমাণ
                </label>
                <input
                  id="pos-qty-input"
                  type="number"
                  min={1}
                  value={editQty}
                  onChange={(e) => setEditQty(Number(e.target.value))}
                  className="w-full text-xs font-bold text-slate-800 px-2 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 text-center"
                />
              </div>
            </div>

            {/* Bottom row: Quick chips, Stock & Purchase price info, and Add to Cart button */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center mt-3 pt-2 border-t border-slate-200">
              {/* Quick chips under search fields */}
              <div className="sm:col-span-6">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">দ্রুত পছন্দ:</span>
                  {stock.slice(0, 5).map((s) => {
                    const isSelected =
                      searchId.toUpperCase() === s.id.toUpperCase() ||
                      searchProductName.toUpperCase() === s.productName.toUpperCase();
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => applyProduct(s)}
                        className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded border transition font-mono ${
                          isSelected
                            ? 'bg-[#1e824c] text-white border-[#1e824c] font-semibold'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        {s.id} ({s.productName})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock display & purchase price info */}
              <div className="sm:col-span-3">
                <div className="text-[11px] text-slate-600 flex flex-col sm:flex-row items-start sm:items-center gap-1">
                  <div>
                    <span>স্টক: </span>
                    <strong className="text-emerald-700 font-bold font-mono">
                      {selectedStockItem ? selectedStockItem.currentStock : 0}
                    </strong>{' '}
                    <span>টি</span>
                  </div>
                  {selectedStockItem && (
                    <span className="text-slate-400 text-[10px]">
                      (ক্রয়: ৳{selectedStockItem.purchasePrice})
                    </span>
                  )}
                </div>
              </div>

              {/* Add to Cart button aligned right */}
              <div className="sm:col-span-3 flex justify-end">
                <button
                  id="pos-add-to-cart-btn"
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full sm:w-auto py-2 px-5 bg-[#1e824c] hover:bg-[#166534] text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>আইটেম যোগ করুন</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Invoice Items Cart Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-100/80 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>২. ইনভয়েস আইটেম তালিকা ({cartItems.length})</span>
              <span className="text-[11px] text-slate-500 font-normal">
                সাবটোটাল: ৳ {subtotal}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">প্রোডাক্ট</th>
                    <th className="py-2.5 px-3 text-center">পরিমাণ</th>
                    <th className="py-2.5 px-3 text-right">দর (৳)</th>
                    <th className="py-2.5 px-3 text-right">মোট (৳)</th>
                    <th className="py-2.5 px-3 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-medium text-slate-600">
                        {item.productId}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-800">{item.productName}</div>
                        {item.category && (
                          <div className="text-[10px] text-slate-500">
                            ক্যাটাগরি: <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">{item.category}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-slate-700">
                        {item.qty}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-700">
                        {item.salePrice}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">
                        {item.total}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cartItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-7 text-center text-slate-400">
                        এখনো কোনো আইটেম যোগ করা হয়নি
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 3 & 4: Customer Info & Payment Details (2 columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Information (Left Card) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                ৩. কাস্টমার তথ্য
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  কাস্টমারের নাম (Customer Name)
                </label>
                <input
                  id="pos-customer-name"
                  type="text"
                  placeholder="যেমন: HANIF বা নগদ খদ্দের"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  মোবাইল নম্বর (Phone)
                </label>
                <input
                  id="pos-customer-phone"
                  type="text"
                  placeholder="যেমন: 01322996278"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quick Customer Select */}
              {customers.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] text-slate-500 block mb-1.5">
                    পূর্ববর্তী কাস্টমার সিলেক্ট করুন:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c.customerName, c.phone)}
                        className="text-[10px] bg-white text-slate-700 border border-slate-200 hover:border-emerald-500 px-2 py-0.5 rounded-full transition shadow-2xs"
                      >
                        {c.customerName} {c.totalDue > 0 ? `(বাকি: ৳${c.totalDue})` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment & Due Calculation (Right Card) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                ৪. পেমেন্ট ও ডিউ হিসাব
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    পেমেন্ট মেথড
                  </label>
                  <select
                    id="pos-payment-method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Cash">Cash (নগদ)</option>
                    <option value="bKash">bKash (বিকাশ)</option>
                    <option value="Nagad">Nagad (নগদ অ্যাপ)</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    ডিসকাউন্ট (৳)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={extraDiscount}
                    onChange={(e) => setExtraDiscount(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    পরিশোধকৃত টাকা (Paid Amount)
                  </label>
                  <input
                    id="pos-paid-amount"
                    type="number"
                    min={0}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full text-xs font-bold text-emerald-700 px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    বাকি টাকা (Due Amount)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={dueAmount}
                    className={`w-full text-xs font-bold px-3 py-2 rounded-md border ${
                      dueAmount > 0
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  মন্তব্য / রিমার্কস (Remarks)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ফুল পেইড বা আগামী সপ্তাহে ডিউ পরিশোধ হবে"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Identical to screenshot) */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs">
            {dueAmount > 0 ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                ⚠️ কাস্টমার শিটে ৳{dueAmount} ডিউ জমা হবে
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                সম্পূর্ণ পেমেন্ট সম্পন্ন
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveModal('none')}
              className="px-5 py-2 bg-white text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold rounded-lg hover:bg-slate-50 transition"
            >
              বাতিল
            </button>
            <button
              id="pos-submit-sale-btn"
              type="button"
              onClick={handleCompleteSale}
              disabled={cartItems.length === 0}
              className="px-5 py-2 bg-[#559b7b] hover:bg-[#468668] disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>বিক্রি সম্পন্ন ও প্রিন্ট ইনভয়েস</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
