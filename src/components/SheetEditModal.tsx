import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';

export type SheetTabCategory =
  | 'Products'
  | 'Sales'
  | 'Stock'
  | 'Customers'
  | 'Due Collections'
  | 'Suppliers'
  | 'Expenses';

interface SheetEditModalProps {
  isOpen: boolean;
  tab: SheetTabCategory;
  item: any;
  onClose: () => void;
  onSave: (updatedItem: any) => void;
}

export const SheetEditModal: React.FC<SheetEditModalProps> = ({
  isOpen,
  tab,
  item,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const updated = { ...prev, [field]: value };

      // Auto calculate dependent fields
      if (tab === 'Products') {
        const qty = field === 'qty' ? Number(value) : Number(updated.qty || 0);
        const pPrice = field === 'purchasePrice' ? Number(value) : Number(updated.purchasePrice || 0);
        updated.total = qty * pPrice;
      } else if (tab === 'Sales') {
        const subtotal = field === 'subtotal' ? Number(value) : Number(updated.subtotal || 0);
        const discount = field === 'discount' ? Number(value) : Number(updated.discount || 0);
        const payment = field === 'payment' ? Number(value) : Number(updated.payment || 0);
        const netTotal = Math.max(0, subtotal - discount);
        updated.netTotal = netTotal;
        updated.due = Math.max(0, netTotal - payment);
      } else if (tab === 'Stock') {
        const pQty = field === 'purchasedQty' ? Number(value) : Number(updated.purchasedQty || 0);
        const sQty = field === 'soldQty' ? Number(value) : Number(updated.soldQty || 0);
        updated.currentStock = Math.max(0, pQty - sQty);
      } else if (tab === 'Customers') {
        const tPurchase = field === 'totalPurchase' ? Number(value) : Number(updated.totalPurchase || 0);
        const tPaid = field === 'totalPaid' ? Number(value) : Number(updated.totalPaid || 0);
        updated.totalDue = Math.max(0, tPurchase - tPaid);
      } else if (tab === 'Suppliers') {
        const tSupplied = field === 'totalSupplied' ? Number(value) : Number(updated.totalSupplied || 0);
        const tPaid = field === 'totalPaid' ? Number(value) : Number(updated.totalPaid || 0);
        updated.totalDue = Math.max(0, tSupplied - tPaid);
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-[#0f9d58] text-white p-3.5 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 rounded-md">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                শিট ডাটা এডিট ({tab})
              </h3>
              <p className="text-[11px] text-white/80">
                ID/আইডি: {item.id || item.invoiceNo || item.name || 'রেকর্ড'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
          {/* TAB: PRODUCTS */}
          {tab === 'Products' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">প্রোডাক্টের নাম (Product Name)</label>
                <input
                  type="text"
                  required
                  value={formData.product || ''}
                  onChange={(e) => handleChange('product', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি (Category)</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">সাপ্লায়ার (Supplier)</label>
                <input
                  type="text"
                  value={formData.supplier || ''}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পরিমাণ (Qty)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.qty ?? 0}
                  onChange={(e) => handleChange('qty', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ক্রয় মূল্য (Purchase Price)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.purchasePrice ?? 0}
                  onChange={(e) => handleChange('purchasePrice', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিক্রয় মূল্য (Sale Price)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.salePrice ?? 0}
                  onChange={(e) => handleChange('salePrice', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono text-emerald-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">তারিখ (Date)</label>
                <input
                  type="text"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">মোট ক্রয়মূল্য (Total):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">৳ {formData.total?.toLocaleString() ?? 0}</span>
              </div>
            </div>
          )}

          {/* TAB: SALES */}
          {tab === 'Sales' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ইনভয়েস নম্বর (Invoice No)</label>
                <input
                  type="text"
                  disabled
                  value={formData.invoiceNo || ''}
                  className="w-full p-2 bg-slate-100 border border-slate-300 rounded-md text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিক্রির তারিখ (Date)</label>
                <input
                  type="text"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">কাস্টমার নাম (Customer Name)</label>
                <input
                  type="text"
                  required
                  value={formData.customerName || ''}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর (Phone)</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">সাবটোটাল / বিক্রয় মূল্য (Subtotal)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.subtotal ?? 0}
                  onChange={(e) => handleChange('subtotal', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ডিসকাউন্ট (Discount)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.discount ?? 0}
                  onChange={(e) => handleChange('discount', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono text-rose-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পরিশোধ (Payment)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.payment ?? 0}
                  onChange={(e) => handleChange('payment', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট মেথড (Payment Method)</label>
                <select
                  value={formData.paymentMethod || 'Cash'}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank">Bank</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">মন্তব্য (Remarks)</label>
                <input
                  type="text"
                  value={formData.remarks || ''}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600">অবশিষ্ট বকেয়া (Due):</span>
                <span className="font-mono font-bold text-rose-600">৳ {formData.due?.toLocaleString() ?? 0}</span>
              </div>
            </div>
          )}

          {/* TAB: STOCK */}
          {tab === 'Stock' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">প্রোডাক্টের নাম (Product Name)</label>
                <input
                  type="text"
                  required
                  value={formData.productName || ''}
                  onChange={(e) => handleChange('productName', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ক্যাটাগরি (Category)</label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোট কেনা (Purchased Qty)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.purchasedQty ?? 0}
                  onChange={(e) => handleChange('purchasedQty', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোট বিক্রি (Sold Qty)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.soldQty ?? 0}
                  onChange={(e) => handleChange('soldQty', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono font-semibold text-blue-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বর্তমান স্টক (Current Stock)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.currentStock ?? 0}
                  onChange={(e) => handleChange('currentStock', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">বিক্রয় মূল্য (Sale Price)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.salePrice ?? 0}
                  onChange={(e) => handleChange('salePrice', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">ক্রয় মূল্য (Purchase Price)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.purchasePrice ?? 0}
                  onChange={(e) => handleChange('purchasePrice', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB: CUSTOMERS */}
          {tab === 'Customers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">কাস্টমার নাম (Customer Name)</label>
                <input
                  type="text"
                  required
                  value={formData.customerName || ''}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর (Phone)</label>
                <input
                  type="text"
                  required
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">তারিখ (Date)</label>
                <input
                  type="text"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোট খরিদ (Total Purchase)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.totalPurchase ?? 0}
                  onChange={(e) => handleChange('totalPurchase', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোট পরিশোধ (Total Paid)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.totalPaid ?? 0}
                  onChange={(e) => handleChange('totalPaid', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono font-semibold text-emerald-700"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">মোট বকেয়া (Total Due):</span>
                <span className="font-mono font-bold text-rose-600 text-sm">৳ {formData.totalDue?.toLocaleString() ?? 0}</span>
              </div>
            </div>
          )}

          {/* TAB: DUE COLLECTIONS */}
          {tab === 'Due Collections' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ভাউচার নম্বর (Voucher ID)</label>
                <input
                  type="text"
                  disabled
                  value={formData.id || ''}
                  className="w-full p-2 bg-slate-100 border border-slate-300 rounded-md text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">কালেকশনের তারিখ ও সময়</label>
                <input
                  type="text"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">কাস্টমার নাম (Customer Name)</label>
                <input
                  type="text"
                  required
                  value={formData.customerName || ''}
                  onChange={(e) => handleChange('customerName', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর (Phone)</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">আদায়কৃত টাকা (Collected Amount)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.amount ?? 0}
                  onChange={(e) => handleChange('amount', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট মেথড (Payment Method)</label>
                <select
                  value={formData.paymentMethod || 'Cash'}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পরবর্তী বাকি (Remaining Due)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.remainingDue ?? 0}
                  onChange={(e) => handleChange('remainingDue', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono text-rose-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মন্তব্য (Remarks)</label>
                <input
                  type="text"
                  value={formData.remarks || ''}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* TAB: SUPPLIERS */}
          {tab === 'Suppliers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">সাপ্লায়ারের নাম (Supplier Name)</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোবাইল নম্বর (Phone)</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">তারিখ (Date)</label>
                <input
                  type="text"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোট সাপ্লাইকৃত মাল (Total Supplied)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.totalSupplied ?? 0}
                  onChange={(e) => handleChange('totalSupplied', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">মোট পরিশোধ (Total Paid)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.totalPaid ?? 0}
                  onChange={(e) => handleChange('totalPaid', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono text-emerald-700"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">সাপ্লায়ার বাকি (Total Due):</span>
                <span className="font-mono font-bold text-rose-600 text-sm">৳ {formData.totalDue?.toLocaleString() ?? 0}</span>
              </div>
            </div>
          )}

          {/* TAB: EXPENSES */}
          {tab === 'Expenses' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">খরচের খাত / ক্যাটাগরি (Category)</label>
                <input
                  type="text"
                  required
                  value={formData.category || ''}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">খরচের পরিমাণ (Amount ৳)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.amount ?? 0}
                  onChange={(e) => handleChange('amount', Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-rose-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">পেমেন্ট মেথড (Payment Method)</label>
                <select
                  value={formData.paymentMethod || 'Cash'}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">তারিখ (Date)</label>
                <input
                  type="text"
                  value={formData.date || ''}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">বিবরণ / নোট (Note / Details)</label>
                <textarea
                  rows={2}
                  value={formData.note || ''}
                  onChange={(e) => handleChange('note', e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="bg-slate-50 border-t border-slate-200 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 sm:p-4 flex items-center justify-end gap-2.5 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#0f9d58] hover:bg-[#0b8043] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>পরিবর্তন সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
