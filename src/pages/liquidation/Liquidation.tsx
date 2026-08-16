import { useState } from 'react';
import { Plus, Search, Eye, CheckCircle, FileText, TrendingUp, Banknote, Clock, Download, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeedback } from '../../context/FeedbackContext';
import { Expense, ExpenseCategory, ExpenseStatus } from '../../types';
import Badge, { statusVariant } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const categoryLabels: Record<ExpenseCategory, string> = {
  medicines: 'Medicines',
  equipment: 'Equipment',
  supplies: 'Supplies',
  services: 'Services',
  other: 'Other',
};

const statusLabels: Record<ExpenseStatus, string> = {
  recorded: 'Recorded',
  verified: 'Verified',
  liquidated: 'Liquidated',
};

type FormData = Omit<Expense, 'id'>;

const emptyForm: FormData = {
  description: '',
  amount: 0,
  category: 'medicines',
  date: new Date().toISOString().split('T')[0],
  recordedBy: '',
  receiptNo: '',
  status: 'recorded',
};

export default function Liquidation() {
  const { currentUser } = useAuth();
  const { expenses, setExpenses } = useData();
  const { runWithFeedback } = useFeedback();
  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isOfficer = currentUser.role === 'health_officer';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormData>({ ...emptyForm, recordedBy: currentUser.name });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<Expense | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [showLiquidateConfirm, setShowLiquidateConfirm] = useState(false);
  const [liquidateTarget, setLiquidateTarget] = useState<Expense | null>(null);

  const filtered = expenses.filter((e) => {
    const matchSearch =
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.receiptNo.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const liquidatedAmount = expenses.filter((e) => e.status === 'liquidated').reduce((s, e) => s + e.amount, 0);
  const pendingAmount = expenses.filter((e) => e.status === 'recorded').reduce((s, e) => s + e.amount, 0);
  const verifiedAmount = expenses.filter((e) => e.status === 'verified').reduce((s, e) => s + e.amount, 0);

  const openAdd = () => {
    setEditExpense(null);
    setForm({ ...emptyForm, recordedBy: currentUser.name });
    setShowForm(true);
  };

  const openEdit = (e: Expense) => {
    if (e.status === 'liquidated') return;
    setEditExpense(e);
    setForm({
      description: e.description,
      amount: e.amount,
      category: e.category,
      date: e.date,
      recordedBy: e.recordedBy,
      receiptNo: e.receiptNo,
      status: e.status,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.description.trim() || !form.receiptNo.trim() || form.amount <= 0) return;
    const isEdit = !!editExpense;
    await runWithFeedback(
      async () => {
        if (editExpense) {
          setExpenses((prev) => prev.map((e) => e.id === editExpense.id ? { ...e, ...form } : e));
        } else {
          setExpenses((prev) => [...prev, { ...form, id: `exp${Date.now()}` }]);
        }
      },
      {
        loadingTitle: isEdit ? 'Saving changes...' : 'Recording expense...',
        successTitle: isEdit ? 'Expense updated' : 'Expense recorded',
        successMessage: isEdit ? `Changes to "${form.description}" have been saved.` : `Expense "${form.description}" has been recorded.`,
        autoCloseMs: 1800,
      },
    );
    setShowForm(false);
  };

  const advanceStatus = async (expense: Expense, notes?: string) => {
    const next: Record<ExpenseStatus, ExpenseStatus | null> = {
      recorded: 'verified',
      verified: 'liquidated',
      liquidated: null,
    };
    const nextStatus = next[expense.status];
    if (!nextStatus) return;

    const isVerify = expense.status === 'recorded';
    await runWithFeedback(
      async () => {
        setExpenses((prev) => prev.map((e) => e.id === expense.id ? { ...e, status: nextStatus, reviewedBy: currentUser.name, reviewNotes: notes || e.reviewNotes } : e));
      },
      {
        loadingTitle: isVerify ? 'Verifying expense...' : 'Liquidating expense...',
        successTitle: isVerify ? 'Expense verified' : 'Expense liquidated',
        successMessage: isVerify ? `"${expense.description}" has been verified.` : `"${expense.description}" has been marked as liquidated.`,
        autoCloseMs: 1800,
      },
    );
  };

  const openReview = (e: Expense) => {
    setReviewTarget(e);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleReview = async () => {
    if (!reviewTarget) return;
    // If moving to liquidated status, show confirmation first
    if (reviewTarget.status === 'verified') {
      setLiquidateTarget(reviewTarget);
      setShowReviewModal(false);
      setShowLiquidateConfirm(true);
    } else {
      await advanceStatus(reviewTarget, reviewNotes);
      setShowReviewModal(false);
      setReviewTarget(null);
    }
  };

  const confirmLiquidate = async () => {
    if (!liquidateTarget) return;
    await advanceStatus(liquidateTarget, reviewNotes);
    setShowLiquidateConfirm(false);
    setLiquidateTarget(null);
    setReviewTarget(null);
    setReviewNotes('');
  };

  const summaryCards = [
    { label: 'Total Expenses', value: totalAmount, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-100', icon: Banknote, iconColor: 'text-slate-500' },
    { label: 'Pending', value: pendingAmount, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock, iconColor: 'text-amber-500' },
    { label: 'Verified', value: verifiedAmount, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-100', icon: CheckCircle, iconColor: 'text-sky-500' },
    { label: 'Liquidated', value: liquidatedAmount, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: TrendingUp, iconColor: 'text-emerald-500' },
  ];

  const categoryBreakdown = (Object.keys(categoryLabels) as ExpenseCategory[]).map((cat) => {
    const total = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
    const pct = totalAmount > 0 ? (total / totalAmount) * 100 : 0;
    return { cat, label: categoryLabels[cat], total, pct };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const catColors: Record<ExpenseCategory, string> = {
    medicines: 'bg-teal-400',
    equipment: 'bg-sky-400',
    supplies: 'bg-amber-400',
    services: 'bg-rose-400',
    other: 'bg-slate-400',
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, color, bg, border, icon: Icon, iconColor }) => (
          <div key={label} className={`bg-white rounded-2xl p-5 border ${border} shadow-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>
                  ₱{value.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`p-2 ${bg} rounded-xl`}>
                <Icon size={16} className={iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600"
              >
                <option value="all">All Categories</option>
                {(Object.keys(categoryLabels) as ExpenseCategory[]).map((c) => (
                  <option key={c} value={c}>{categoryLabels[c]}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600"
              >
                <option value="all">All Status</option>
                <option value="recorded">Recorded</option>
                <option value="verified">Verified</option>
                <option value="liquidated">Liquidated</option>
              </select>
              {isOfficer && (
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <Plus size={15} /> Add Expense
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <Download size={15} /> Generate Report
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-700">{e.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{e.receiptNo} · {e.date}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-slate-800">
                        ₱{e.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                        {categoryLabels[e.category]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        label={statusLabels[e.status]}
                        variant={statusVariant(e.status)}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewExpense(e)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={14} />
                        </button>
                        {isOfficer && e.status !== 'liquidated' && (
                          <button
                            onClick={() => openEdit(e)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                        {isOfficer && e.status === 'liquidated' && (
                          <span className="px-2 py-0.5 text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-100 font-medium">Finalized</span>
                        )}
                        {isAdmin && e.status !== 'liquidated' && (
                          <button
                            onClick={() => openReview(e)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title={e.status === 'recorded' ? 'Review & Verify' : 'Mark Liquidated'}
                          >
                            <MessageSquare size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">No expenses found.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Expense by Category</h3>
            <div className="space-y-3">
              {categoryBreakdown.map(({ cat, label, total, pct }) => (
                <div key={cat}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                    <span className="text-xs font-bold text-slate-700">
                      ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`${catColors[cat]} h-2 rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{pct.toFixed(1)}% of total</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Liquidation Progress</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#14b8a6"
                    strokeWidth="3"
                    strokeDasharray={`${totalAmount > 0 ? (liquidatedAmount / totalAmount) * 100 : 0} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-800">
                    {totalAmount > 0 ? Math.round((liquidatedAmount / totalAmount) * 100) : 0}%
                  </span>
                  <span className="text-xs text-slate-400">done</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-teal-400 rounded-full" />
                  <span className="text-slate-500">Liquidated</span>
                </div>
                <span className="font-semibold text-slate-700">₱{liquidatedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-sky-400 rounded-full" />
                  <span className="text-slate-500">Verified</span>
                </div>
                <span className="font-semibold text-slate-700">₱{verifiedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full" />
                  <span className="text-slate-500">Pending</span>
                </div>
                <span className="font-semibold text-slate-700">₱{pendingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={viewExpense !== null} onClose={() => setViewExpense(null)} title="Expense Details" size="md">
        {viewExpense && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-800">{viewExpense.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">Receipt No: {viewExpense.receiptNo}</p>
              </div>
              <Badge label={statusLabels[viewExpense.status]} variant={statusVariant(viewExpense.status)} />
            </div>
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-center">
              <p className="text-xs text-teal-600 font-medium uppercase tracking-wider">Amount</p>
              <p className="text-3xl font-bold text-teal-700 mt-1">
                ₱{viewExpense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-400 mb-0.5">Category</p><p className="font-medium text-slate-700">{categoryLabels[viewExpense.category]}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Date</p><p className="font-medium text-slate-700">{viewExpense.date}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Recorded By</p><p className="font-medium text-slate-700">{viewExpense.recordedBy}</p></div>
              <div><p className="text-xs text-slate-400 mb-0.5">Receipt No.</p><p className="font-medium text-slate-700 font-mono">{viewExpense.receiptNo}</p></div>
            </div>
            {viewExpense.reviewedBy && (
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100 text-sm">
                <p className="text-xs text-teal-500 font-medium mb-1">Reviewed by {viewExpense.reviewedBy}</p>
                {viewExpense.reviewNotes && <p className="text-teal-700">{viewExpense.reviewNotes}</p>}
              </div>
            )}
            {isAdmin && viewExpense.status !== 'liquidated' && (
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => { openReview(viewExpense); setViewExpense(null); }}
                  className="w-full py-2.5 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors"
                >
                  {viewExpense.status === 'recorded' ? 'Review & Verify Expense' : 'Mark as Liquidated'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editExpense ? 'Edit Expense' : 'Record Expense'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="e.g. Paracetamol restock"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₱)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                {(Object.keys(categoryLabels) as ExpenseCategory[]).map((c) => (
                  <option key={c} value={c}>{categoryLabels[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Receipt No.</label>
              <input
                value={form.receiptNo}
                onChange={(e) => setForm({ ...form, receiptNo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="e.g. OR-2024-007"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">
              {editExpense ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Admin Review Modal — 7.4 */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title={reviewTarget?.status === 'recorded' ? 'Review & Verify Expense' : 'Mark as Liquidated'} size="sm">
        <div className="space-y-4">
          {reviewTarget && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm">
              <p className="font-medium text-slate-700">{reviewTarget.description}</p>
              <p className="text-teal-700 font-bold">₱{reviewTarget.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-slate-400 mt-1">{reviewTarget.receiptNo} · {reviewTarget.date}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Review Notes</label>
            <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
              placeholder="Optional review notes..." />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowReviewModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleReview} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">
              {reviewTarget?.status === 'recorded' ? 'Verify Expense' : 'Mark Liquidated'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Liquidation Report Modal — 7.5 */}
      <Modal isOpen={showReport} onClose={() => setShowReport(false)} title="Liquidation Report" size="lg">
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-slate-400">Total Expenses</p><p className="font-bold text-slate-800">₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p></div>
              <div><p className="text-xs text-slate-400">Liquidated</p><p className="font-bold text-emerald-600">₱{liquidatedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p></div>
              <div><p className="text-xs text-slate-400">Verified</p><p className="font-bold text-sky-600">₱{verifiedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p></div>
              <div><p className="text-xs text-slate-400">Pending</p><p className="font-bold text-amber-600">₱{pendingAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p></div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Description</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Amount</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Category</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Reviewed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 text-slate-700">{e.description}</td>
                    <td className="py-2 font-semibold text-slate-800">₱{e.amount.toLocaleString()}</td>
                    <td className="py-2 text-slate-500">{categoryLabels[e.category]}</td>
                    <td className="py-2"><Badge label={statusLabels[e.status]} variant={statusVariant(e.status)} /></td>
                    <td className="py-2 text-slate-400 text-xs">{e.reviewedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button onClick={() => setShowReport(false)} className="px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-800 text-white rounded-xl transition-colors flex items-center gap-2">
              <Download size={14} /> Export / Print
            </button>
          </div>
        </div>
      </Modal>

      {/* Liquidate Confirmation Modal */}
      <ConfirmModal
        isOpen={showLiquidateConfirm}
        onClose={() => { setShowLiquidateConfirm(false); setLiquidateTarget(null); }}
        onConfirm={confirmLiquidate}
        title="Confirm Liquidation"
        message={`Are you sure you want to mark the expense "${liquidateTarget?.description}" (₱${liquidateTarget?.amount?.toLocaleString()}) as liquidated? This action finalizes the expense record.`}
        confirmLabel="Mark as Liquidated"
        type="info"
        details={[
          'Expense will be marked as fully liquidated',
          'Amount will be reflected in liquidation reports',
          'This action cannot be undone'
        ]}
      />
    </div>
  );
}
