import { useState } from 'react';
import { Plus, Search, CreditCard as Edit2, AlertTriangle, Package, CheckCircle, Calendar, Pill } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Medicine } from '../../types';
import Modal from '../../components/ui/Modal';
import Badge, { roleLabel, statusVariant } from '../../components/ui/Badge';

type FormData = Omit<Medicine, 'id' | 'lastUpdated' | 'primaryKeyDate'>;
const emptyForm: FormData = { name: '', category: '', quantity: 0, unit: '', minStock: 0, expiryDate: '', supplier: '' };

const categories = ['Analgesic', 'Antibiotic', 'Bronchodilator', 'Antihypertensive', 'Antidiabetic', 'NSAID', 'Electrolyte', 'First Aid', 'Vitamin', 'Other'];

export default function InventoryManagement() {
  const { currentUser } = useAuth();
  const { inventory, setInventory, dispensingHistory } = useData();
  if (!currentUser) return null;

  const isOfficer = currentUser.role === 'health_officer';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'ok'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Medicine | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [activeTab, setActiveTab] = useState<'inventory' | 'dispensing'>('inventory');

  const filtered = inventory.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.supplier.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || m.category === categoryFilter;
    const isLow = m.quantity <= m.minStock;
    const matchStock = stockFilter === 'all' || (stockFilter === 'low' && isLow) || (stockFilter === 'ok' && !isLow);
    return matchSearch && matchCat && matchStock;
  });

  const lowStock = inventory.filter((m) => m.quantity <= m.minStock);
  const totalItems = inventory.reduce((s, m) => s + m.quantity, 0);

  const today = new Date();
  const ninetyDaysFromNow = new Date(today);
  ninetyDaysFromNow.setDate(today.getDate() + 90);
  const expiringItems = inventory.filter((m) => {
    const expiry = new Date(m.expiryDate);
    return expiry <= ninetyDaysFromNow && expiry >= today;
  });
  const expiredItems = inventory.filter((m) => new Date(m.expiryDate) < today);

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m: Medicine) => {
    setEditItem(m);
    setForm({ name: m.name, category: m.category, quantity: m.quantity, unit: m.unit, minStock: m.minStock, expiryDate: m.expiryDate, supplier: m.supplier });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const now = new Date().toISOString().split('T')[0];
    if (editItem) {
      setInventory((prev) => prev.map((m) => m.id === editItem.id ? { ...m, ...form, lastUpdated: now } : m));
    } else {
      setInventory((prev) => [...prev, { ...form, id: `m${Date.now()}`, lastUpdated: now, primaryKeyDate: now }]);
    }
    setShowModal(false);
  };

  const getStockStatus = (m: Medicine) => {
    const ratio = m.quantity / m.minStock;
    if (ratio <= 1) return 'critical';
    if (ratio <= 1.5) return 'low';
    return 'ok';
  };

  const stockBar = (m: Medicine) => {
    const pct = Math.min((m.quantity / (m.minStock * 3)) * 100, 100);
    const status = getStockStatus(m);
    const colors = { critical: 'bg-red-400', low: 'bg-amber-400', ok: 'bg-emerald-400' };
    return { pct, color: colors[status] };
  };

  const totalDispensed = dispensingHistory.reduce((s, d) => s + d.quantity, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-xl"><Package size={18} className="text-teal-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Items</p>
              <p className="text-2xl font-bold text-slate-800">{inventory.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl"><AlertTriangle size={18} className="text-amber-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Low Stock</p>
              <p className="text-2xl font-bold text-amber-600">{lowStock.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-xl"><Calendar size={18} className="text-rose-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-rose-600">{expiringItems.length + expiredItems.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl"><CheckCircle size={18} className="text-emerald-500" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Units</p>
              <p className="text-2xl font-bold text-slate-800">{totalItems.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-amber-500" />
            <p className="text-sm font-semibold text-amber-800">Low Stock Alert — {lowStock.length} item{lowStock.length > 1 ? 's' : ''} need restocking</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 bg-white border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                {m.name} ({m.quantity} {m.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {(expiringItems.length > 0 || expiredItems.length > 0) && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={15} className="text-rose-500" />
            <p className="text-sm font-semibold text-rose-800">Expiration Alerts</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiredItems.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 bg-white border border-rose-300 text-rose-700 px-3 py-1 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                {m.name} — EXPIRED ({m.expiryDate})
              </span>
            ))}
            {expiringItems.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 bg-white border border-rose-200 text-rose-600 px-3 py-1 rounded-full text-xs font-medium">
                <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                {m.name} — Exp. {m.expiryDate}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-full sm:w-auto">
        <button onClick={() => setActiveTab('inventory')}
          className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'inventory' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Medicine Inventory
        </button>
        <button onClick={() => setActiveTab('dispensing')}
          className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'dispensing' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Dispensing Log ({dispensingHistory.length})
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicines..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
                <option value="all">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as 'all' | 'low' | 'ok')} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-slate-600">
                <option value="all">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="ok">Adequate</option>
              </select>
              {isOfficer && (
                <button onClick={openAdd} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  <Plus size={15} /> Add Medicine
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Medicine</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider w-48">Stock Level</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Expiry</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Date Added</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Supplier</th>
                  {isOfficer && <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((m) => {
                  const { pct, color } = stockBar(m);
                  const status = getStockStatus(m);
                  const dispensedForMed = dispensingHistory.filter((d) => d.medicineId === m.id).reduce((s, d) => s + d.quantity, 0);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-slate-700">{m.name}</p>
                        <p className="text-xs text-slate-400">{m.unit}</p>
                        {dispensedForMed > 0 && <p className="text-xs text-teal-500 mt-0.5">{dispensedForMed} dispensed total</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-bold ${status === 'critical' ? 'text-red-600' : status === 'low' ? 'text-amber-600' : 'text-emerald-700'}`}>
                              {m.quantity} <span className="text-xs font-normal text-slate-400">{m.unit}</span>
                            </span>
                            <span className="text-xs text-slate-400">Min: {m.minStock}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`${color} h-2.5 rounded-full transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-xs text-slate-400">0</span>
                            <span className="text-xs text-slate-400">{m.minStock * 3}+ optimal</span>
                          </div>
                          {status !== 'ok' && (
                            <p className={`text-xs font-medium mt-0.5 ${status === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                              {status === 'critical' ? 'Critical — restock now' : 'Low — reorder soon'}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{m.category}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-sm">
                        {(() => {
                          const expiry = new Date(m.expiryDate);
                          const isExpired = expiry < today;
                          const isExpiringSoon = expiry <= ninetyDaysFromNow && !isExpired;
                          return (
                            <span className={`${isExpired ? 'text-rose-600 font-semibold' : isExpiringSoon ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                              {m.expiryDate}{isExpired ? ' (Expired)' : isExpiringSoon ? ' (Soon)' : ''}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-500">{m.primaryKeyDate ?? m.lastUpdated}</td>
                      <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-slate-500">{m.supplier}</td>
                      {isOfficer && (
                        <td className="px-5 py-3.5">
                          <button onClick={() => openEdit(m)} className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No medicines found.</div>}
          </div>
        </div>
      )}

      {activeTab === 'dispensing' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Medicine Dispensing Log</h3>
              <p className="text-xs text-slate-400 mt-0.5">{dispensingHistory.length} records · {totalDispensed.toLocaleString()} total units dispensed</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Medicine</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Reason</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Dispensed By</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[...dispensingHistory].sort((a, b) => b.dispensedAt.localeCompare(a.dispensedAt)).map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-teal-50 rounded-lg shrink-0"><Pill size={13} className="text-teal-500" /></div>
                        <p className="text-sm font-medium text-slate-700">{d.medicineName}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-slate-700">{d.patientName}</p>
                      {d.patientRole && <Badge label={roleLabel(d.patientRole)} variant={statusVariant(d.patientRole)} />}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold text-teal-700">{d.quantity}</span>
                      <span className="text-xs text-slate-400 ml-1">{d.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-500 max-w-xs truncate">{d.reason}</td>
                    <td className="px-5 py-3.5 hidden sm:table-cell text-sm text-slate-500">{d.dispensedBy}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{d.dispensedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dispensingHistory.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">No dispensing records yet.</div>}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Update Medicine' : 'Add Medicine'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">Select category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="e.g. tablets, inhalers" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Stock</label>
              <input type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Added</label>
              <input type="date" value={new Date().toISOString().split('T')[0]} readOnly className="w-full px-3 py-2 border border-slate-100 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
              <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Supplier name" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors">{editItem ? 'Save Changes' : 'Add Medicine'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
