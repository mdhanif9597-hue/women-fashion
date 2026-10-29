import React, { useState, useMemo } from 'react';
import {
  X,
  FileBarChart,
  Calendar,
  Search,
  Download,
  Printer,
  TrendingUp,
  Package,
  Users,
  Layers,
  Receipt,
  Filter,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { SaleRecord, ProductItem, CustomerRecord, StockItem, ExpenseRecord } from '../types';

export type ReportCategory = 'sales' | 'products' | 'customers' | 'stock' | 'expenses';

export const ReportModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    sales,
    products,
    customers,
    stock,
    expenses,
    companyInfo,
  } = useShop();

  const isOpen = activeModal === 'report_modal';

  // Default dates: Set around the current active data month (e.g., September 2026)
  // or user's current date
  const [fromDate, setFromDate] = useState<string>('2026-09-01');
  const [toDate, setToDate] = useState<string>('2026-10-31');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('sales');
  const [hasSearched, setHasSearched] = useState<boolean>(true);
  const [tableFilterText, setTableFilterText] = useState<string>('');
  const [printStatus, setPrintStatus] = useState<string>('');

  // Date parsing helper: can parse "M/D/YYYY H:M:S", "YYYY-MM-DD", etc.
  const parseRecordDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return new Date(dateStr);
    }

    // Typical format in this system: "M/D/YYYY HH:MM:SS" or "9/12/2026 15:30:12"
    const [datePart] = dateStr.split(' ');
    if (datePart) {
      const parts = datePart.split(/[/ -]/).map(Number);
      if (parts.length === 3) {
        let [m, d, y] = parts;
        // Handle 2-digit year (e.g. 26 -> 2026)
        if (y < 100) y += 2000;
        // If m > 12 and d <= 12, user might have used D/M/Y
        if (m > 12 && d <= 12) {
          const temp = m;
          m = d;
          d = temp;
        }
        return new Date(y, m - 1, d);
      }
    }

    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const isDateInRange = (recordDateStr: string): boolean => {
    if (!fromDate && !toDate) return true;
    const recDate = parseRecordDate(recordDateStr);
    if (!recDate) return true; // Include if date format unparseable

    const checkTime = recDate.getTime();

    if (fromDate) {
      const [fromY, fromM, fromD] = fromDate.split('-').map(Number);
      const startOfDay = new Date(fromY, fromM - 1, fromD, 0, 0, 0, 0).getTime();
      if (checkTime < startOfDay) return false;
    }

    if (toDate) {
      const [toY, toM, toD] = toDate.split('-').map(Number);
      const endOfDay = new Date(toY, toM - 1, toD, 23, 59, 59, 999).getTime();
      if (checkTime > endOfDay) return false;
    }

    return true;
  };

  // Quick Preset Handlers
  const handleSetPreset = (preset: 'today' | 'last7' | 'thisMonth' | 'all') => {
    const now = new Date();
    const curYear = now.getFullYear();

    // Default reference is 2026 since data is in 2026
    const refYear = 2026;

    if (preset === 'today') {
      const todayStr = `${refYear}-09-12`;
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'last7') {
      setFromDate(`${refYear}-09-06`);
      setToDate(`${refYear}-09-13`);
    } else if (preset === 'thisMonth') {
      setFromDate(`${refYear}-09-01`);
      setToDate(`${refYear}-09-30`);
    } else if (preset === 'all') {
      setFromDate('2025-01-01');
      setToDate('2027-12-31');
    }
  };

  // Filtered Data based on Category & Date Range
  const filteredSales = useMemo(() => {
    return sales.filter((s) => isDateInRange(s.date));
  }, [sales, fromDate, toDate]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => isDateInRange(p.date));
  }, [products, fromDate, toDate]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => isDateInRange(c.date));
  }, [customers, fromDate, toDate]);

  const filteredStock = useMemo(() => {
    // For stock, can show all stock items or filter by date
    return stock.filter((s) => isDateInRange(s.date));
  }, [stock, fromDate, toDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => isDateInRange(e.date));
  }, [expenses, fromDate, toDate]);

  if (!isOpen) return null;

  // CSV Exporter for the filtered report
  const handleExportCSV = () => {
    const downloadBlob = (csvContent: string, fileName: string) => {
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const dateSlug = `${fromDate}_to_${toDate}`;

    if (selectedCategory === 'sales') {
      const headers = [
        'Date',
        'Invoice No',
        'Customer Name',
        'Phone',
        'Items Summary',
        'Qty',
        'Subtotal',
        'Discount',
        'Net Total',
        'Paid',
        'Due',
        'Profit',
        'Payment Method',
        'Remarks',
      ];
      const rows = filteredSales.map((s) => [
        s.date,
        s.invoiceNo,
        s.customerName,
        s.phone,
        s.productNameSummary || s.items.map((i) => i.productName).join(' + '),
        s.qtySummary || s.items.reduce((acc, i) => acc + i.qty, 0),
        s.subtotal,
        s.discount,
        s.netTotal,
        s.payment,
        s.due,
        s.profit,
        s.paymentMethod,
        s.remarks,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
      downloadBlob(csv, `Sales_Report_${dateSlug}.csv`);
    } else if (selectedCategory === 'products') {
      const headers = [
        'Date',
        'Product ID',
        'Purchase No',
        'Supplier',
        'Product Name',
        'Category',
        'Qty',
        'Purchase Price',
        'Sale Price',
        'Total Cost',
      ];
      const rows = filteredProducts.map((p) => [
        p.date,
        p.id,
        p.purchaseNo,
        p.supplier,
        p.product,
        p.category,
        p.qty,
        p.purchasePrice,
        p.salePrice,
        p.total,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
      downloadBlob(csv, `Products_Report_${dateSlug}.csv`);
    } else if (selectedCategory === 'customers') {
      const headers = [
        'Date Added',
        'Customer ID',
        'Customer Name',
        'Phone',
        'Total Purchase',
        'Total Paid',
        'Total Due',
        'Last Collection Date',
        'Last Paid Amount',
      ];
      const rows = filteredCustomers.map((c) => [
        c.date,
        c.id,
        c.customerName,
        c.phone,
        c.totalPurchase,
        c.totalPaid,
        c.totalDue,
        c.lastPaymentDate || '',
        c.lastPaymentAmount || 0,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
      downloadBlob(csv, `New_Customers_Report_${dateSlug}.csv`);
    } else if (selectedCategory === 'stock') {
      const headers = [
        'Date',
        'Stock ID',
        'Purchase No',
        'Product Name',
        'Category',
        'Purchased Qty',
        'Sold Qty',
        'Current Stock',
        'Purchase Price',
        'Sale Price',
      ];
      const rows = filteredStock.map((s) => [
        s.date,
        s.id,
        s.purchaseNo,
        s.productName,
        s.category,
        s.purchasedQty,
        s.soldQty,
        s.currentStock,
        s.purchasePrice,
        s.salePrice,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
      downloadBlob(csv, `Stock_Report_${dateSlug}.csv`);
    } else if (selectedCategory === 'expenses') {
      const headers = ['Date', 'Expense ID', 'Category', 'Amount', 'Note', 'Payment Method'];
      const rows = filteredExpenses.map((e) => [
        e.date,
        e.id,
        e.category,
        e.amount,
        e.note,
        e.paymentMethod || 'Cash',
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
      downloadBlob(csv, `Expenses_Report_${dateSlug}.csv`);
    }
  };

  /**
   * Builds a self-contained, standalone printable HTML document for the Report.
   * Includes company header from Admin Settings, complete table styling, KPI cards,
   * signature lines, and auto-print scripts.
   */
  const buildReportHtml = (): string => {
    const reportEl = document.getElementById('printable-report');
    const categoryNames: Record<ReportCategory, string> = {
      sales: 'বিক্রয় ও ইনভয়েস হিসাব রিপোর্ট',
      products: 'পণ্য তালিকা ও রেট রিপোর্ট',
      customers: 'কাস্টমার লেজার ও বকেয়া রিপোর্ট',
      stock: 'স্টক ও ইনভেন্টরি মজুদ রিপোর্ট',
      expenses: 'দোকানের খরচ হিসাব রিপোর্ট',
    };

    const categoryTitle = categoryNames[selectedCategory] || 'শপ রিপোর্ট';
    const reportContentHtml = reportEl ? reportEl.innerHTML : '<p>কোনো ডাটা পাওয়া যায়নি</p>';

    return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyInfo.name} - ${categoryTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      margin: 12mm 10mm 15mm 10mm;
      size: auto;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #ffffff;
      color: #0f172a;
      padding: 20px;
      font-size: 12px;
      line-height: 1.4;
    }
    .print-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }
    .btn-print {
      background: #4338ca;
      color: white;
      border: none;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-print:hover {
      background: #3730a3;
    }
    .company-header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .company-name {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .company-tagline {
      font-size: 13px;
      color: #475569;
      margin-top: 2px;
      font-weight: 500;
    }
    .company-contact {
      font-size: 12px;
      color: #334155;
      font-family: monospace;
      margin-top: 4px;
    }
    .report-meta-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .report-title-text {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
    }
    .report-date-text {
      font-size: 12px;
      color: #475569;
    }
    .kpi-grid, .grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
    }
    .kpi-grid > div, .grid > div {
      flex: 1 1 120px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      font-weight: 700;
      color: #0f172a;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .text-right {
      text-align: right;
    }
    .font-mono {
      font-family: monospace;
    }
    .font-bold, .font-semibold {
      font-weight: 700;
    }
    .footer-signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 10px;
    }
    .sign-block {
      border-top: 1px dashed #64748b;
      width: 180px;
      text-align: center;
      font-size: 11px;
      color: #475569;
      padding-top: 4px;
    }
    @media print {
      .no-print, .print-actions {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="print-actions no-print">
    <button class="btn-print" onclick="window.print()">🖨️ প্রিন্ট করুন (Print Now)</button>
    <span style="font-size: 12px; color: #475569; display: flex; align-items: center;">
      কাগজের মাপ (A4 / Letter) সিলেক্ট করে সরাসরি প্রিন্ট করুন
    </span>
  </div>

  <div class="company-header">
    <div class="company-name">${companyInfo.name}</div>
    ${companyInfo.tagline ? `<div class="company-tagline">${companyInfo.tagline}</div>` : ''}
    <div class="company-contact">ফোন: ${companyInfo.phone} • ঠিকানা: ${companyInfo.address}${companyInfo.email ? ` • ইমেইল: ${companyInfo.email}` : ''}</div>
  </div>

  <div class="report-meta-box">
    <div>
      <span class="report-title-text">${categoryTitle}</span>
    </div>
    <div class="report-date-text">
      সময়কাল: <strong>${fromDate}</strong> হতে <strong>${toDate}</strong> | প্রিন্টের সময়: ${new Date().toLocaleString('bn-BD')}
    </div>
  </div>

  <div class="report-body">
    ${reportContentHtml}
  </div>

  <div class="footer-signatures">
    <div class="sign-block">
      রিপোর্ট প্রস্তুতকারক স্বাক্ষর
    </div>
    <div class="sign-block">
      অনুমোদনকারী / স্বত্বাধিকারী
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      // Auto-trigger print after short delay
      setTimeout(function() {
        try {
          window.print();
        } catch (e) {
          console.error(e);
        }
      }, 400);
    });
  </script>
</body>
</html>`;
  };

  /**
   * Primary Print Action:
   * 1. Injects into an isolated iframe to invoke the browser's native print preview
   * 2. Falls back to window.print() and new-window options if iframe dialog is blocked
   */
  const handlePrint = () => {
    setPrintStatus('প্রিন্ট ডায়ালগ প্রস্তুত হচ্ছে...');

    try {
      const oldFrame = document.getElementById('report-print-frame');
      if (oldFrame) oldFrame.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'report-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);

      const htmlContent = buildReportHtml();
      const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;

      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(htmlContent);
        frameDoc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setPrintStatus('প্রিন্ট উইন্ডো চালু হয়েছে!');
            setTimeout(() => setPrintStatus(''), 4000);
          } catch (iframeErr) {
            console.warn('Iframe print blocked, falling back to window.print', iframeErr);
            handlePrintNewTab();
          }
        }, 350);
        return;
      }

      handlePrintNewTab();
    } catch (err) {
      console.warn('Direct report print fallback', err);
      handlePrintNewTab();
    }
  };

  /**
   * Opens Report in a New Browser Tab/Window for 100% Guaranteed Unrestricted Printing
   */
  const handlePrintNewTab = () => {
    try {
      const htmlContent = buildReportHtml();
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        setPrintStatus('নতুন ট্যাবে রিপোর্ট প্রিন্ট উইন্ডো ওপেন করা হয়েছে!');
        setTimeout(() => setPrintStatus(''), 4000);
      } else {
        // If popup blocked, fallback to downloading
        handleDownloadReportHtml();
      }
    } catch (e) {
      window.print();
    }
  };

  /**
   * Downloads the complete print-ready HTML report
   */
  const handleDownloadReportHtml = () => {
    const htmlContent = buildReportHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Report_${selectedCategory}_${fromDate}_to_${toDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setPrintStatus('রিপোর্ট ফাইল ডাউনলোড হয়েছে! ফাইলটি ওপেন করলেই প্রিন্ট ডায়ালগ আসবে।');
    setTimeout(() => setPrintStatus(''), 5000);
  };

  // Metrics for active category
  const salesSummary = {
    count: filteredSales.length,
    totalSales: filteredSales.reduce((acc, s) => acc + (s.netTotal || 0), 0),
    totalPaid: filteredSales.reduce((acc, s) => acc + (s.payment || 0), 0),
    totalDue: filteredSales.reduce((acc, s) => acc + (s.due || 0), 0),
    totalProfit: filteredSales.reduce((acc, s) => acc + (s.profit || 0), 0),
  };

  const productsSummary = {
    count: filteredProducts.length,
    totalQty: filteredProducts.reduce((acc, p) => acc + (p.qty || 0), 0),
    totalCost: filteredProducts.reduce((acc, p) => acc + (p.total || 0), 0),
  };

  const customersSummary = {
    count: filteredCustomers.length,
    totalPurchase: filteredCustomers.reduce((acc, c) => acc + (c.totalPurchase || 0), 0),
    totalPaid: filteredCustomers.reduce((acc, c) => acc + (c.totalPaid || 0), 0),
    totalDue: filteredCustomers.reduce((acc, c) => acc + (c.totalDue || 0), 0),
  };

  const stockSummary = {
    count: filteredStock.length,
    purchasedQty: filteredStock.reduce((acc, s) => acc + (s.purchasedQty || 0), 0),
    soldQty: filteredStock.reduce((acc, s) => acc + (s.soldQty || 0), 0),
    currentStock: filteredStock.reduce((acc, s) => acc + (s.currentStock || 0), 0),
    lowStockCount: filteredStock.filter((s) => s.currentStock <= 5).length,
  };

  const expensesSummary = {
    count: filteredExpenses.length,
    totalAmount: filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div
        id="report-modal"
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]"
      >
        {/* Modal Header */}
        <div className="bg-[#1e824c] text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <FileBarChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                দোকানের রিপোর্ট জেনারেটর (Shop Reports)
              </h2>
              <p className="text-[11px] text-emerald-100">
                তারিখ অনুযায়ী সেলস, প্রোডাক্ট, কাস্টমার ও স্টক রিপোর্ট ফিল্টার, প্রিন্ট এবং ডাউনলোড করুন
              </p>
            </div>
          </div>
          <button
            id="report-modal-close-btn"
            onClick={() => setActiveModal('none')}
            className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Print Feedback Status Banner */}
        {printStatus && (
          <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-200 text-indigo-900 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-semibold">{printStatus}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintNewTab}
                className="px-2.5 py-1 bg-white border border-indigo-300 text-indigo-700 rounded text-[11px] font-bold hover:bg-indigo-100 transition flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                নতুন উইন্ডোতে দেখুন
              </button>
              <button
                type="button"
                onClick={handleDownloadReportHtml}
                className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-bold hover:bg-indigo-700 transition flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                HTML প্রিন্ট ফাইল
              </button>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            {/* From Date */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>শুরুর তারিখ (From Date)</span>
              </label>
              <input
                id="report-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* To Date */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>শেষ তারিখ (To Date)</span>
              </label>
              <input
                id="report-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Category Dropdown requested by user */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>রিপোর্টের বিষয় (Report Type)</span>
              </label>
              <select
                id="report-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
              >
                <option value="sales">১. সেলস রিপোর্ট (Sales)</option>
                <option value="products">২. প্রোডাক্ট রিপোর্ট (Products)</option>
                <option value="customers">৩. নিউ কাস্টমারস (New Customers)</option>
                <option value="stock">৪. স্টক রিপোর্ট (Stock)</option>
                <option value="expenses">৫. প্রতিদিনের খরচ (Expenses)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
              <button
                id="report-search-btn"
                type="button"
                onClick={() => setHasSearched(true)}
                className="flex-1 min-w-[70px] px-3 py-2 bg-[#1e824c] hover:bg-[#166534] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>সার্চ</span>
              </button>

              <button
                id="report-print-btn"
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
                title="রিপোর্ট প্রিন্ট করুন"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট</span>
              </button>

              <button
                type="button"
                onClick={handlePrintNewTab}
                className="p-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs transition cursor-pointer"
                title="নতুন ট্যাবে রিপোর্ট প্রিন্ট প্রিভিউ খুলুন"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                id="report-download-btn"
                type="button"
                onClick={handleExportCSV}
                className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer"
                title="CSV রিপোর্ট ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Date Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium text-[11px]">কুইক সিলেক্ট:</span>
              <button
                type="button"
                onClick={() => handleSetPreset('today')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px]"
              >
                আজকে
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('last7')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px]"
              >
                গত ৭ দিন
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('thisMonth')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px]"
              >
                সেপ্টেম্বর ২০২৬
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('all')}
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px]"
              >
                সকল ডাটা
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              তারিখ রেঞ্জ: <span className="font-mono font-semibold text-slate-700">{fromDate}</span> থেকে{' '}
              <span className="font-mono font-semibold text-slate-700">{toDate}</span>
            </div>
          </div>
        </div>

        {/* Modal Main Body */}
        <div id="printable-report" className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Printable Company Brand Header */}
          <div className="text-center border-b border-slate-200 pb-3 mb-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {companyInfo.name}
            </h2>
            {companyInfo.tagline && (
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {companyInfo.tagline}
              </p>
            )}
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              ফোন: {companyInfo.phone} • ঠিকানা: {companyInfo.address}
            </p>
            <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-800">
              {selectedCategory === 'sales' && 'বিক্রয় ও ইনভয়েস হিসাব রিপোর্ট'}
              {selectedCategory === 'products' && 'পণ্য তালিকা ও বিক্রয় হিসাব'}
              {selectedCategory === 'customers' && 'কাস্টমার লেজার ও বকেয়া হিসাব'}
              {selectedCategory === 'stock' && 'স্টক ও ইনভেন্টরি মজুদ হিসাব'}
              {selectedCategory === 'expenses' && 'দোকানের খরচ হিসাব'}
              {' '}({fromDate} হতে {toDate})
            </div>
          </div>

          {/* Summary KPI Cards depending on Category */}
          {selectedCategory === 'sales' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-[11px] text-blue-700 block font-medium">মোট ইনভয়েস</span>
                <span className="text-lg font-bold text-blue-900 font-mono">{salesSummary.count} টি</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <span className="text-[11px] text-emerald-700 block font-medium">মোট বিক্রয় (৳)</span>
                <span className="text-lg font-bold text-emerald-900 font-mono">
                  ৳ {salesSummary.totalSales.toLocaleString()}
                </span>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <span className="text-[11px] text-teal-700 block font-medium">নগদ আদায়</span>
                <span className="text-lg font-bold text-teal-900 font-mono">
                  ৳ {salesSummary.totalPaid.toLocaleString()}
                </span>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <span className="text-[11px] text-rose-700 block font-medium">বাকি (Due)</span>
                <span className="text-lg font-bold text-rose-900 font-mono">
                  ৳ {salesSummary.totalDue.toLocaleString()}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-amber-700 block font-medium">নিট লাভ (Profit)</span>
                <span className="text-lg font-bold text-amber-900 font-mono">
                  ৳ {salesSummary.totalProfit.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {selectedCategory === 'products' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-[11px] text-blue-700 block font-medium">প্রোডাক্ট এন্ট্রি সংখ্যা</span>
                <span className="text-lg font-bold text-blue-900 font-mono">{productsSummary.count} টি</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <span className="text-[11px] text-indigo-700 block font-medium">মোট যুক্ত হওয়া স্টক পরিমাণ</span>
                <span className="text-lg font-bold text-indigo-900 font-mono">{productsSummary.totalQty} টি</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <span className="text-[11px] text-emerald-700 block font-medium">মোট ক্রয়মূল্য (৳)</span>
                <span className="text-lg font-bold text-emerald-900 font-mono">
                  ৳ {productsSummary.totalCost.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {selectedCategory === 'customers' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-[11px] text-blue-700 block font-medium">নতুন কাস্টমার সংখ্যা</span>
                <span className="text-lg font-bold text-blue-900 font-mono">{customersSummary.count} জন</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <span className="text-[11px] text-emerald-700 block font-medium">মোট ক্রয় (৳)</span>
                <span className="text-lg font-bold text-emerald-900 font-mono">
                  ৳ {customersSummary.totalPurchase.toLocaleString()}
                </span>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <span className="text-[11px] text-teal-700 block font-medium">মোট পরিশোধ (৳)</span>
                <span className="text-lg font-bold text-teal-900 font-mono">
                  ৳ {customersSummary.totalPaid.toLocaleString()}
                </span>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <span className="text-[11px] text-rose-700 block font-medium">মোট বাকি (Due)</span>
                <span className="text-lg font-bold text-rose-900 font-mono">
                  ৳ {customersSummary.totalDue.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {selectedCategory === 'stock' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-[11px] text-blue-700 block font-medium">মোট আইটেম</span>
                <span className="text-lg font-bold text-blue-900 font-mono">{stockSummary.count} টি</span>
              </div>
              <div className="bg-slate-50 border border-slate-300 rounded-lg p-3">
                <span className="text-[11px] text-slate-700 block font-medium">মোট ক্রয়কৃত</span>
                <span className="text-lg font-bold text-slate-900 font-mono">{stockSummary.purchasedQty} টি</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <span className="text-[11px] text-emerald-700 block font-medium">মোট বিক্রিত</span>
                <span className="text-lg font-bold text-emerald-900 font-mono">{stockSummary.soldQty} টি</span>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <span className="text-[11px] text-teal-700 block font-medium">বর্তমান অবশিষ্ট স্টক</span>
                <span className="text-lg font-bold text-teal-900 font-mono">{stockSummary.currentStock} টি</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-amber-700 block font-medium">Low Stock সতর্কবার্তা</span>
                <span className="text-lg font-bold text-amber-900 font-mono">{stockSummary.lowStockCount} টি</span>
              </div>
            </div>
          )}

          {selectedCategory === 'expenses' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <span className="text-[11px] text-blue-700 block font-medium">মোট খরচের ভাউচার</span>
                <span className="text-lg font-bold text-blue-900 font-mono">{expensesSummary.count} টি</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <span className="text-[11px] text-rose-700 block font-medium">মোট খরচের পরিমাণ (৳)</span>
                <span className="text-lg font-bold text-rose-900 font-mono">
                  ৳ {expensesSummary.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Table Search Filter & Results Count */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800">
                রিপোর্টের বিস্তারিত তালিকা
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                {selectedCategory === 'sales' && `${filteredSales.length} টি ইনভয়েস`}
                {selectedCategory === 'products' && `${filteredProducts.length} টি প্রোডাক্ট`}
                {selectedCategory === 'customers' && `${filteredCustomers.length} জন কাস্টমার`}
                {selectedCategory === 'stock' && `${filteredStock.length} টি স্টক আইটেম`}
                {selectedCategory === 'expenses' && `${filteredExpenses.length} টি খরচ`}
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="তালিকায় ফিল্টার করুন..."
                value={tableFilterText}
                onChange={(e) => setTableFilterText(e.target.value)}
                className="text-xs pl-7 pr-3 py-1 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 w-48"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
            </div>
          </div>

          {/* TABLE: SALES */}
          {selectedCategory === 'sales' && (
            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-[#e2e8f0] text-slate-700 font-bold sticky top-0 border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3">তারিখ</th>
                      <th className="py-2 px-3">ইনভয়েস নং</th>
                      <th className="py-2 px-3">কাস্টমার নাম</th>
                      <th className="py-2 px-3">ফোন</th>
                      <th className="py-2 px-3">আইটেমস</th>
                      <th className="py-2 px-3 text-right">মোট (৳)</th>
                      <th className="py-2 px-3 text-right">ডিসকাউন্ট</th>
                      <th className="py-2 px-3 text-right">পরিশোধ</th>
                      <th className="py-2 px-3 text-right">বাকি (Due)</th>
                      <th className="py-2 px-3 text-right">লাভ</th>
                      <th className="py-2 px-3">পদ্ধতি</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {filteredSales
                      .filter((s) =>
                        tableFilterText
                          ? s.customerName.toLowerCase().includes(tableFilterText.toLowerCase()) ||
                            s.invoiceNo.toLowerCase().includes(tableFilterText.toLowerCase()) ||
                            s.phone.includes(tableFilterText)
                          : true
                      )
                      .map((sale, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {sale.date}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-purple-700 whitespace-nowrap">
                            {sale.invoiceNo}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {sale.customerName}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {sale.phone}
                          </td>
                          <td className="py-2 px-3 text-slate-700 truncate max-w-[150px]">
                            {sale.productNameSummary || sale.items.map((i) => i.productName).join(', ')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            ৳ {sale.netTotal}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-rose-600">
                            {sale.discount ? `৳ ${sale.discount}` : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                            ৳ {sale.payment}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                            {sale.due > 0 ? `৳ ${sale.due}` : 'পরিশোধিত'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                            ৳ {sale.profit}
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-medium">
                            {sale.paymentMethod}
                          </td>
                        </tr>
                      ))}
                    {filteredSales.length === 0 && (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400">
                          নির্বাচিত তারিখের মধ্যে কোনো বিক্রয় রেকর্ড পাওয়া যায়নি
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE: PRODUCTS */}
          {selectedCategory === 'products' && (
            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-[#e2e8f0] text-slate-700 font-bold sticky top-0 border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3">তারিখ</th>
                      <th className="py-2 px-3">আইডি</th>
                      <th className="py-2 px-3">পারচেজ নং</th>
                      <th className="py-2 px-3">সাপ্লায়ার</th>
                      <th className="py-2 px-3">প্রোডাক্টের নাম</th>
                      <th className="py-2 px-3 text-center">পরিমাণ</th>
                      <th className="py-2 px-3 text-right">ক্রয় মূল্য</th>
                      <th className="py-2 px-3 text-right">বিক্রয় মূল্য</th>
                      <th className="py-2 px-3 text-right">মোট খরচ (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {filteredProducts
                      .filter((p) =>
                        tableFilterText
                          ? p.product.toLowerCase().includes(tableFilterText.toLowerCase()) ||
                            p.id.toLowerCase().includes(tableFilterText.toLowerCase()) ||
                            p.supplier.toLowerCase().includes(tableFilterText.toLowerCase())
                          : true
                      )
                      .map((prod, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {prod.date}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                            {prod.id}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {prod.purchaseNo}
                          </td>
                          <td className="py-2 px-3 text-slate-700">
                            {prod.supplier}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {prod.product}
                          </td>
                          <td className="py-2 px-3 text-center font-bold">
                            {prod.qty}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            ৳ {prod.purchasePrice}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700 font-medium">
                            ৳ {prod.salePrice}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            ৳ {prod.total}
                          </td>
                        </tr>
                      ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          নির্বাচিত তারিখের মধ্যে কোনো প্রোডাক্ট এন্ট্রি পাওয়া যায়নি
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE: CUSTOMERS */}
          {selectedCategory === 'customers' && (
            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-[#e2e8f0] text-slate-700 font-bold sticky top-0 border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3">যুক্ত হওয়ার তারিখ</th>
                      <th className="py-2 px-3">আইডি</th>
                      <th className="py-2 px-3">কাস্টমার নাম</th>
                      <th className="py-2 px-3">মোবাইল ফোন</th>
                      <th className="py-2 px-3 text-right">সর্বমোট কেনাকাটা</th>
                      <th className="py-2 px-3 text-right">মোট পরিশোধ</th>
                      <th className="py-2 px-3 text-right">বাকি (Due)</th>
                      <th className="py-2 px-3 text-emerald-800">সর্বশেষ ডিউ আদায়ের তারিখ</th>
                      <th className="py-2 px-3 text-right text-emerald-800">সর্বশেষ আদায় (৳)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {filteredCustomers
                      .filter((c) =>
                        tableFilterText
                          ? c.customerName.toLowerCase().includes(tableFilterText.toLowerCase()) ||
                            c.phone.includes(tableFilterText) ||
                            (c.lastPaymentDate && c.lastPaymentDate.includes(tableFilterText))
                          : true
                      )
                      .map((cust, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {cust.date}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">
                            {cust.id}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {cust.customerName}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {cust.phone}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-medium">
                            ৳ {cust.totalPurchase?.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                            ৳ {cust.totalPaid?.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                            ৳ {cust.totalDue?.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-mono text-emerald-800 text-[11px]">
                            {cust.lastPaymentDate || '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                            {cust.lastPaymentAmount ? `৳ ${cust.lastPaymentAmount.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          নির্বাচিত তারিখের মধ্যে কোনো নতুন কাস্টমার পাওয়া যায়নি
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE: STOCK */}
          {selectedCategory === 'stock' && (
            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-[#e2e8f0] text-slate-700 font-bold sticky top-0 border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3">তারিখ</th>
                      <th className="py-2 px-3">আইডি</th>
                      <th className="py-2 px-3">প্রোডাক্টের নাম</th>
                      <th className="py-2 px-3">ক্যাটাগরি</th>
                      <th className="py-2 px-3 text-center">ক্রয়কৃত</th>
                      <th className="py-2 px-3 text-center">বিক্রিত</th>
                      <th className="py-2 px-3 text-center font-bold">বর্তমান স্টক</th>
                      <th className="py-2 px-3 text-right">ক্রয়মূল্য</th>
                      <th className="py-2 px-3 text-right">বিক্রয়মূল্য</th>
                      <th className="py-2 px-3 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {filteredStock
                      .filter((s) =>
                        tableFilterText
                          ? s.productName.toLowerCase().includes(tableFilterText.toLowerCase()) ||
                            s.id.toLowerCase().includes(tableFilterText.toLowerCase())
                          : true
                      )
                      .map((item, idx) => {
                        const isLow = item.currentStock <= 5;
                        return (
                          <tr
                            key={idx}
                            className={`transition ${isLow ? 'bg-rose-50/70' : 'hover:bg-slate-50'}`}
                          >
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                              {item.date}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                              {item.id}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-900">
                              {item.productName}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {item.category}
                            </td>
                            <td className="py-2 px-3 text-center font-medium">
                              {item.purchasedQty}
                            </td>
                            <td className="py-2 px-3 text-center font-medium text-blue-700">
                              {item.soldQty}
                            </td>
                            <td
                              className={`py-2 px-3 text-center font-bold ${
                                isLow ? 'text-rose-700 font-black' : 'text-slate-900'
                              }`}
                            >
                              {item.currentStock}
                            </td>
                            <td className="py-2 px-3 text-right font-mono">
                              ৳ {item.purchasePrice}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700 font-medium">
                              ৳ {item.salePrice}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isLow ? (
                                <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                                  Low Stock
                                </span>
                              ) : (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                  In Stock
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {filteredStock.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          কোনো স্টক রেকর্ড পাওয়া যায়নি
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLE: EXPENSES */}
          {selectedCategory === 'expenses' && (
            <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead className="bg-[#e2e8f0] text-slate-700 font-bold sticky top-0 border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3">তারিখ</th>
                      <th className="py-2 px-3">ভাউচার আইডি</th>
                      <th className="py-2 px-3">খরচের ক্যাটাগরি</th>
                      <th className="py-2 px-3 text-right">পরিমাণ (৳)</th>
                      <th className="py-2 px-3">মাধ্যম</th>
                      <th className="py-2 px-3">বিবরণ / নোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {filteredExpenses
                      .filter((e) =>
                        tableFilterText
                          ? e.category.toLowerCase().includes(tableFilterText.toLowerCase()) ||
                            e.note.toLowerCase().includes(tableFilterText.toLowerCase()) ||
                            e.id.toLowerCase().includes(tableFilterText.toLowerCase())
                          : true
                      )
                      .map((exp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {exp.date}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">
                            {exp.id}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {exp.category}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                            ৳ {exp.amount?.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-medium">
                            {exp.paymentMethod || 'Cash'}
                          </td>
                          <td className="py-2 px-3 text-slate-600">
                            {exp.note || '-'}
                          </td>
                        </tr>
                      ))}
                    {filteredExpenses.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          নির্বাচিত তারিখের মধ্যে কোনো খরচ এন্ট্রি পাওয়া যায়নি
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            কোম্পানি: <strong className="text-slate-800">{companyInfo.name}</strong> • গুগল শিট সিঙ্ক এবং সরাসরি প্রিন্ট সুবিধা সমর্থিত
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>রিপোর্ট প্রিন্ট করুন</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV ডাউনলোড</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('none')}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
