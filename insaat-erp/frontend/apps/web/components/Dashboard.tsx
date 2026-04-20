'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Home, Users, TrendingUp, AlertTriangle,
  Clock, Wallet, ArrowUpRight, ArrowDownRight, DollarSign, Loader2,
} from 'lucide-react'
import api, { ensureAuth, formatCurrency } from '@/lib/api'

interface DashboardData {
  stock: { total_units: number; available: number; reserved: number; negotiation: number; sold: number }
  project_stocks: { project_id: string; project_name: string; project_code: string; total_units: number; available: number; reserved: number; negotiation: number; sold: number }[]
  financial: { expected_this_month: number; collected_this_month: number; overdue_total: number; total_receivable: number; expenses_this_month: number; expenses_paid_this_month: number }
  crm: { total_customers: number; open_opportunities: number; new_this_week: number; won_this_month: number; lost_this_month: number }
  overdue_payments: { sale_id: string; customer_name: string; unit_info: string; installment_no: number; due_date: string; amount: number; paid_amount: number; overdue_amount: number }[]
  upcoming_expenses: { expense_id: string; supplier_name: string | null; description: string; amount: number; due_date: string; status: string }[]
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

function StockBar({ project }: { project: DashboardData['project_stocks'][0] }) {
  const t = project.total_units || 1
  const soldPct = (project.sold / t) * 100
  const resPct = (project.reserved / t) * 100
  const negPct = (project.negotiation / t) * 100
  const avPct = (project.available / t) * 100

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-gray-700">{project.project_name}</span>
        <span className="text-xs text-gray-400">{project.sold}/{project.total_units} satılmış</span>
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
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      await ensureAuth()
      try {
        const res = await api.get('/dashboard/summary')
        setData(res.data)
      } catch (err) {
        console.error('Dashboard yüklenemedi:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Veriler yüklenemedi. Backend bağlantısını kontrol edin.</p>
      </div>
    )
  }

  const collectionRate = data.financial.expected_this_month > 0
    ? Math.round((Number(data.financial.collected_this_month) / Number(data.financial.expected_this_month)) * 100)
    : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} — Anlık genel bakış</p>
      </div>

      {/* Üst Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Toplam Daire"
          value={data.stock.total_units}
          subtitle={`${data.stock.available} müsait`}
          icon={Home}
          color="bg-primary-500"
        />
        <StatCard
          title="Bu Ay Beklenen Tahsilat"
          value={formatCurrency(Number(data.financial.expected_this_month))}
          subtitle={`${collectionRate}% tahsil edildi`}
          icon={TrendingUp}
          color="bg-green-500"
          trend={{ value: `${formatCurrency(Number(data.financial.collected_this_month))} tahsil edildi`, up: true }}
        />
        <StatCard
          title="Geciken Ödemeler"
          value={formatCurrency(Number(data.financial.overdue_total))}
          subtitle={`${data.overdue_payments.length} taksit gecikmiş`}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <StatCard
          title="Açık Fırsatlar"
          value={data.crm.open_opportunities}
          subtitle={`${data.crm.new_this_week} yeni bu hafta`}
          icon={Users}
          color="bg-blue-500"
          trend={{ value: `${data.crm.won_this_month} satışa dönüştü`, up: true }}
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
          {data.project_stocks.length === 0 ? (
            <p className="text-sm text-gray-400">Henüz proje verisi yok.</p>
          ) : (
            data.project_stocks.map(p => <StockBar key={p.project_code} project={p} />)
          )}
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
              <span className="font-semibold text-gray-900">{formatCurrency(Number(data.financial.total_receivable))}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Bu Ay Beklenen</span>
              <span className="font-semibold text-green-600">{formatCurrency(Number(data.financial.expected_this_month))}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Tahsil Edilen</span>
              <span className="font-semibold text-green-600">{formatCurrency(Number(data.financial.collected_this_month))}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Geciken</span>
              <span className="font-semibold text-red-500">{formatCurrency(Number(data.financial.overdue_total))}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Bu Ay Giderler</span>
              <span className="font-semibold text-orange-600">{formatCurrency(Number(data.financial.expenses_this_month))}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Ödenen Giderler</span>
              <span className="font-semibold text-green-600">{formatCurrency(Number(data.financial.expenses_paid_this_month))}</span>
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
            {data.overdue_payments.length === 0 ? (
              <p className="text-sm text-gray-400">Geciken ödeme yok 🎉</p>
            ) : (
              data.overdue_payments.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.customer_name}</p>
                    <p className="text-xs text-gray-400">{item.unit_info} — Taksit #{item.installment_no}</p>
                    <p className="text-xs text-red-400">Vade: {item.due_date}</p>
                  </div>
                  <span className="font-semibold text-red-600 text-sm">{formatCurrency(Number(item.overdue_amount))}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Yaklaşan Firma Giderleri */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-500" />
            Yaklaşan Firma Ödemeleri
          </h2>
          <div className="space-y-3">
            {data.upcoming_expenses.length === 0 ? (
              <p className="text-sm text-gray-400">Yaklaşan ödeme yok.</p>
            ) : (
              data.upcoming_expenses.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.supplier_name || 'Genel Gider'}</p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                    <p className="text-xs text-orange-500">Vade: {item.due_date}</p>
                  </div>
                  <span className="font-semibold text-orange-600 text-sm">{formatCurrency(Number(item.amount))}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CRM Özet Bandı */}
      <div className="mt-6 bg-primary-500 rounded-xl p-5 text-white shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">{data.crm.total_customers}</p>
            <p className="text-sm text-primary-200 mt-1">Toplam Müşteri</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{data.crm.open_opportunities}</p>
            <p className="text-sm text-primary-200 mt-1">Açık Fırsat</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{data.crm.new_this_week}</p>
            <p className="text-sm text-primary-200 mt-1">Bu Hafta Yeni</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{data.crm.won_this_month}</p>
            <p className="text-sm text-primary-200 mt-1">Bu Ay Kazanılan</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{data.crm.lost_this_month}</p>
            <p className="text-sm text-primary-200 mt-1">Bu Ay Kaybedilen</p>
          </div>
        </div>
      </div>
    </div>
  )
}
