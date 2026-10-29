import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  ShieldAlert,
  KeyRound,
  LogIn,
  Users,
  CheckCircle2,
  Cloud,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Database,
  Server,
  AlertCircle,
  Sparkles,
  UserPlus,
  Trash2,
  Edit3,
  Shield,
  User,
  Building2,
  MapPin,
  Phone,
  Mail,
  Save,
  Printer,
  Sliders,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { DEFAULT_USERS, UserAccount } from '../services/firebaseFirestore';

export const UserAuthModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    currentUser,
    userAccounts,
    loginUser,
    logoutUser,
    createOrUpdateUser,
    deleteUserAccount,
    firebaseStatus,
    cloudConsoleUrl,
    cloudProjectId,
    cloudDatabaseId,
    forcePushCloudSync,
    companyInfo,
    updateCompanyInfo,
  } = useShop();

  const isOpen = activeModal === 'user_auth';

  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'cloud'>('company');

  // Company Information State
  const [compName, setCompName] = useState(companyInfo.name);
  const [compAddress, setCompAddress] = useState(companyInfo.address);
  const [compPhone, setCompPhone] = useState(companyInfo.phone);
  const [compEmail, setCompEmail] = useState(companyInfo.email || '');
  const [compTagline, setCompTagline] = useState(companyInfo.tagline || '');
  const [companyFeedback, setCompanyFeedback] = useState<string | null>(null);

  // Sync state with context companyInfo when modal opens or companyInfo changes
  useEffect(() => {
    if (isOpen) {
      setCompName(companyInfo.name);
      setCompAddress(companyInfo.address);
      setCompPhone(companyInfo.phone);
      setCompEmail(companyInfo.email || '');
      setCompTagline(companyInfo.tagline || '');
    }
  }, [isOpen, companyInfo]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudSyncFeedback, setCloudSyncFeedback] = useState<string | null>(null);

  // Admin Create/Edit User Form State
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'cashier' | 'manager'>('cashier');
  const [newDesignation, setNewDesignation] = useState('ক্যাশিয়ার কাউন্টার');
  const [userActionFeedback, setUserActionFeedback] = useState<string | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);

  if (!isOpen) return null;

  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) {
      setCompanyFeedback('❌ কোম্পানির নাম খালি রাখা যাবে না');
      return;
    }

    updateCompanyInfo({
      name: compName.trim(),
      address: compAddress.trim() || 'নিউ মার্কেট, ঢাকা, বাংলাদেশ',
      phone: compPhone.trim() || '01322-996278',
      email: compEmail.trim(),
      tagline: compTagline.trim(),
    });

    setCompanyFeedback('✅ কোম্পানির নাম, ঠিকানা ও ফোন নম্বর সফলভাবে সংরক্ষিত হয়েছে! প্রিন্ট ও অ্যাপের সব জায়গায় স্বয়ংক্রিয়ভাবে নতুন তথ্য আপডেট হয়েছে।');
    setTimeout(() => {
      setCompanyFeedback(null);
    }, 6000);
  };

  const handleForceSync = async () => {
    setIsSyncingCloud(true);
    setCloudSyncFeedback(null);
    try {
      const res = await forcePushCloudSync();
      if (res.success) {
        setCloudSyncFeedback(`✅ ${res.message}`);
      } else {
        setCloudSyncFeedback(`⚠️ ${res.message}`);
      }
    } catch (err: any) {
      setCloudSyncFeedback(`❌ সিঙ্ক ত্রুটি: ${err?.message || 'ব্যর্থ হয়েছে'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const ok = loginUser(username.trim(), password.trim());
    if (ok) {
      setSuccess(`সফলভাবে লগইন হয়েছে: ${username}`);
      setTimeout(() => {
        setActiveModal('none');
      }, 700);
    } else {
      setError('ইউজারনেম অথবা পাসওয়ার্ড সঠিক নয়!');
    }
  };

  const handleQuickLogin = (uname: string, pass: string) => {
    setError('');
    setUsername(uname);
    setPassword(pass);
    const ok = loginUser(uname, pass);
    if (ok) {
      setSuccess(`সফলভাবে লগইন হয়েছে: ${uname}`);
      setTimeout(() => {
        setActiveModal('none');
      }, 700);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newName.trim()) {
      setUserActionFeedback('দয়া করে ইউজারনেম, পাসওয়ার্ড এবং ইউজারের পুরো নাম দিন।');
      return;
    }

    setIsSavingUser(true);
    setUserActionFeedback(null);
    try {
      const account: UserAccount = {
        username: newUsername.toLowerCase().trim(),
        password: newPassword.trim(),
        user: {
          username: newUsername.toLowerCase().trim(),
          name: newName.trim(),
          role: newRole,
          designation: newDesignation.trim() || (newRole === 'admin' ? 'অ্যাডমিন' : 'ক্যাশিয়ার'),
        },
      };

      const res = await createOrUpdateUser(account);
      if (res.success) {
        setUserActionFeedback(`✅ ${res.message}`);
        setNewUsername('');
        setNewPassword('');
        setNewName('');
        setShowAddUserForm(false);
      } else {
        setUserActionFeedback(`⚠️ ${res.message}`);
      }
    } catch (err: any) {
      setUserActionFeedback(`❌ এরর: ${err?.message || 'ব্যর্থ হয়েছে'}`);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (uname: string) => {
    if (!window.confirm(`আপনি কি সত্যিই "${uname}" ইউজার একাউন্টটি মুছে ফেলতে চান?`)) {
      return;
    }
    const res = await deleteUserAccount(uname);
    if (res.success) {
      setUserActionFeedback(`✅ ${res.message}`);
    } else {
      setUserActionFeedback(`⚠️ ${res.message}`);
    }
  };

  const handleEditClick = (account: UserAccount) => {
    setShowAddUserForm(true);
    setNewUsername(account.username);
    setNewPassword(account.password);
    setNewName(account.user.name);
    setNewRole(account.user.role);
    setNewDesignation(account.user.designation);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const currentAccountsList = userAccounts && Object.keys(userAccounts).length > 0 ? userAccounts : DEFAULT_USERS;
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">অ্যাডমিন প্যানেল: কোম্পানি ও ইউজার ম্যানেজমেন্ট</h3>
              <p className="text-[11px] text-slate-300">
                কোম্পানির নাম, ঠিকানা, ফোন পরিবর্তন ও ইউজার রোল কন্ট্রোল
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('none')}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Active User Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  currentUser.role === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{currentUser.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      currentUser.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  ইউজারনেম: <span className="font-mono text-slate-800 font-semibold">{currentUser.username}</span> | {currentUser.designation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <Cloud className="w-3.5 h-3.5" />
                  {firebaseStatus === 'connected' ? 'Firebase Active' : 'Online'}
                </span>
              </div>
              <button
                onClick={logoutUser}
                className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
              >
                লগআউট
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-1 bg-slate-100/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('company')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'company'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>কোম্পানি সেটিংস</span>
              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full uppercase">
                প্রিন্ট
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'users'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>ইউজার ও রোল</span>
              <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                {Object.keys(currentAccountsList).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cloud')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'cloud'
                  ? 'bg-white text-sky-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-sky-600" />
              <span>ক্লাউড ডাটাবেজ</span>
            </button>
          </div>

          {/* TAB 1: Company Profile & Print Info */}
          {activeTab === 'company' && (
            <div className="space-y-4">
              {!isAdmin && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>কোম্পানির নাম, ঠিকানা ও ফোন নম্বর পরিবর্তনের জন্য অ্যাডমিন একাউন্ট প্রয়োজন।</span>
                  </div>
                  <button
                    onClick={() => {
                      setUsername('admin');
                      setPassword('password123');
                      setActiveTab('users');
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] shrink-0"
                  >
                    অ্যাডমিন লগইন
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveCompanyInfo} className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      কোম্পানির প্রোফাইল ও প্রিন্ট তথ্য (Company Info)
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    সফটওয়্যার ও প্রিন্টে অটো আপডেট
                  </span>
                </div>

                {companyFeedback && (
                  <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                    companyFeedback.startsWith('✅')
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}>
                    {companyFeedback.startsWith('✅') ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{companyFeedback}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    কোম্পানির নাম (Company / Shop Name) *
                  </label>
                  <input
                    type="text"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    placeholder="যেমন: Men's & women Fashion"
                    required
                    disabled={!isAdmin}
                    className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    এই নামটি সাইডবার, হেডার, ইনভয়েস ক্যাশ মেমো এবং রিপোর্ট প্রিন্টের শীর্ষে দেখানো হবে।
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      মোবাইল / ফোন নম্বর (Mobile / Phone) *
                    </label>
                    <input
                      type="text"
                      value={compPhone}
                      onChange={(e) => setCompPhone(e.target.value)}
                      placeholder="যেমন: 01322-996278"
                      required
                      disabled={!isAdmin}
                      className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      ইমেইল এড্রেস (Email Address - ঐচ্ছিক)
                    </label>
                    <input
                      type="email"
                      value={compEmail}
                      onChange={(e) => setCompEmail(e.target.value)}
                      placeholder="info@fashionshop.com"
                      disabled={!isAdmin}
                      className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    দোকানের ঠিকানা (Shop Address) *
                  </label>
                  <textarea
                    rows={2}
                    value={compAddress}
                    onChange={(e) => setCompAddress(e.target.value)}
                    placeholder="যেমন: দোকান নং ১২, নিউ মার্কেট, ঢাকা, বাংলাদেশ"
                    required
                    disabled={!isAdmin}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    মেমো সাব-টাইটেল / স্লোগান (Tagline / Memo Subtitle)
                  </label>
                  <input
                    type="text"
                    value={compTagline}
                    onChange={(e) => setCompTagline(e.target.value)}
                    placeholder="যেমন: প্রিমিয়াম গার্মেন্টস ও লাইফস্টাইল কালেকশন"
                    disabled={!isAdmin}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {/* Live Print Preview Banner */}
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Printer className="w-3 h-3 text-slate-500" />
                    ক্যাশ মেমো ও প্রিন্ট হেডারে যেভাবে দেখাবে (Live Preview):
                  </p>
                  <div className="text-center py-3 px-4 border border-dashed border-slate-300 rounded-lg bg-slate-50/70">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      {compName || 'কোম্পানির নাম'}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {compTagline || 'প্রিমিয়াম কালেকশন'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      ফোন: {compPhone || '০১৩২২-৯৯৬২৭৮'} • {compAddress || 'ঢাকা, বাংলাদেশ'}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      কোম্পানির তথ্য সংরক্ষণ করুন (Save Company Info)
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: Users & Accounts */}
          {activeTab === 'users' && (
            <div className="space-y-4">

          {/* Login Form */}
          <form onSubmit={handleLogin} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <LogIn className="w-4 h-4 text-emerald-600" />
              লগইন করুন / ইউজার পরিবর্তন করুন
            </h4>

            {error && (
              <div className="p-2.5 bg-rose-100 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-2.5 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ইউজার নেম (Username)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or cashier1"
                  required
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পাসওয়ার্ড (Password)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition"
              >
                <KeyRound className="w-3.5 h-3.5" />
                লগইন সম্পন্ন করুন
              </button>
            </div>
          </form>

          {/* Admin Panel: Add or Edit Users */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-700" />
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  অ্যাডমিন কন্ট্রোল: নতুন ইউজার তৈরি ও পাসওয়ার্ড পরিবর্তন
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddUserForm(!showAddUserForm);
                  if (!showAddUserForm) {
                    setNewUsername('');
                    setNewPassword('');
                    setNewName('');
                    setNewRole('cashier');
                    setNewDesignation('ক্যাশিয়ার কাউন্টার');
                  }
                }}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddUserForm ? 'ফর্ম বন্ধ করুন' : '+ নতুন ইউজার যোগ করুন'}</span>
              </button>
            </div>

            {userActionFeedback && (
              <div className="p-2.5 bg-white border border-indigo-300 text-indigo-900 text-xs rounded-lg font-medium">
                {userActionFeedback}
              </div>
            )}

            {showAddUserForm && (
              <form onSubmit={handleSaveUser} className="p-3 bg-white border border-indigo-100 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ইউজারনেম (Login ID / Username) *
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="e.g. staff1, cashier3"
                      required
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      পাসওয়ার্ড (Password) *
                    </label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="e.g. pass1234"
                      required
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ইউজারের নাম (Full Name) *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. মোঃ আরিফ হোসেন"
                      required
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      পদবী (Designation)
                    </label>
                    <input
                      type="text"
                      value={newDesignation}
                      onChange={(e) => setNewDesignation(e.target.value)}
                      placeholder="e.g. সেলসম্যান / কাউন্টার ইনচার্জ"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      রোল বা ক্ষমতা (Role)
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="cashier">ক্যাশিয়ার (Cashier / Staff)</option>
                      <option value="manager">ম্যানেজার (Store Manager)</option>
                      <option value="admin">অ্যাডমিন (Admin / Owner)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUserForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingUser}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingUser ? 'সেভ হচ্ছে...' : 'ইউজার সেভ করুন'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* User Accounts & Passwords Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                সকল ইউজার ও পাসওয়ার্ড তালিকা ({Object.keys(currentAccountsList).length} টি একাউন্ট)
              </h4>
              <span className="text-[11px] text-slate-500">যেকোনো একটিতে ক্লিক করে সরাসরি লগইন করুন</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {Object.entries(currentAccountsList).map(([key, item]) => {
                const isAccAdmin = item.user.role === 'admin';
                const isCurrent = currentUser.username === item.user.username;

                return (
                  <div
                    key={key}
                    className={`p-3 flex items-center justify-between transition ${
                      isCurrent ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${
                          isAccAdmin
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isAccAdmin ? 'A' : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.user.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              isAccAdmin
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.user.role}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> সক্রিয়
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-0.5">
                          <span>User: <strong className="text-slate-800">{item.user.username}</strong></span>
                          <span>Pass: <strong className="text-slate-800">{item.password}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(`User: ${item.user.username} | Pass: ${item.password}`, key)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded text-xs transition"
                        title="কপি করুন"
                      >
                        {copiedKey === key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded text-xs transition"
                        title="সম্পাদনা / পাসওয়ার্ড পরিবর্তন"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button (Only for non-admins) */}
                      {!isAccAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(item.user.username)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded text-xs transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleQuickLogin(item.user.username, item.password)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 rounded-md shadow-2xs transition"
                      >
                        {isCurrent ? 'রিলোড' : 'সুইচ করুন'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Cloud Database Status */}
      {activeTab === 'cloud' && (
        <div className="space-y-4">
          {/* Firebase Cloud Live Status & Direct Console Link */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  ফায়ারবেস ক্লাউড ডাটাবেজ স্ট্যাটাস
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {firebaseStatus === 'connected' ? 'ক্লাউড সংযুক্ত (Connected)' : 'সংযোগ বিচ্ছিন্ন'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">প্রজেক্ট আইডি:</span>
                <span className="text-emerald-300 font-semibold truncate block">{cloudProjectId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">ডাটাবেজ আইডি (Named DB):</span>
                <span className="text-blue-300 font-semibold truncate block" title={cloudDatabaseId}>
                  {cloudDatabaseId}
                </span>
              </div>
            </div>

            {/* Sync Feedback Message */}
            {cloudSyncFeedback && (
              <div className="p-2.5 bg-slate-950/80 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg font-medium">
                {cloudSyncFeedback}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* Direct Link to Firebase Console */}
              <a
                href={cloudConsoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[200px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>সরাসরি ফায়ারবেস কনসোলে ডাটা দেখুন</span>
              </a>

              {/* Force Push Sync Button */}
              <button
                type="button"
                onClick={handleForceSync}
                disabled={isSyncingCloud}
                className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-lg border border-slate-600 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isSyncingCloud ? 'সিঙ্ক হচ্ছে...' : 'সব ডাটা ক্লাউডে পুশ করুন'}</span>
              </button>
            </div>
          </div>

          {/* Vercel Deployment Notice & Troubleshooting */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>ভার্সেল (Vercel) এ ডাটা যোগ না হওয়ার কারণ ও সমাধান:</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              ১. <strong>কেন ভার্সেলে এন্ট্রি হয়নি?</strong> আপনি যখন আগে ভার্সেলে ডেপ্লয় করেছিলেন, তখন সফটওয়্যারে ফায়ারবেস ক্লাউড কানেকশন যুক্ত ছিল না। তাই ভার্সেলের ওয়েবসাইটে আগের কোড চলছে।
            </p>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              ২. <strong>কিভাবে সমাধান করবেন?</strong> এই AI Studio অ্যাপ থেকে <strong>Export</strong> (Settings &gt; Export to GitHub অথবা Download ZIP) করে ভার্সেলে নতুন কোড <strong>Redeploy</strong> করুন। অথবা সরাসরি এই গুগল এআই স্টুডিওর লাইভ লিংকেই এন্ট্রি দিন—এখানে প্রতিটি এন্ট্রি সাথে সাথে ক্লাউডে চলে যায়।
            </p>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              ৩. <strong>ফায়ারবেসে দেখতে পাচ্ছেন না কেন?</strong> ফায়ারবেস কনসোল ডিফল্টভাবে <code>(default)</code> ডাটাবেজ দেখায়। আমাদের ডাটাবেজটির নাম হলো <code>{cloudDatabaseId}</code>। উপরের সবুজ <strong>"সরাসরি ফায়ারবেস কনসোলে ডাটা দেখুন"</strong> বাটনে ক্লিক করলেই সরাসরি সঠিক ডাটাবেজে নিয়ে যাবে!
            </p>
          </div>

          {/* Public Server Real-time Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <Cloud className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-950 mb-0.5">রিয়েল-টাইম পাবলিক ক্লাউড সিঙ্ক চালু আছে</p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                যে কোনো কাউন্টার বা ইউজার যখন কোনো নতুন প্রোডাক্ট যোগ করবে, বিক্রি করবে বা খরচ লিপিবদ্ধ করবে, তা সাথে সাথে ফায়ারবেস ক্লাউড ডাটাবেজে সংরক্ষণ হবে এবং সবার স্ক্রিনে সাথে সাথে রিয়েল-টাইমে আপডেট দেখাবে।
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setActiveModal('none')}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
