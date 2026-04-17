'use client'

import { useState } from 'react'
import {
  ShoppingCart, Plus, Search, X, ChevronRight, Calendar,
  User, Home, CreditCard, AlertTriangle, CheckCircle,
  Clock, TrendingUp, Filter, Eye, DollarSign,
} from 'lucide-react'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Mock Data ──
const sales = [
  {
    id: 's1', unit: 'A-3-1 (3+1)', project: 'Park Evler', customer: 'Ahmet Kaya',
    sale_date: '2026-01-20', sale_price: 3500000, down_payment: 700000, remaining_debt: 2800000,
    installment_count: 24, status: 'active', created_by: 'Mehmet Yılmaz',
    installments: [
      { no: 1, due_date: '2026-02-15', amount: 116667, paid_amount: 116667, status: 'paid' },
      { no: 2, due_date: '2026-03-15', amount: 116667, paid_amount: 116667, status: 'paid' },
      { no: 3, due_date: '2026-04-15', amount: 116667, paid_amount: 45000, status: 'partial' },
      { no: 4, due_date: '2026-05-15', amount: 116667, paid_amount: 0, status: 'pending' },
      { no: 5, due_date: '2026-06-15', amount: 116667, paid_amount: 0, status: 'pending' },
      { no: 6, due_date: '2026-07-15', amount: 116667, paid_amount: 0, status: 'pending' },
    ],
    payments: [
      { date: '2026-01-20', amount: 700000, method: 'bank_transfer', ref: 'HAV-001' },
      { date: '2026-02-15', amount: 116667, method: 'bank_transfer', ref: 'HAV-002' },
      { date: '2026-03-15', amount: 116667, method: 'cash', ref: 'NAK-001' },
      { date: '2026-04-05', amount: 45000, method: 'bank_transfer', ref: 'HAV-003' },
    ],
  },
  {
    id: 's2', unit: 'B-5-2 (2+1)', project: 'Deniz Konakları', customer: 'Fatma Demir',
    sale_date: '2025-11-10', sale_price: 2900000, down_payment: 580000, remaining_debt: 2320000,
    installment_count: 36, status: 'active', created_by: 'Ayşe Güneş',
    installments: [
      { no: 1, due_date: '2025-12-15', amount: 64444, paid_amount: 64444, status: 'paid' },
      { no: 2, due_date: '2026-01-15', amount: 64444, paid_amount: 64444, status: 'paid' },
      { no: 3, due_date: '2026-02-15', amount: 64444, paid_amount: 64444, status: 'paid' },
      { no: 4, due_date: '2026-03-01', amount: 64444, paid_amount: 0, status: 'overdue' },
      { no: 5, due_date: '2026-04-15', amount: 64444, paid_amount: 0, status: 'pending' },
    ],
    payments: [
      { date: '2025-11-10', amount: 580000, method: 'bank_transfer', ref: 'HAV-010' },
      { date: '2025-12-15', amount: 64444, method: 'bank_transfer', ref: 'HAV-011' },
      { date: '2026-01-16', amount: 64444, method: 'cash', ref: 'NAK-004' },
      { date: '2026-02-15', amount: 64444, method: 'credit_card', ref: 'KK-001' },
    ],
  },
  {
    id: 's3', unit: 'A-7-1 (3+1)', project: 'Park Evler', customer: 'Ali Şahin',
    sale_date: '2026-02-05', sale_price: 3700000, down_payment: 1850000, remaining_debt: 1850000,
    installment_count: 12, status: 'active', created_by: 'Mehmet Yılmaz',
    installments: [
      { no: 1, due_date: '2026-03-05', amount: 154167, paid_amount: 0, status: 'overdue' },
      { no: 2, due_date: '2026-04-05', amount: 154167, paid_amount: 0, status: 'pending' },
      { no: 3, due_date: '2026-05-05', amount: 154167, paid_amount: 0, status: 'pending' },
    ],
    payments: [
      { date: '2026-02-05', amount: 1850000, method: 'bank_transfer', ref: 'HAV-020' },
    ],
  },
  {
    id: 's4', unit: 'A-1-1 (2+1)', project: 'Mavi Göl Evleri', customer: 'Elif Yıldız',
    sale_date: '2025-05-20', sale_price: 1800000, down_payment: 1800000, remaining_debt: 0,
    installment_count: 0, status: 'completed', created_by: 'Mehmet Yılmaz',
    installments: [],
    payments: [
      { date: '2025-05-20', amount: 1800000, method: 'bank_transfer', ref: 'HAV-050' },
    ],
  },
]

const saleStatusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active:    { label: 'Aktif',     color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
  completed: { label: 'Tamamlandı', color: 'text-blue-700',  bg: 'bg-blue-50',    icon: CheckCircle },
  cancelled: { label: 'İptal',     color: 'text-red-700',    bg: 'bg-red-50',     icon: X },
}

const installmentStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  paid:    { label: 'Ödendi',  color: 'text-emerald-700', bg: 'bg-emerald-50' },
  partial: { label: 'Kısmi',   color: 'text-amber-700',   bg: 'bg-amber-50' },
  pending: { label: 'Bekliyor', color: 'text-gray-600',    bg: 'bg-gray-50' },
  overdue: { label: 'Gecikmiş', color: 'text-red-700',     bg: 'bg-red-50' },
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: 'Havale/EFT',
  cash: 'Nakit',
  credit_card: 'Kredi Kartı',
  check: 'Çek',
}

type View = 'all' | 'overdue'

export default function SalesPage() {
  const [view, setView] = useState<View>('all')
  const [search, setSearch] = useState('')
  const [selectedSale, setSelectedSale] = useState<typeof sales[0] | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Stats
  const totalRevenue = sales.reduce((s, sale) => s + sale.sale_price, 0)
  const totalCollected = sales.reduce((s, sale) => s + sale.payments.reduce((ps, p) => ps + p.amount, 0), 0)
  const totalOverdue = sales.reduce((s, sale) =>
    s + sale.installments.filter(i => i.status === 'overdue').reduce((is, i) => is + (i.amount - i.paid_amount), 0), 0)
  const activeSales = sales.filter(s => s.status === 'active').length

  const filteredSales = sales.filter(sale => {
    if (view === 'overdue') return sale.installments.some(i => i.status === 'overdue')
    const matchSearch =
      sale.customer.toLowerCase().includes(search.toLowerCase()) ||
      sale.unit.toLowerCase().includes(search.toLowerCase()) ||
      sale.project.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || sale.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Satışlar & Tahsilat</h1>
          <p className="text-sm text-gray-500 mt-1">{sales.length} satış kaydı</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" /> Yeni Satış
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Toplam Satış Tutarı</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Tahsil Edilen</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalCollected)}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Geciken Tutar</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Aktif Satış</p>
              <p className="text-xl font-bold text-gray-900">{activeSales}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-5 w-fit">
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${view === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Tüm Satışlar
        </button>
        <button
          onClick={() => setView('overdue')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-1.5 ${view === 'overdue' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Geciken Ödemeler
        </button>
      </div>

      {/* Toolbar */}
      {view === 'all' && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Müşteri, daire veya proje ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-sm transition outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="completed">Tamamlandı</option>
            <option value="cancelled">İptal</option>
          </select>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Müşteri</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Daire</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Satış Tutarı</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Peşinat</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">Kalan Borç</th>
              <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Taksit</th>
              <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Durum</th>
              <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map(sale => {
              const cfg = saleStatusConfig[sale.status]
              const hasOverdue = sale.installments.some(i => i.status === 'overdue')
              const SIcon = cfg.icon
              return (
                <tr
                  key={sale.id}
                  className={`border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer ${hasOverdue ? 'bg-red-50/30' : ''}`}
                  onClick={() => setSelectedSale(sale)}
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">{sale.customer}</p>
                    <p className="text-xs text-gray-400">{formatDate(sale.sale_date)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-900">{sale.unit}</p>
                    <p className="text-xs text-gray-400">{sale.project}</p>
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">{formatCurrency(sale.sale_price)}</td>
                  <td className="px-5 py-4 text-right text-sm text-gray-600">{formatCurrency(sale.down_payment)}</td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-orange-600">{formatCurrency(sale.remaining_debt)}</td>
                  <td className="px-5 py-4 text-center text-sm text-gray-600">
                    {sale.installment_count > 0 ? `${sale.installments.filter(i => i.status === 'paid').length}/${sale.installment_count}` : '—'}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      {hasOverdue ? <AlertTriangle className="w-3 h-3 text-red-500" /> : <SIcon className="w-3 h-3" />}
                      {hasOverdue ? 'Gecikme Var' : cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ChevronRight className="w-4 h-4 text-gray-400 inline" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Satış Detay Modal ── */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-8 px-4" onClick={() => setSelectedSale(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Satış Detayı</h2>
                <p className="text-sm text-gray-500">{selectedSale.customer} — {selectedSale.unit}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Satış Tutarı</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedSale.sale_price)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Peşinat</p>
                  <p className="text-lg font-bold text-emerald-600">{formatCurrency(selectedSale.down_payment)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Kalan Borç</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(selectedSale.remaining_debt)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Taksit Sayısı</p>
                  <p className="text-lg font-bold text-blue-600">{selectedSale.installment_count || 'Peşin'}</p>
                </div>
              </div>

              {/* Sale Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" /> Müşteri: <span className="font-medium text-gray-900">{selectedSale.customer}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Home className="w-4 h-4 text-gray-400" /> Daire: <span className="font-medium text-gray-900">{selectedSale.unit} · {selectedSale.project}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" /> Satış Tarihi: <span className="font-medium text-gray-900">{formatDate(selectedSale.sale_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-gray-400" /> Kaydeden: <span className="font-medium text-gray-900">{selectedSale.created_by}</span>
                </div>
              </div>

              {/* Taksit Planı */}
              {selectedSale.installments.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary-500" /> Taksit Planı
                  </h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">#</th>
                          <th className="text-left text-xs font-semibold text-gray-500 px-4 py-2.5">Vade</th>
                          <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2.5">Tutar</th>
                          <th className="text-right text-xs font-semibold text-gray-500 px-4 py-2.5">Ödenen</th>
                          <th className="text-center text-xs font-semibold text-gray-500 px-4 py-2.5">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSale.installments.map(inst => {
                          const iCfg = installmentStatusConfig[inst.status]
                          return (
                            <tr key={inst.no} className={`border-b border-gray-100 last:border-0 ${inst.status === 'overdue' ? 'bg-red-50/50' : 'bg-white'}`}>
                              <td className="px-4 py-2.5 text-sm text-gray-700 font-medium">{inst.no}</td>
                              <td className="px-4 py-2.5 text-sm text-gray-700">{formatDate(inst.due_date)}</td>
                              <td className="px-4 py-2.5 text-sm text-right font-medium text-gray-900">{formatCurrency(inst.amount)}</td>
                              <td className="px-4 py-2.5 text-sm text-right text-gray-600">{formatCurrency(inst.paid_amount)}</td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${iCfg.bg} ${iCfg.color}`}>{iCfg.label}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ödeme Geçmişi */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary-500" /> Ödeme Geçmişi
                </h3>
                <div className="space-y-2">
                  {selectedSale.payments.map((pay, i) => (
                    <div key={i} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(pay.amount)}</p>
                          <p className="text-xs text-gray-400">{formatDate(pay.date)} · {paymentMethodLabels[pay.method] || pay.method}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-mono">{pay.ref}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Satış Modal ── */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yeni Satış Kaydı</h2>
              <button onClick={() => setShowNewForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Proje *</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                  <option value="">Proje seçin...</option>
                  <option>Park Evler</option>
                  <option>Deniz Konakları</option>
                  <option>Yeşil Vadi</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Daire *</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                  <option value="">Önce proje seçin...</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Müşteri *</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                  <option value="">Müşteri seçin...</option>
                  <option>Ahmet Kaya</option>
                  <option>Fatma Demir</option>
                  <option>Ali Şahin</option>
                  <option>Murat Özkan</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Satış Tutarı (₺) *</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="3,500,000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Peşinat (₺) *</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="700,000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Taksit Sayısı</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="24" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">İlk Taksit Tarihi</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md">Satış Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
