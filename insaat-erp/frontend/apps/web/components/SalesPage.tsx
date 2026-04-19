'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingCart, Plus, Search, Calendar, ChevronRight,
  X, CreditCard, DollarSign, Clock, CheckCircle,
  AlertTriangle, Wallet, Filter, Loader2, Edit3, Trash2, Save,
} from 'lucide-react'
import api, { ensureAuth, formatCurrency, formatDate } from '@/lib/api'

interface Installment {
  id: string; sale_id: string; installment_no: number; due_date: string;
  amount: number; paid_amount: number; status: string; paid_date: string | null
}
interface Sale {
  id: string; unit_id: string; customer_id: string; sale_date: string;
  sale_price: number; down_payment: number; remaining_debt: number;
  installment_count: number; payment_start_date: string | null;
  status: string; notes: string | null; installments: Installment[]
}
interface Customer {
  id: string; first_name: string; last_name: string; phone: string; email: string | null
}
interface UnitItem {
  id: string; unit_number: string; room_type: string; project_id: string; status: string
}
interface Project {
  id: string; name: string; code: string
}

const saleStatusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: 'Aktif', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
  completed: { label: 'Tamamlandı', color: 'text-blue-700', bg: 'bg-blue-50', icon: CreditCard },
  cancelled: { label: 'İptal', color: 'text-red-700', bg: 'bg-red-50', icon: X },
}

const instStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Bekliyor', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
  paid: { label: 'Ödendi', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  partial: { label: 'Kısmi', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  overdue: { label: 'Gecikmiş', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

export default function SalesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [units, setUnits] = useState<UnitItem[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSale, setNewSale] = useState({
    customer_id: '', unit_id: '', sale_price: '', down_payment: '',
    sale_date: new Date().toISOString().split('T')[0], installment_count: '12',
    payment_start_date: '',
  })

  useEffect(() => {
    async function load() {
      await ensureAuth()
      try {
        const [saleRes, custRes, unitRes, projRes] = await Promise.all([
          api.get('/sales'),
          api.get('/customers'),
          api.get('/units', { params: { page_size: 200 } }),
          api.get('/projects'),
        ])
        setSales(saleRes.data)
        setCustomers(custRes.data)
        setUnits(unitRes.data)
        setProjects(projRes.data)
      } catch (err) {
        console.error('Satış verileri yüklenemedi:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getCustomerName = (id: string) => {
    const c = customers.find(c => c.id === id)
    return c ? `${c.first_name} ${c.last_name}` : '—'
  }
  const getUnitInfo = (id: string) => {
    const u = units.find(u => u.id === id)
    if (!u) return '—'
    const p = projects.find(p => p.id === u.project_id)
    return `${p?.name || ''} — ${u.unit_number} (${u.room_type})`
  }
  const getUnitShort = (id: string) => {
    const u = units.find(u => u.id === id)
    return u ? `${u.unit_number} (${u.room_type})` : '—'
  }

  const filtered = sales.filter(s => {
    const cName = getCustomerName(s.customer_id).toLowerCase()
    const uInfo = getUnitInfo(s.unit_id).toLowerCase()
    const matchSearch = cName.includes(search.toLowerCase()) || uInfo.includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalSalesValue = sales.reduce((s, x) => s + Number(x.sale_price), 0)
  const totalRemaining = sales.reduce((s, x) => s + Number(x.remaining_debt), 0)
  const activeSales = sales.filter(s => s.status === 'active').length

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satışlar & Tahsilat</h1>
          <p className="text-sm text-gray-500 mt-1">{sales.length} satış · {activeSales} aktif</p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" /> Yeni Satış
        </button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary-600" /></div>
            <div><p className="text-xs text-gray-500">Toplam Satış Tutarı</p><p className="text-xl font-bold text-gray-900">{formatCurrency(totalSalesValue)}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Wallet className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-gray-500">Kalan Alacak</p><p className="text-xl font-bold text-gray-900">{formatCurrency(totalRemaining)}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
            <div><p className="text-xs text-gray-500">Tahsil Edilen</p><p className="text-xl font-bold text-gray-900">{formatCurrency(totalSalesValue - totalRemaining)}</p></div>
          </div>
        </div>
      </div>

      {/* Arama */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Müşteri adı veya daire ara..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-sm transition outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
          <option value="all">Tüm Durumlar</option>
          <option value="active">Aktif</option><option value="completed">Tamamlandı</option><option value="cancelled">İptal</option>
        </select>
      </div>

      {/* Satış Listesi */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Müşteri</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Daire</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Satış Fiyatı</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Peşinat</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Kalan</th>
              <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Taksit</th>
              <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Durum</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(sale => {
              const st = saleStatusConfig[sale.status] || saleStatusConfig.active
              const StatusIcon = st.icon
              return (
                <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer" onClick={() => setSelectedSale(sale)}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-sm text-gray-900">{getCustomerName(sale.customer_id)}</p>
                    <p className="text-xs text-gray-400">Tarih: {formatDate(sale.sale_date)}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{getUnitShort(sale.unit_id)}</td>
                  <td className="px-5 py-4 text-sm text-right font-semibold">{formatCurrency(Number(sale.sale_price))}</td>
                  <td className="px-5 py-4 text-sm text-right text-gray-600">{formatCurrency(Number(sale.down_payment))}</td>
                  <td className="px-5 py-4 text-sm text-right font-semibold text-amber-600">{formatCurrency(Number(sale.remaining_debt))}</td>
                  <td className="px-5 py-4 text-sm text-center text-gray-600">{sale.installment_count}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${st.bg} ${st.color}`}>
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

      {/* ── Satış Detay Modal ── */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4" onClick={() => setSelectedSale(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="font-bold text-gray-900">{getCustomerName(selectedSale.customer_id)}</h2>
                <p className="text-sm text-gray-500">{getUnitInfo(selectedSale.unit_id)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button disabled={saving} onClick={async () => {
                  if (!confirm('Bu satışı silmek istediğinize emin misiniz? Daire tekrar müsait olacak.')) return
                  setSaving(true)
                  try {
                    await api.delete(`/sales/${selectedSale.id}`)
                    setSales(prev => prev.filter(s => s.id !== selectedSale.id))
                    setUnits(prev => prev.map(u => u.id === selectedSale.unit_id ? { ...u, status: 'available' } : u))
                    setSelectedSale(null)
                  } catch (err: any) { alert(err?.response?.data?.detail || 'Satış silinemedi') } finally { setSaving(false) }
                }} className="p-2 rounded-lg hover:bg-red-50 transition text-red-500"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setSelectedSale(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-gray-900">{formatCurrency(Number(selectedSale.sale_price))}</p><p className="text-[10px] text-gray-500">Satış Fiyatı</p></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-emerald-600">{formatCurrency(Number(selectedSale.down_payment))}</p><p className="text-[10px] text-gray-500">Peşinat</p></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-amber-600">{formatCurrency(Number(selectedSale.remaining_debt))}</p><p className="text-[10px] text-gray-500">Kalan Borç</p></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-lg font-bold text-primary-600">{selectedSale.installment_count}</p><p className="text-[10px] text-gray-500">Taksit Sayısı</p></div>
              </div>

              {/* Taksit Tablosu */}
              {selectedSale.installments.length > 0 && (
                <>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary-500" />Taksit Planı</h3>
                  <div className="mb-3">
                    {(() => {
                      const paid = selectedSale.installments.filter(i => i.status === 'paid').length
                      const total = selectedSale.installments.length
                      return (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">{paid}/{total} taksit ödendi</span>
                            <span className="font-semibold text-primary-600">{Math.round((paid / total) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                            {selectedSale.installments.map((inst, i) => (
                              <div key={i} className={`flex-1 ${inst.status === 'paid' ? 'bg-emerald-400' : inst.status === 'partial' ? 'bg-amber-400' : inst.status === 'overdue' ? 'bg-red-400' : 'bg-gray-200'} ${i > 0 ? 'ml-0.5' : ''}`} />
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">No</th>
                          <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2">Vade</th>
                          <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2">Tutar</th>
                          <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2">Ödenen</th>
                          <th className="text-center text-xs font-semibold text-gray-500 px-4 py-2">Durum</th>
                          <th className="text-center text-xs font-semibold text-gray-500 px-4 py-2">İşlem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSale.installments.map(inst => {
                          const istCfg = instStatusConfig[inst.status] || instStatusConfig.pending
                          return (
                            <tr key={inst.id} className="border-t border-gray-50">
                              <td className="px-4 py-2.5 text-sm text-gray-700 font-medium">{inst.installment_no}</td>
                              <td className="px-4 py-2.5 text-sm text-gray-600">{formatDate(inst.due_date)}</td>
                              <td className="px-4 py-2.5 text-sm text-right font-medium">{formatCurrency(Number(inst.amount))}</td>
                              <td className="px-4 py-2.5 text-sm text-right text-emerald-600">{Number(inst.paid_amount) > 0 ? formatCurrency(Number(inst.paid_amount)) : '—'}</td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${istCfg.bg} ${istCfg.color}`}>{istCfg.label}</span>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {inst.status !== 'paid' ? (
                                  <button onClick={async () => {
                                    try {
                                      await api.patch(`/sales/${selectedSale.id}/installments/${inst.id}`, {
                                        status: 'paid', paid_amount: Number(inst.amount),
                                        paid_date: new Date().toISOString().split('T')[0],
                                      })
                                      // Taksiti lokalde güncelle
                                      const updatedInst = selectedSale.installments.map(i =>
                                        i.id === inst.id ? { ...i, status: 'paid', paid_amount: Number(i.amount), paid_date: new Date().toISOString().split('T')[0] } : i
                                      )
                                      const newRemaining = Math.max(0, Number(selectedSale.remaining_debt) - Number(inst.amount) + Number(inst.paid_amount))
                                      const updatedSale = { ...selectedSale, installments: updatedInst, remaining_debt: newRemaining }
                                      setSelectedSale(updatedSale)
                                      setSales(prev => prev.map(s => s.id === selectedSale.id ? updatedSale : s))
                                    } catch (err: any) { alert(err?.response?.data?.detail || 'Taksit güncellenemedi') }
                                  }} className="px-2 py-1 text-[10px] font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded transition">
                                    Ödendi
                                  </button>
                                ) : (
                                  <button onClick={async () => {
                                    try {
                                      await api.patch(`/sales/${selectedSale.id}/installments/${inst.id}`, {
                                        status: 'pending', paid_amount: 0, paid_date: null,
                                      })
                                      const updatedInst = selectedSale.installments.map(i =>
                                        i.id === inst.id ? { ...i, status: 'pending', paid_amount: 0, paid_date: null } : i
                                      )
                                      const newRemaining = Number(selectedSale.remaining_debt) + Number(inst.amount)
                                      const updatedSale = { ...selectedSale, installments: updatedInst, remaining_debt: newRemaining }
                                      setSelectedSale(updatedSale)
                                      setSales(prev => prev.map(s => s.id === selectedSale.id ? updatedSale : s))
                                    } catch (err: any) { alert(err?.response?.data?.detail || 'Taksit güncellenemedi') }
                                  }} className="px-2 py-1 text-[10px] font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition">
                                    İptal Et
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Satış Modal (placeholder) ── */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yeni Satış Kaydı</h2>
              <button onClick={() => setShowNewForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Müşteri *</label>
                <select value={newSale.customer_id} onChange={e => setNewSale(p => ({ ...p, customer_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                  <option value="">Seçiniz...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Daire *</label>
                <select value={newSale.unit_id} onChange={e => setNewSale(p => ({ ...p, unit_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                  <option value="">Seçiniz...</option>
                  {units.filter(u => u.status !== 'sold').map(u => <option key={u.id} value={u.id}>{u.unit_number} ({u.room_type})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Satış Fiyatı *</label><input type="number" value={newSale.sale_price} onChange={e => setNewSale(p => ({ ...p, sale_price: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="3500000" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Peşinat *</label><input type="number" value={newSale.down_payment} onChange={e => setNewSale(p => ({ ...p, down_payment: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="700000" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Satış Tarihi *</label><input type="date" value={newSale.sale_date} onChange={e => setNewSale(p => ({ ...p, sale_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Taksit Sayısı</label><input type="number" value={newSale.installment_count} onChange={e => setNewSale(p => ({ ...p, installment_count: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="24" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Ödeme Başlangıç Tarihi</label><input type="date" value={newSale.payment_start_date} onChange={e => setNewSale(p => ({ ...p, payment_start_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button disabled={saving || !newSale.customer_id || !newSale.unit_id || !newSale.sale_price || !newSale.sale_date} onClick={async () => {
                setSaving(true)
                try {
                  const payload: any = {
                    customer_id: newSale.customer_id, unit_id: newSale.unit_id,
                    sale_price: Number(newSale.sale_price), down_payment: Number(newSale.down_payment || 0),
                    sale_date: newSale.sale_date, installment_count: Number(newSale.installment_count || 0),
                  }
                  if (newSale.payment_start_date) payload.payment_start_date = newSale.payment_start_date
                  const res = await api.post('/sales', payload)
                  setSales(prev => [res.data, ...prev])
                  // Mark unit as sold locally
                  setUnits(prev => prev.map(u => u.id === newSale.unit_id ? { ...u, status: 'sold' } : u))
                  setNewSale({ customer_id: '', unit_id: '', sale_price: '', down_payment: '', sale_date: new Date().toISOString().split('T')[0], installment_count: '12', payment_start_date: '' })
                  setShowNewForm(false)
                } catch (err: any) { alert(err?.response?.data?.detail || 'Satış kaydedilemedi') } finally { setSaving(false) }
              }} className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Satışı Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
