'use client'

import { useState, useEffect } from 'react'
import {
  Receipt, Plus, Search, Filter, Calendar,
  Clock, CheckCircle, AlertTriangle, X, ChevronRight,
  Wallet, TrendingDown, ArrowDownRight, Loader2, Edit3, Trash2, Save,
} from 'lucide-react'
import api, { ensureAuth, formatCurrency, formatDate } from '@/lib/api'

interface Supplier {
  id: string; name: string; contact_person: string | null; phone: string | null; category: string | null
}
interface Expense {
  id: string; supplier_id: string | null; project_id: string | null; category: string;
  description: string; amount: number; due_date: string; paid_amount: number;
  paid_date: string | null; status: string; payment_method: string | null;
  invoice_no: string | null; notes: string | null
}
interface Project {
  id: string; name: string; code: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Bekliyor', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: Clock },
  paid: { label: 'Ödendi', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  partial: { label: 'Kısmi', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Wallet },
  overdue: { label: 'Gecikmiş', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
}

const categoryConfig: Record<string, { label: string; emoji: string }> = {
  malzeme: { label: 'Malzeme', emoji: '📦' },
  iscilik: { label: 'İşçilik', emoji: '👷' },
  kira: { label: 'Kira', emoji: '🏢' },
  vergi: { label: 'Vergi', emoji: '🧾' },
  taseron: { label: 'Taşeron', emoji: '🏗️' },
  diger: { label: 'Diğer', emoji: '📋' },
}

export default function ExpensesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('bank_transfer')
  const [newExpense, setNewExpense] = useState({
    description: '', category: 'malzeme', amount: '', supplier_id: '',
    project_id: '', due_date: '', invoice_no: '',
  })

  // Düzenleme state
  const [editMode, setEditMode] = useState(false)
  const [editExpense, setEditExpense] = useState<any>({})
  const [deleting, setDeleting] = useState(false)

  // Gider taksit state
  interface ExpInst { id: string; expense_id: string; installment_no: number; due_date: string; amount: number; paid_amount: number; paid_date: string | null; status: string }
  const [expInstallments, setExpInstallments] = useState<ExpInst[]>([])
  const [showInstPlan, setShowInstPlan] = useState(false)
  const [instCount, setInstCount] = useState('3')
  const [instStartDate, setInstStartDate] = useState('')

  useEffect(() => {
    async function load() {
      await ensureAuth()
      try {
        const [expRes, supRes, projRes] = await Promise.all([
          api.get('/expenses'),
          api.get('/expenses/suppliers'),
          api.get('/projects'),
        ])
        setExpenses(expRes.data)
        setSuppliers(supRes.data)
        setProjects(projRes.data)
      } catch (err) {
        console.error('Gider verileri yüklenemedi:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getSupplierName = (id: string | null) => {
    if (!id) return 'Genel Gider'
    const s = suppliers.find(s => s.id === id)
    return s ? s.name : '—'
  }
  const getProjectName = (id: string | null) => {
    if (!id) return 'Genel'
    const p = projects.find(p => p.id === id)
    return p ? p.name : '—'
  }

  const filtered = expenses.filter(e => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
      getSupplierName(e.supplier_id).toLowerCase().includes(search.toLowerCase()) ||
      (e.invoice_no || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    const matchCategory = categoryFilter === 'all' || e.category === categoryFilter
    return matchSearch && matchStatus && matchCategory
  })

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalPaid = expenses.reduce((s, e) => s + Number(e.paid_amount), 0)
  const totalOverdue = expenses.filter(e => e.status === 'overdue').reduce((s, e) => s + (Number(e.amount) - Number(e.paid_amount)), 0)

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firma Giderleri</h1>
          <p className="text-sm text-gray-500 mt-1">{expenses.length} gider kaydı · {suppliers.length} tedarikçi</p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" /> Yeni Gider
        </button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-xs text-gray-500">Toplam Gider</p><p className="text-xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-gray-500">Ödenen</p><p className="text-xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-xs text-gray-500">Geciken</p><p className="text-xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p></div>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Açıklama, tedarikçi veya fatura no ara..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-sm transition outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
          <option value="all">Tüm Durumlar</option>
          <option value="pending">Bekliyor</option><option value="paid">Ödendi</option>
          <option value="partial">Kısmi</option><option value="overdue">Gecikmiş</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
          <option value="all">Tüm Kategoriler</option>
          {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
        </select>
      </div>

      {/* Gider Listesi */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Açıklama</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Tedarikçi</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Proje</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Kategori</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Tutar</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Ödenen</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Vade</th>
              <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Durum</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(expense => {
              const st = statusConfig[expense.status] || statusConfig.pending
              const StatusIcon = st.icon
              const cat = categoryConfig[expense.category] || categoryConfig.diger
              return (
                <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer" onClick={() => setSelectedExpense(expense)}>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                    {expense.invoice_no && <p className="text-xs text-gray-400">{expense.invoice_no}</p>}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{getSupplierName(expense.supplier_id)}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{getProjectName(expense.project_id)}</td>
                  <td className="px-5 py-4 text-sm"><span className="flex items-center gap-1">{cat.emoji} {cat.label}</span></td>
                  <td className="px-5 py-4 text-sm text-right font-semibold">{formatCurrency(Number(expense.amount))}</td>
                  <td className="px-5 py-4 text-sm text-right text-emerald-600">{Number(expense.paid_amount) > 0 ? formatCurrency(Number(expense.paid_amount)) : '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{formatDate(expense.due_date)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${st.bg} ${st.color}`}>
                      <StatusIcon className="w-3 h-3" />{st.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right"><ChevronRight className="w-4 h-4 text-gray-400 inline" /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Gider Detay Modal ── */}
      {selectedExpense && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4" onClick={() => { setSelectedExpense(null); setEditMode(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Gider Detayı</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditMode(!editMode); setEditExpense({ description: selectedExpense.description, category: selectedExpense.category, amount: String(selectedExpense.amount), due_date: selectedExpense.due_date, invoice_no: selectedExpense.invoice_no || '' }) }}
                  className={`p-2 rounded-lg hover:bg-gray-100 transition ${editMode ? 'text-primary-600 bg-primary-50' : 'text-gray-500'}`}><Edit3 className="w-4 h-4" /></button>
                <button disabled={deleting} onClick={async () => {
                  if (!confirm('Bu gideri silmek istediğinize emin misiniz?')) return
                  setDeleting(true)
                  try {
                    await api.delete(`/expenses/${selectedExpense.id}`)
                    setExpenses(prev => prev.filter(e => e.id !== selectedExpense.id))
                    setSelectedExpense(null)
                  } catch (err: any) { alert(err?.response?.data?.detail || 'Gider silinemedi') } finally { setDeleting(false) }
                }} className="p-2 rounded-lg hover:bg-red-50 transition text-red-500"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => { setSelectedExpense(null); setEditMode(false) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Düzenleme */}
              {editMode ? (
                <div className="bg-primary-50/30 border border-primary-200 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Gider Bilgilerini Düzenle</h4>
                  <div><label className="block text-xs text-gray-500 mb-1">Açıklama</label><input value={editExpense.description || ''} onChange={e => setEditExpense((p: any) => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Kategori</label>
                      <select value={editExpense.category || 'malzeme'} onChange={e => setEditExpense((p: any) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
                        {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-xs text-gray-500 mb-1">Tutar (TL)</label><input type="number" value={editExpense.amount || ''} onChange={e => setEditExpense((p: any) => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Vade</label><input type="date" value={editExpense.due_date || ''} onChange={e => setEditExpense((p: any) => ({ ...p, due_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Fatura No</label><input value={editExpense.invoice_no || ''} onChange={e => setEditExpense((p: any) => ({ ...p, invoice_no: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">İptal</button>
                    <button disabled={saving} onClick={async () => {
                      setSaving(true)
                      try {
                        const payload: any = {}
                        if (editExpense.description) payload.description = editExpense.description
                        if (editExpense.category) payload.category = editExpense.category
                        if (editExpense.amount) payload.amount = Number(editExpense.amount)
                        if (editExpense.due_date) payload.due_date = editExpense.due_date
                        if (editExpense.invoice_no) payload.invoice_no = editExpense.invoice_no
                        const res = await api.put(`/expenses/${selectedExpense.id}`, payload)
                        setExpenses(prev => prev.map(e => e.id === selectedExpense.id ? res.data : e))
                        setSelectedExpense(res.data)
                        setEditMode(false)
                      } catch (err: any) { alert(err?.response?.data?.detail || 'Güncellenemedi') } finally { setSaving(false) }
                    }} className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Kaydet
                    </button>
                  </div>
                </div>
              ) : (
              <>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-1">{selectedExpense.description}</p>
                <p className="text-xs text-gray-500">{getSupplierName(selectedExpense.supplier_id)} · {getProjectName(selectedExpense.project_id)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(Number(selectedExpense.amount))}</p>
                  <p className="text-xs text-gray-500">Toplam Tutar</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(Number(selectedExpense.paid_amount))}</p>
                  <p className="text-xs text-gray-500">Ödenen</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Kategori</p><p className="font-medium">{(categoryConfig[selectedExpense.category] || categoryConfig.diger).emoji} {(categoryConfig[selectedExpense.category] || categoryConfig.diger).label}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Vade</p><p className="font-medium">{formatDate(selectedExpense.due_date)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Fatura No</p><p className="font-medium">{selectedExpense.invoice_no || '—'}</p></div>
              </div>
              </>
              )}

              {/* Ödeme Planı Oluştur */}
              {selectedExpense.status !== 'paid' && !editMode && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-500" /> Aylık Ödeme Planı</h4>
                    {!showInstPlan && (
                      <button onClick={async () => {
                        try {
                          const res = await api.get(`/expenses/${selectedExpense.id}/installments`)
                          setExpInstallments(res.data)
                        } catch { setExpInstallments([]) }
                        setShowInstPlan(true)
                      }} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        {expInstallments.length > 0 ? 'Planı Göster' : 'Plan Oluştur'}
                      </button>
                    )}
                  </div>
                  {showInstPlan && (
                    <>
                      {/* Plan oluşturma formu */}
                      <div className="flex gap-2">
                        <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">Ay Sayısı</label>
                          <input type="number" value={instCount} onChange={e => setInstCount(e.target.value)} min={1} max={60} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                        </div>
                        <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">Başlangıç</label>
                          <input type="date" value={instStartDate} onChange={e => setInstStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" />
                        </div>
                        <div className="flex items-end">
                          <button disabled={!instCount || !instStartDate} onClick={async () => {
                            try {
                              const res = await api.post(`/expenses/${selectedExpense.id}/installments`, { count: Number(instCount), start_date: instStartDate })
                              setExpInstallments(res.data)
                            } catch (err: any) { alert(err?.response?.data?.detail || 'Plan oluşturulamadı') }
                          }} className="px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">Oluştur</button>
                        </div>
                      </div>

                      {/* Taksit listesi */}
                      {expInstallments.length > 0 && (
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead><tr className="bg-gray-50">
                              <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">No</th>
                              <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">Vade</th>
                              <th className="text-right text-xs font-semibold text-gray-500 px-3 py-2">Tutar</th>
                              <th className="text-center text-xs font-semibold text-gray-500 px-3 py-2">Durum</th>
                              <th className="text-center text-xs font-semibold text-gray-500 px-3 py-2">İşlem</th>
                            </tr></thead>
                            <tbody>
                              {expInstallments.map(inst => (
                                <tr key={inst.id} className="border-t border-gray-50">
                                  <td className="px-3 py-2 text-sm text-gray-700 font-medium">{inst.installment_no}</td>
                                  <td className="px-3 py-2 text-sm text-gray-600">{formatDate(inst.due_date)}</td>
                                  <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(inst.amount)}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${inst.status === 'paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                      {inst.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {inst.status !== 'paid' ? (
                                      <button onClick={async () => {
                                        try {
                                          const res = await api.patch(`/expenses/${selectedExpense.id}/installments/${inst.id}`, {
                                            status: 'paid', paid_amount: inst.amount, paid_date: new Date().toISOString().split('T')[0],
                                          })
                                          setExpInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, status: 'paid', paid_amount: inst.amount } : i))
                                          // Ana gideri güncelle
                                          const totalPaid = expInstallments.reduce((s, i) => s + (i.id === inst.id ? inst.amount : (i.status === 'paid' ? i.paid_amount : 0)), 0)
                                          const updatedExp = { ...selectedExpense, paid_amount: totalPaid, status: totalPaid >= Number(selectedExpense.amount) ? 'paid' : 'partial' }
                                          setSelectedExpense(updatedExp)
                                          setExpenses(prev => prev.map(e => e.id === selectedExpense.id ? updatedExp : e))
                                        } catch (err: any) { alert(err?.response?.data?.detail || 'Taksit güncellenemedi') }
                                      }} className="px-2 py-1 text-[10px] font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded transition">Ödendi</button>
                                    ) : (
                                      <button onClick={async () => {
                                        try {
                                          await api.patch(`/expenses/${selectedExpense.id}/installments/${inst.id}`, {
                                            status: 'pending', paid_amount: 0, paid_date: null,
                                          })
                                          setExpInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, status: 'pending', paid_amount: 0 } : i))
                                          const totalPaid = expInstallments.reduce((s, i) => s + (i.id === inst.id ? 0 : (i.status === 'paid' ? i.paid_amount : 0)), 0)
                                          const updatedExp = { ...selectedExpense, paid_amount: totalPaid, status: totalPaid > 0 ? 'partial' : 'pending' }
                                          setSelectedExpense(updatedExp)
                                          setExpenses(prev => prev.map(e => e.id === selectedExpense.id ? updatedExp : e))
                                        } catch (err: any) { alert(err?.response?.data?.detail || 'Taksit güncellenemedi') }
                                      }} className="px-2 py-1 text-[10px] font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition">İptal</button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Tek seferlik ödeme formu */}
              {selectedExpense.status !== 'paid' && !editMode && (
                (() => {
                  const remaining = Number(selectedExpense.amount) - Number(selectedExpense.paid_amount)
                  return (
                    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-500" /> Tek Seferlik Ödeme</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tutar (TL)</label>
                          <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                            placeholder={String(remaining)} max={remaining} min={1}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Ödeme Yöntemi</label>
                          <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                            <option value="bank_transfer">Havale/EFT</option>
                            <option value="cash">Nakit</option>
                            <option value="credit_card">Kredi Kartı</option>
                            <option value="check">Çek</option>
                          </select>
                        </div>
                      </div>
                      <button disabled={paying} onClick={async () => {
                        const amt = Number(payAmount) || remaining
                        if (amt <= 0 || amt > remaining) { alert('Geçersiz tutar'); return }
                        setPaying(true)
                        try {
                          const res = await api.patch(`/expenses/${selectedExpense.id}/pay`, {
                            paid_amount: amt,
                            paid_date: new Date().toISOString().split('T')[0],
                            payment_method: payMethod,
                          })
                          setExpenses(prev => prev.map(e => e.id === selectedExpense.id ? res.data : e))
                          setSelectedExpense(res.data)
                          setPayAmount('')
                        } catch (err: any) { alert(err?.response?.data?.detail || 'Ödeme kaydedilemedi') } finally { setPaying(false) }
                      }} className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2">
                        {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        {payAmount ? `${formatCurrency(Number(payAmount))} Öde` : 'Tamamını Öde'}
                      </button>
                      <p className="text-xs text-gray-400 text-center">Kalan: {formatCurrency(remaining)}</p>
                    </div>
                  )
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Gider Modal ── */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yeni Gider Ekle</h2>
              <button onClick={() => setShowNewForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Açıklama *</label><input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Çimento alımı — 200 ton" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Kategori *</label>
                  <select value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                    {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Tutar (TL) *</label><input type="number" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="450000" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Tedarikçi</label>
                  <select value={newExpense.supplier_id} onChange={e => setNewExpense(p => ({ ...p, supplier_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                    <option value="">Yok (Genel Gider)</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Proje</label>
                  <select value={newExpense.project_id} onChange={e => setNewExpense(p => ({ ...p, project_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                    <option value="">Genel</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Vade Tarihi *</label><input type="date" value={newExpense.due_date} onChange={e => setNewExpense(p => ({ ...p, due_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Fatura No</label><input value={newExpense.invoice_no} onChange={e => setNewExpense(p => ({ ...p, invoice_no: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="FTR-2026-XXXX" /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button disabled={saving || !newExpense.description || !newExpense.amount || !newExpense.due_date} onClick={async () => {
                setSaving(true)
                try {
                  const payload: any = {
                    description: newExpense.description, category: newExpense.category,
                    amount: Number(newExpense.amount), due_date: newExpense.due_date,
                  }
                  if (newExpense.supplier_id) payload.supplier_id = newExpense.supplier_id
                  if (newExpense.project_id) payload.project_id = newExpense.project_id
                  if (newExpense.invoice_no) payload.invoice_no = newExpense.invoice_no
                  const res = await api.post('/expenses', payload)
                  setExpenses(prev => [res.data, ...prev])
                  setNewExpense({ description: '', category: 'malzeme', amount: '', supplier_id: '', project_id: '', due_date: '', invoice_no: '' })
                  setShowNewForm(false)
                } catch (err: any) { alert(err?.response?.data?.detail || 'Gider eklenemedi') } finally { setSaving(false) }
              }} className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
