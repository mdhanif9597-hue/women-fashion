import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface SheetDeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemDetails?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SheetDeleteConfirmModal: React.FC<SheetDeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  itemDetails,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-700">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <h3 className="font-bold text-sm text-rose-900">{title || 'রেকর্ড ডিলিট নিশ্চিতকরণ'}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            আপনি কি নিশ্চিতভাবে এই রেকর্ডটি শিট ও ডাটাবেজ থেকে মুছে ফেলতে চান?
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="font-bold text-xs text-slate-800">{itemName}</div>
            {itemDetails && (
              <div className="text-[11px] text-slate-500 font-mono mt-1">{itemDetails}</div>
            )}
          </div>

          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 font-medium">
            ⚠️ সতর্কবার্তা: এটি ডিলিট করলে সফটওয়্যার ও ক্লাউড ডাটাবেজ থেকে ডাটা স্থায়ীভাবে মুছে যাবে।
          </p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            বাতিল করুন
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>হ্যাঁ, ডিলিট করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
