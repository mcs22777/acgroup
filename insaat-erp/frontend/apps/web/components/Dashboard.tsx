'use client'

import {
  Building2, Home, Users, TrendingUp, AlertTriangle,
  Clock, Wallet, ArrowUpRight, ArrowDownRight, DollarSign,
} from 'lucide-react'

// ── Mock Data (API bağlandığında kaldırılacak) ──
const stockData = {
  total: 120, available: 45, reserved: 12, negotiation: 8, sold: 55,
}

const projectStocks = [
  { name: 'Park Evler', code: 'PARK-EVLER', total: 40, available: 15, reserved: 5, negotiation: 3, sold: 17 },
  { name: 'Deniz Konakları', code: 'DENIZ-KONAK', total: 60, available: 22, reserved: 5, negotiation: 3, sold: 30 },
  { name: 'Yeşil Vadi', code: 'YESIL-VADI', total: 20, available: 8, reserved: 2, negotiation: 2, sold: 8 },
]

const financialData = {
  expectedThisMonth: 1850000,
  collectedThisMonth: 1220000,
  overdueTotal: 380000,
  totalReceivable: 12500000,
  expensesThisMonth: 1450000,
}

const crmData = {
  totalCustomers: 156, openOpportunities: 28, newThisWeek: 5, wonThisMonth: 3,
}

const overduePayments = [
  { customer: 'Ahmet Kaya', unit: 'A-3-1 (3+1)', installment: 4, dueDate: '2026-03-15', amount: 45000 },
  { customer: 'Fatma Demir', unit: 'B-5-2 (2+1)', installment: 6, dueDate: '2026-03-01', amount: 32000 },
  { customer: 'Ali Şahin', unit: 'A-7-1 (3+1)', installment: 2, dueDate: '2026-02-28', amount: 55000 },
]

const upcomingExpenses = [
  { supplier: 'ABC İnşaat Malz.', description: 'Çimento alımı', amount: 450000, dueDate: '2026-04-15' },
  { supplier: 'XYZ Demir Çelik', description: 'Demir donatı', amount: 680000, dueDate: '2026-04-20' },
  { supplier: 'Doğan Taşeronluk', description: 'Nisan hakedişi', amount: 320000, dueDate: '2026-04-30' },
]

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(n)
}

function StatCard({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string; value: string | number; subtitle?: string
  icon: any; color: string; trend?: { value: string; up: boolean }
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend.up ? 'text-green-600' : 'text-red-500'}`}>
          {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend.value}
        </div>
      )}
    </div>
  )
}

function StockBar({ project }: { project: typeof projectStocks[0] }) {
  const soldPct = (project.sold / project.total) * 100
  const resPct = (project.reserved / project.total) * 100
  const negPct = (project.negotiation / project.total) * 100
  const avPct = (project.available / project.total) * 100

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-700">{project.name}</span>
        <span className="text-xs text-gray-400">{project.sold}/{project.total} satılmış</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
        <div className="bg-red-400 transition-all" style={{ width: `${soldPct}%` }} title={`Satılmış: ${project.sold}`} />
        <div className="bg-yellow-400 transition-all" style={{ width: `${resPct}%` }} title={`Rezerve: ${project.reserved}`} />
        <div className="bg-blue-400 transition-all" style={{ width: `${negPct}%` }} title={`Müzakere: ${project.negotiation}`} />
        <div className="bg-green-400 transition-all" style={{ width: `${avPct}%` }} title={`Müsait: ${project.available}`} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const collectionRate = Math.round((financialData.collectedThisMonth / financialData.expectedThisMonth) * 100)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Nisan 2026 — Anlık genel bakış</p>
      </div>

      {/* Üst Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Toplam Daire"
          value={stockData.total}
          subtitle={`${stockData.available} müsait`}
          icon={Home}
          color="bg-primary-500"
        />
        <StatCard
          title="Bu Ay Beklenen Tahsilat"
          value={formatCurrency(financialData.expectedThisMonth)}
          subtitle={`${collectionRate}% tahsil edildi`}
          icon={TrendingUp}
          color="bg-green-500"
          trend={{ value: `${formatCurrency(financialData.collectedThisMonth)} tahsil edildi`, up: true }}
        />
        <StatCard
          title="Geciken Ödemeler"
          value={formatCurrency(financialData.overdueTotal)}
          subtitle={`${overduePayments.length} taksit gecikmiş`}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <StatCard
          title="Açık Fırsatlar"
          value={crmData.openOpportunities}
          subtitle={`${crmData.newThisWeek} yeni bu hafta`}
          icon={Users}
          color="bg-blue-500"
          trend={{ value: `${crmData.wonThisMonth} satışa dönüştü`, up: true }}
        />
      </div>

      {/* Ana İçerik Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Proje Bazlı Stok */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              Proje Bazlı Stok Durumu
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Satılmış</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Rezerve</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Müzakere</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-400" /> Müsait</span>
            </div>
          </div>
          {projectStocks.map(p => <StockBar key={p.code} project={p} />)}
        </div>

        {/* Finansal Özet */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-5">
            <Wallet className="w-5 h-5 text-primary-500" />
            Finansal Özet
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Toplam Alacak</span>
              <span className="font-semibold text-gray-900">{formatCurrency(financialData.totalReceivable)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Bu Ay Beklenen</span>
              <span className="font-semibold text-green-600">{formatCurrency(financialData.expectedThisMonth)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Tahsil Edilen</span>
              <span className="font-semibold text-green-600">{formatCurrency(financialData.collectedThisMonth)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Geciken</span>
              <span className="font-semibold text-red-500">{formatCurrency(financialData.overdueTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Bu Ay Giderler</span>
              <span className="font-semibold text-orange-600">{formatCurrency(financialData.expensesThisMonth)}</span>
            </div>
          </div>
          {/* Tahsilat Progress */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-500">Tahsilat İlerlemesi</span>
              <span className="font-semibold text-primary-600">{collectionRate}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Alt Grid — Geciken & Yaklaşan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geciken Ödemeler */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Geciken Ödemeler
          </h2>
          <div className="space-y-3">
            {overduePayments.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.customer}</p>
                  <p className="text-xs text-gray-400">{item.unit} — Taksit #{item.installment}</p>
                  <p className="text-xs text-red-400">Vade: {item.dueDate}</p>
                </div>
                <span className="font-semibold text-red-600 text-sm">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Yaklaşan Firma Giderleri */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-500" />
            Yaklaşan Firma Ödemeleri
          </h2>
          <div className="space-y-3">
            {upcomingExpenses.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.supplier}</p>
                  <p className="text-xs text-gray-400">{item.description}</p>
                  <p className="text-xs text-orange-500">Vade: {item.dueDate}</p>
                </div>
                <span className="font-semibold text-orange-600 text-sm">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CRM Özet Bandı */}
      <div className="mt-6 bg-primary-500 rounded-xl p-5 text-white shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{crmData.totalCustomers}</p>
            <p className="text-sm text-primary-200 mt-1">Toplam Müşteri</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{crmData.openOpportunities}</p>
            <p className="text-sm text-primary-200 mt-1">Açık Fırsat</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{crmData.newThisWeek}</p>
            <p className="text-sm text-primary-200 mt-1">Bu Hafta Yeni</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{crmData.wonThisMonth}</p>
            <p className="text-sm text-primary-200 mt-1">Bu Ay Satışa Dönen</p>
          </div>
        </div>
      </div>
    </div>
  )
}
