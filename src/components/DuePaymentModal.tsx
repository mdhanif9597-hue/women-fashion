import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Calendar,
  Clock,
  History,
  FileSpreadsheet,
  Receipt,
  User,
  Phone,
  Hash,
  Layers,
  FileText,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { CustomerRecord } from '../types';

export const DuePaymentModal: React.FC = () => {
  const { activeModal, setActiveModal, customers, payCustomerDue, sales } = useShop();

  const isOpen = activeModal === 'due_payment';

  // Search by: Customer Name, Mobile Number, or Invoice Number
  const [searchType, setSearchType] = useState<'all' | 'name' | 'phone' | 'invoice'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<'form' | 'invoices' | 'history'>('form');

  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [remarks, setRemarks] = useState<string>('ডিউ পরিশোধ');
  const [collectionDate, setCollectionDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [collectionTime, setCollectionTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Find sales that match invoice search
  const matchingInvoiceSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return sales.filter(
      (s) =>
        s.invoiceNo.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [sales, searchQuery]);

  // Filter customers with due or matching search query (Customer Name, Mobile Number, or Invoice Number)
  const dueCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Default: show customers who have due > 0
      return customers.filter((c) => c.totalDue > 0);
    }

    return customers.filter((c) => {
      const matchName = c.customerName.toLowerCase().includes(q);
      const matchPhone = Boolean(c.phone && c.phone.toLowerCase().includes(q));

      // Match by invoice: cross-reference with sales
      let matchInvoice = false;
      if (searchType === 'invoice' || searchType === 'all') {
        matchInvoice = matchingInvoiceSales.some(
          (s) =>
            s.customerName.toLowerCase() === c.customerName.toLowerCase() ||
            (c.phone && s.phone && s.phone.toLowerCase() === c.phone.toLowerCase())
        );
      }

      if (searchType === 'name') return matchName;
      if (searchType === 'phone') return matchPhone;
      if (searchType === 'invoice') return matchInvoice;
      return matchName || matchPhone || matchInvoice;
    });
  }, [customers, searchQuery, searchType, matchingInvoiceSales]);

  // Auto-select when search query results in a single match
  useEffect(() => {
    if (searchQuery.trim() && dueCustomers.length === 1) {
      setSelectedCustomer(dueCustomers[0]);
      setPayAmount(dueCustomers[0].totalDue);
    }
  }, [searchQuery, dueCustomers]);

  // Complete Invoices belonging to the selected customer
  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return [];
    const custName = selectedCustomer.customerName.trim().toLowerCase();
    const custPhone = selectedCustomer.phone?.trim();
    return sales.filter((s) => {
      const matchName = s.customerName.trim().toLowerCase() === custName;
      const matchPhone = Boolean(custPhone && custPhone !== 'N/A' && s.phone?.trim() === custPhone);
      return matchName || matchPhone;
    });
  }, [selectedCustomer, sales]);

  const handleSelectCustomer = (cust: CustomerRecord) => {
    // Find current customer from customers list to get freshest state
    const freshCust = customers.find((c) => c.id === cust.id) || cust;
    setSelectedCustomer(freshCust);
    setPayAmount(freshCust.totalDue);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleProcessDuePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setErrorMsg('অনুগ্রহ করে একজন কাস্টমার সিলেক্ট করুন');
      return;
    }

    if (payAmount <= 0) {
      setErrorMsg('পেমেন্টের পরিমাণ ০ এর বেশি হতে হবে');
      return;
    }

    if (payAmount > selectedCustomer.totalDue) {
      if (!window.confirm('প্রদত্ত টাকা বর্তমান বকেয়ার চেয়ে বেশি। আপনি কি চালিয়ে যাবেন?')) {
        return;
      }
    }

    // Format date string for the customer record and sheet
    const [year, month, day] = collectionDate.split('-');
    const formattedDateStr = `${parseInt(month, 10)}/${parseInt(day, 10)}/${year} ${collectionTime}:00`;

    payCustomerDue(selectedCustomer.id, payAmount, paymentMethod, remarks, formattedDateStr);

    const newDue = Math.max(0, selectedCustomer.totalDue - payAmount);
    setSuccessMsg(
      `সফলভাবে ${formattedDateStr} তারিখে ৳${payAmount} আদায় রেকর্ড করা হয়েছে! কাস্টমার শিটে আপডেট সম্পন্ন। নতুন বাকি: ৳${newDue}`
    );

    // Update selected customer local reference
    setSelectedCustomer({
      ...selectedCustomer,
      totalPaid: selectedCustomer.totalPaid + payAmount,
      totalDue: newDue,
      lastPaymentDate: formattedDateStr,
      lastPaymentAmount: payAmount,
      paymentHistory: [
        {
          id: `PAY-${Date.now()}`,
          date: formattedDateStr,
          amount: payAmount,
          paymentMethod,
          remarks,
          remainingDue: newDue,
        },
        ...(selectedCustomer.paymentHistory || []),
      ],
    });

    setPayAmount(0);
  };

  if (!isOpen) return null;

  return (
    <div
      id="due-payment-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#be123c] px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-rose-200" />
            <div>
              <h2 className="font-bold text-base sm:text-lg leading-tight">
                কাস্টমার ডিউ পেমেন্ট পপ-আপ (Customer Due Payment)
              </h2>
              <p className="text-xs text-rose-100">
                বকেয়া কাস্টমারদের তালিকা, সার্চ ও তাৎক্ষণিক ডিউ ক্লিয়ারেন্স
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

        {/* Modal Body */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search System with 3 Options: Customer Name, Mobile Number, Invoice Number */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-bold text-slate-700">
                কাস্টমার / ইনভয়েস সার্চ অপশন নির্বাচন করুন:
              </label>
              {/* 3 Search Options: Customer Name, Mobile Number, Invoice Number */}
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs self-start sm:self-auto">
                <button
                  type="button"
                  id="search-opt-all"
                  onClick={() => setSearchType('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                    searchType === 'all'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  সবগুলো (All)
                </button>
                <button
                  type="button"
                  id="search-opt-name"
                  onClick={() => setSearchType('name')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
                    searchType === 'name'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>Customer Name</span>
                </button>
                <button
                  type="button"
                  id="search-opt-phone"
                  onClick={() => setSearchType('phone')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
                    searchType === 'phone'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Phone className="w-3 h-3" />
                  <span>Mobile Number</span>
                </button>
                <button
                  type="button"
                  id="search-opt-invoice"
                  onClick={() => setSearchType('invoice')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition ${
                    searchType === 'invoice'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="w-3 h-3" />
                  <span>Invoice Number</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                id="due-customer-search-input"
                type="text"
                placeholder={
                  searchType === 'name'
                    ? 'কাস্টমারের নাম লিখুন (যেমন: HANIF বা Robin)...'
                    : searchType === 'phone'
                    ? 'মোবাইল নম্বর লিখুন (যেমন: 01322996278)...'
                    : searchType === 'invoice'
                    ? 'ইনভয়েস নম্বর লিখুন (যেমন: INV-1001)...'
                    : 'কাস্টমার নাম, মোবাইল নাম্বার অথবা ইনভয়েস নম্বর দিয়ে সার্চ করুন...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500 font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  ফিল্টার: <strong className="text-slate-800 uppercase">{searchType}</strong> | ফলাফল:{' '}
                  <strong className="text-rose-600">{dueCustomers.length}</strong> জন কাস্টমার
                </span>
                {searchType === 'invoice' && matchingInvoiceSales.length > 0 && (
                  <span className="text-emerald-700 font-semibold font-mono">
                    ম্যাচিং ইনভয়েস: {matchingInvoiceSales.map((s) => s.invoiceNo).join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Due Customers Table */}
            <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
              <div className="bg-slate-100/90 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>বকেয়া কাস্টমার তালিকা ({dueCustomers.length})</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  ক্লিক করে পেমেন্ট ফর্ম ওপেন করুন
                </span>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">নাম ও মোবাইল</th>
                      <th className="py-2 px-3 text-right">বাকি (Due)</th>
                      <th className="py-2 px-3">সর্বশেষ কালেকশন</th>
                      <th className="py-2 px-3 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {dueCustomers.map((c) => {
                      const isSelected = selectedCustomer?.id === c.id;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className={`cursor-pointer transition ${
                            isSelected
                              ? 'bg-rose-50/80 font-semibold'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{c.customerName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{c.phone}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600 font-mono">
                            ৳ {c.totalDue}
                          </td>
                          <td className="py-2.5 px-3">
                            {c.lastPaymentDate ? (
                              <div>
                                <span className="text-[11px] font-medium text-emerald-700 block font-mono">
                                  {c.lastPaymentDate.split(' ')[0]}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  ৳{c.lastPaymentAmount} আদায়
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">পূর্বে জমা নেই</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`text-[10px] px-2.5 py-1 rounded-md ${
                                isSelected
                                  ? 'bg-rose-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-700 hover:bg-rose-100 border border-slate-200'
                              }`}
                            >
                              {isSelected ? 'সিলেক্টেড' : 'সিলেক্ট'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {dueCustomers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          {searchQuery
                            ? 'উক্ত নাম বা নম্বরে কোনো কাস্টমার পাওয়া যায়নি'
                            : 'কোনো বকেয়া কাস্টমার নেই (সকলের ডিউ পরিশোধিত)'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Payment Entry Form & Complete Invoice/Collection Information */}
            <div className="lg:col-span-6 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
              {selectedCustomer ? (
                <div className="space-y-3">
                  {/* Customer Header Info */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                        <User className="w-4 h-4 text-rose-600" />
                        <span>{selectedCustomer.customerName}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        মোবাইল: {selectedCustomer.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-rose-600 font-bold block">
                        বর্তমান বকেয়া
                      </span>
                      <span className="text-lg font-bold text-rose-600 font-mono">
                        ৳ {selectedCustomer.totalDue}
                      </span>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 block">মোট ক্রয়</span>
                      <strong className="text-slate-800 font-mono font-bold">৳ {selectedCustomer.totalPurchases || 0}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">মোট পরিশোধ</span>
                      <strong className="text-emerald-700 font-mono font-bold">৳ {selectedCustomer.totalPaid || 0}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">বর্তমান বাকি</span>
                      <strong className="text-rose-600 font-mono font-bold">৳ {selectedCustomer.totalDue || 0}</strong>
                    </div>
                  </div>

                  {/* Information Tabs */}
                  <div className="flex border-b border-slate-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveRightTab('form')}
                      className={`pb-2 px-3 transition border-b-2 flex items-center gap-1 ${
                        activeRightTab === 'form'
                          ? 'border-rose-600 text-rose-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>ডিউ আদায় ফর্ম</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRightTab('invoices')}
                      className={`pb-2 px-3 transition border-b-2 flex items-center gap-1 ${
                        activeRightTab === 'invoices'
                          ? 'border-rose-600 text-rose-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>ইনভয়েস তালিকা ({customerInvoices.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRightTab('history')}
                      className={`pb-2 px-3 transition border-b-2 flex items-center gap-1 ${
                        activeRightTab === 'history'
                          ? 'border-rose-600 text-rose-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>কালেকশন হিস্ট্রি ({selectedCustomer.paymentHistory?.length || 0})</span>
                    </button>
                  </div>

                  {/* TAB 1: Payment Form */}
                  {activeRightTab === 'form' && (
                    <form onSubmit={handleProcessDuePayment} className="space-y-3">
                      {/* Previous Collection Notice if exists */}
                      {selectedCustomer.lastPaymentDate && (
                        <div className="bg-emerald-50/90 border border-emerald-200 rounded-md p-2 text-xs text-emerald-900 flex items-start gap-2">
                          <History className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-emerald-800 text-[11px]">
                              সর্বশেষ ডিউ কালেকশনের রেকর্ড:
                            </div>
                            <div className="text-[11px] text-emerald-700">
                              তারিখ: <span className="font-mono font-bold">{selectedCustomer.lastPaymentDate}</span> | আদায়: <span className="font-mono font-bold">৳{selectedCustomer.lastPaymentAmount || 0}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Collection Date & Time Input (User requested date tracking) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-rose-600" />
                            <span>কালেকশনের তারিখ ও সময় *</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const d = new Date();
                              setCollectionDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
                              setCollectionTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                            }}
                            className="text-[10px] text-rose-600 hover:underline font-semibold"
                          >
                            আজকের তারিখ (Now)
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            id="due-collection-date-input"
                            type="date"
                            required
                            value={collectionDate}
                            onChange={(e) => setCollectionDate(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500 font-mono"
                          />
                          <input
                            id="due-collection-time-input"
                            type="time"
                            required
                            value={collectionTime}
                            onChange={(e) => setCollectionTime(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Payment Amount Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            পরিশোধের পরিমাণ (৳) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setPayAmount(selectedCustomer.totalDue)}
                            className="text-[10px] text-rose-600 hover:underline font-semibold"
                          >
                            ফুল ডিউ (৳{selectedCustomer.totalDue})
                          </button>
                        </div>
                        <input
                          id="due-pay-amount-input"
                          type="number"
                          min={1}
                          required
                          value={payAmount}
                          onChange={(e) => setPayAmount(Number(e.target.value))}
                          className="w-full text-sm font-bold text-emerald-700 px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          পেমেন্ট মেথড
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500 font-medium"
                        >
                          <option value="Cash">Cash (নগদ)</option>
                          <option value="bKash">bKash</option>
                          <option value="Nagad">Nagad</option>
                          <option value="Bank">Bank Transfer</option>
                          <option value="Card">Card</option>
                        </select>
                      </div>

                      {/* Remarks */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          মন্তব্য / রেফারেন্স
                        </label>
                        <input
                          type="text"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500"
                        />
                      </div>

                      {/* Balance Preview */}
                      <div className="bg-white p-2.5 rounded-md border border-slate-200 text-xs flex justify-between">
                        <span className="text-slate-600">পরিশোধ পরবর্তী বকেয়া:</span>
                        <strong className="text-slate-900 font-mono">
                          ৳ {Math.max(0, selectedCustomer.totalDue - payAmount)}
                        </strong>
                      </div>

                      {/* Submit button */}
                      <button
                        id="submit-due-pay-btn"
                        type="submit"
                        className="w-full py-2.5 px-4 bg-[#be123c] hover:bg-[#9f1239] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ডিউ কালেকশন রেকর্ড ও আপডেট সম্পন্ন করুন</span>
                      </button>

                      {/* Quick Payment History Preview */}
                      {selectedCustomer.paymentHistory && selectedCustomer.paymentHistory.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1.5">
                            <History className="w-3.5 h-3.5 text-slate-500" />
                            <span>পূর্ববর্তী কালেকশন রেকর্ড ({selectedCustomer.paymentHistory.length} টি)</span>
                          </div>
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {selectedCustomer.paymentHistory.slice(0, 3).map((h) => (
                              <div
                                key={h.id}
                                className="bg-white p-1.5 rounded border border-slate-200 text-[10px] flex justify-between items-center"
                              >
                                <div>
                                  <span className="font-mono text-slate-700">{h.date}</span>
                                  <span className="text-slate-400 ml-1">({h.paymentMethod})</span>
                                </div>
                                <div className="font-bold text-emerald-700 font-mono">
                                  +৳{h.amount}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </form>
                  )}

                  {/* TAB 2: Complete Invoices Information */}
                  {activeRightTab === 'invoices' && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-600 font-medium">
                        এই কাস্টমারের মোট ইনভয়েস: <strong className="text-slate-900">{customerInvoices.length}</strong> টি
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {customerInvoices.map((inv) => (
                          <div
                            key={inv.id}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1.5 shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-700 font-mono">
                                {inv.invoiceNo}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {inv.date}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              পণ্য: <span className="font-semibold text-slate-800">{inv.productNameSummary || (inv.items || []).map((i) => i.productName).join(', ')}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100">
                              <div>
                                মোট: <strong className="font-mono text-slate-800">৳{inv.netTotal}</strong>
                              </div>
                              <div>
                                জমা: <strong className="font-mono text-emerald-700">৳{inv.payment}</strong>
                              </div>
                              <div>
                                বাকি: <strong className="font-mono text-rose-600">৳{inv.due}</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                        {customerInvoices.length === 0 && (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            এই কাস্টমারের কোনো ইনভয়েস পাওয়া যায়নি
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Complete Collection History */}
                  {activeRightTab === 'history' && (
                    <div className="space-y-2">
                      <div className="text-[11px] text-slate-600 font-medium">
                        ডিউ কালেকশন রেকর্ড সংখ্যা: <strong className="text-slate-900">{selectedCustomer.paymentHistory?.length || 0}</strong> টি
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {(selectedCustomer.paymentHistory || []).map((h) => (
                          <div
                            key={h.id}
                            className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1 shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-700 font-mono">
                                + ৳{h.amount}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {h.date}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex justify-between">
                              <span>মেথড: <strong>{h.paymentMethod}</strong></span>
                              <span>অবশিষ্ট বাকি: <strong className="text-rose-600 font-mono">৳{h.remainingDue}</strong></span>
                            </div>
                            {h.remarks && (
                              <div className="text-[10px] text-slate-500 italic">
                                মন্তব্য: {h.remarks}
                              </div>
                            )}
                          </div>
                        ))}
                        {(!selectedCustomer.paymentHistory || selectedCustomer.paymentHistory.length === 0) && (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            পূর্বে কোনো ডিউ কালেকশনের রেকর্ড জমা নেই
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <UserCheck className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                  <p className="text-xs">
                    Customer Name, Mobile Number অথবা Invoice Number দিয়ে সার্চ করে কাস্টমার সিলেক্ট করুন
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => setActiveModal('none')}
            className="px-4 py-1.5 bg-white text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
