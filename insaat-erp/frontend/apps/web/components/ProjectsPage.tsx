'use client'

import { useState } from 'react'
import {
  Building2, Plus, Search, LayoutGrid, List, MapPin,
  Calendar, ChevronRight, X, Home, Eye, Edit3,
  CheckCircle, Clock, PauseCircle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/api'

// ── Mock Data ──
const projects = [
  {
    id: '1', name: 'Park Evler Konutları', code: 'PARK-EVLER',
    city: 'İstanbul', district: 'Başakşehir',
    description: 'Modern mimari ile tasarlanmış 3 blok, 120 daireden oluşan prestijli konut projesi.',
    status: 'active', start_date: '2025-06-01', expected_end: '2027-03-01',
    image_url: null,
    stats: { total: 40, available: 15, reserved: 5, negotiation: 3, sold: 17 },
    blocks: [
      { id: 'b1', name: 'A Blok', total_floors: 10, units: 40 },
      { id: 'b2', name: 'B Blok', total_floors: 8, units: 32 },
    ],
  },
  {
    id: '2', name: 'Deniz Konakları', code: 'DENIZ-KONAK',
    city: 'İzmir', district: 'Karşıyaka',
    description: 'Deniz manzaralı, premium kalite malzemelerle inşa edilen lüks konut projesi.',
    status: 'active', start_date: '2025-09-15', expected_end: '2027-06-01',
    image_url: null,
    stats: { total: 60, available: 22, reserved: 5, negotiation: 3, sold: 30 },
    blocks: [
      { id: 'b3', name: 'A Blok', total_floors: 12, units: 48 },
      { id: 'b4', name: 'B Blok', total_floors: 6, units: 12 },
    ],
  },
  {
    id: '3', name: 'Yeşil Vadi Rezidans', code: 'YESIL-VADI',
    city: 'Ankara', district: 'Çankaya',
    description: 'Yeşillikler içinde, doğayla iç içe bir yaşam sunan butik proje.',
    status: 'on_hold', start_date: '2026-01-10', expected_end: '2028-01-01',
    image_url: null,
    stats: { total: 20, available: 8, reserved: 2, negotiation: 2, sold: 8 },
    blocks: [
      { id: 'b5', name: 'Tek Blok', total_floors: 5, units: 20 },
    ],
  },
  {
    id: '4', name: 'Mavi Göl Evleri', code: 'MAVI-GOL',
    city: 'Bolu', district: 'Merkez',
    description: 'Göl kenarında, doğal yaşamı ön planda tutan villa ve daire karma projesi.',
    status: 'completed', start_date: '2024-03-01', expected_end: '2025-12-01',
    image_url: null,
    stats: { total: 30, available: 0, reserved: 0, negotiation: 0, sold: 30 },
    blocks: [
      { id: 'b6', name: 'A Blok', total_floors: 5, units: 20 },
      { id: 'b7', name: 'Villa Bölgesi', total_floors: 2, units: 10 },
    ],
  },
]

const mockUnits = [
  { floor: 1, units: [
    { no: 'A-1-1', type: '2+1', area: 95, price: 2800000, status: 'sold' },
    { no: 'A-1-2', type: '3+1', area: 130, price: 3500000, status: 'sold' },
    { no: 'A-1-3', type: '2+1', area: 95, price: 2800000, status: 'reserved' },
    { no: 'A-1-4', type: '1+1', area: 65, price: 1900000, status: 'available' },
  ]},
  { floor: 2, units: [
    { no: 'A-2-1', type: '2+1', area: 95, price: 2900000, status: 'available' },
    { no: 'A-2-2', type: '3+1', area: 130, price: 3600000, status: 'negotiation' },
    { no: 'A-2-3', type: '2+1', area: 95, price: 2900000, status: 'sold' },
    { no: 'A-2-4', type: '1+1', area: 65, price: 1950000, status: 'available' },
  ]},
  { floor: 3, units: [
    { no: 'A-3-1', type: '2+1', area: 95, price: 3000000, status: 'sold' },
    { no: 'A-3-2', type: '3+1', area: 130, price: 3700000, status: 'available' },
    { no: 'A-3-3', type: '2+1', area: 95, price: 3000000, status: 'reserved' },
    { no: 'A-3-4', type: '1+1', area: 65, price: 2050000, status: 'negotiation' },
  ]},
  { floor: 4, units: [
    { no: 'A-4-1', type: '2+1', area: 95, price: 3100000, status: 'available' },
    { no: 'A-4-2', type: '3+1', area: 130, price: 3800000, status: 'available' },
    { no: 'A-4-3', type: '2+1', area: 95, price: 3100000, status: 'sold' },
    { no: 'A-4-4', type: '1+1', area: 65, price: 2100000, status: 'available' },
  ]},
  { floor: 5, units: [
    { no: 'A-5-1', type: '3+1', area: 145, price: 4200000, status: 'available' },
    { no: 'A-5-2', type: '4+1', area: 180, price: 5500000, status: 'reserved' },
    { no: 'A-5-3', type: '3+1', area: 145, price: 4200000, status: 'sold' },
    { no: 'A-5-4', type: '2+1', area: 110, price: 3300000, status: 'available' },
  ]},
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: 'Müsait',   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  reserved:    { label: 'Rezerve',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  negotiation: { label: 'Müzakere', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  sold:        { label: 'Satılmış', color: 'text-red-700',     bg: 'bg-red-50 border-red-200' },
}

const projectStatusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active:    { label: 'Aktif',       color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
  on_hold:   { label: 'Beklemede',   color: 'text-amber-700',   bg: 'bg-amber-50',   icon: PauseCircle },
  completed: { label: 'Tamamlandı',  color: 'text-blue-700',    bg: 'bg-blue-50',    icon: Clock },
}

function StockMiniBar({ stats }: { stats: typeof projects[0]['stats'] }) {
  const t = stats.total
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
      <div className="bg-red-400" style={{ width: `${(stats.sold / t) * 100}%` }} />
      <div className="bg-amber-400" style={{ width: `${(stats.reserved / t) * 100}%` }} />
      <div className="bg-blue-400" style={{ width: `${(stats.negotiation / t) * 100}%` }} />
      <div className="bg-emerald-400" style={{ width: `${(stats.available / t) * 100}%` }} />
    </div>
  )
}

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState<typeof projects[0] | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.code.toLowerCase().includes(search.toLowerCase()) ||
                        p.city.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projeler & Stok Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} proje · {projects.reduce((s, p) => s + p.stats.total, 0)} toplam daire</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" /> Yeni Proje
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Proje adı, kodu veya şehir ara..."
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
          <option value="on_hold">Beklemede</option>
          <option value="completed">Tamamlandı</option>
        </select>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2.5 transition ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2.5 transition ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(project => {
            const pStatus = projectStatusConfig[project.status]
            const StatusIcon = pStatus.icon
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() => setSelectedProject(project)}
              >
                {/* Color Banner */}
                <div className={`h-2 ${project.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : project.status === 'on_hold' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition">{project.name}</h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{project.code}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${pStatus.bg} ${pStatus.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {pStatus.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {project.city}, {project.district}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(project.start_date).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{project.stats.total}</p>
                      <p className="text-[10px] text-gray-400">Toplam</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{project.stats.available}</p>
                      <p className="text-[10px] text-gray-400">Müsait</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600">{project.stats.reserved}</p>
                      <p className="text-[10px] text-gray-400">Rezerve</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">{project.stats.sold}</p>
                      <p className="text-[10px] text-gray-400">Satılmış</p>
                    </div>
                  </div>

                  <StockMiniBar stats={project.stats} />

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">{project.blocks.length} blok</span>
                    <span className="text-xs text-primary-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                      Detayları Gör <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Proje</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">Konum</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Blok</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Toplam</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Müsait</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Satılmış</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-5 py-3">Durum</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(project => {
                const pStatus = projectStatusConfig[project.status]
                return (
                  <tr
                    key={project.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-sm text-gray-900">{project.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{project.code}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{project.city}, {project.district}</td>
                    <td className="px-5 py-4 text-sm text-center text-gray-600">{project.blocks.length}</td>
                    <td className="px-5 py-4 text-sm text-center font-semibold">{project.stats.total}</td>
                    <td className="px-5 py-4 text-sm text-center font-semibold text-emerald-600">{project.stats.available}</td>
                    <td className="px-5 py-4 text-sm text-center font-semibold text-red-600">{project.stats.sold}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pStatus.bg} ${pStatus.color}`}>{pStatus.label}</span>
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
      )}

      {/* ── Proje Detay Modal ── */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4" onClick={() => setSelectedProject(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto animate-in" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedProject.name}</h2>
                <p className="text-sm text-gray-500">{selectedProject.city}, {selectedProject.district} · {selectedProject.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => setSelectedProject(null)} className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-6">
              {/* Açıklama */}
              <p className="text-sm text-gray-600 mb-6">{selectedProject.description}</p>

              {/* İstatistik Kartları */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                  { label: 'Toplam', value: selectedProject.stats.total, color: 'text-gray-900' },
                  { label: 'Müsait', value: selectedProject.stats.available, color: 'text-emerald-600' },
                  { label: 'Rezerve', value: selectedProject.stats.reserved, color: 'text-amber-600' },
                  { label: 'Müzakere', value: selectedProject.stats.negotiation, color: 'text-blue-600' },
                  { label: 'Satılmış', value: selectedProject.stats.sold, color: 'text-red-600' },
                ].map(stat => (
                  <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Bloklar */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary-500" /> Blok Yapısı
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProject.blocks.map(block => (
                    <div key={block.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{block.name}</p>
                          <p className="text-xs text-gray-400">{block.total_floors} kat · {block.units} daire</p>
                        </div>
                        <Building2 className="w-5 h-5 text-gray-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daire Matrisi */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary-500" /> Daire Matrisi — {selectedProject.blocks[0]?.name || 'A Blok'}
                </h3>
                <div className="flex items-center gap-4 mb-3 text-xs">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <span key={key} className="flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded-sm border ${cfg.bg}`} /> {cfg.label}
                    </span>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2 bg-gray-50 rounded-tl-lg">Kat</th>
                        {mockUnits[0]?.units.map((_, i) => (
                          <th key={i} className="text-center text-xs font-semibold text-gray-500 px-3 py-2 bg-gray-50">Daire {i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...mockUnits].reverse().map(floor => (
                        <tr key={floor.floor}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-100 bg-gray-50/50">{floor.floor}. Kat</td>
                          {floor.units.map(unit => {
                            const cfg = statusConfig[unit.status]
                            return (
                              <td key={unit.no} className="px-1.5 py-1.5">
                                <div
                                  className={`rounded-lg border p-2 text-center cursor-pointer hover:scale-105 transition-transform ${cfg.bg}`}
                                  title={`${unit.no} · ${unit.type} · ${unit.area}m² · ${formatCurrency(unit.price)}`}
                                >
                                  <p className={`text-xs font-semibold ${cfg.color}`}>{unit.no}</p>
                                  <p className="text-[10px] text-gray-500">{unit.type} · {unit.area}m²</p>
                                  <p className="text-[10px] font-medium text-gray-700 mt-0.5">{formatCurrency(unit.price)}</p>
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Proje Modal ── */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yeni Proje Oluştur</h2>
              <button onClick={() => setShowNewForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Proje Adı *</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Park Evler" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Proje Kodu *</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition font-mono" placeholder="PARK-EVLER" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Şehir</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="İstanbul" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">İlçe</label>
                  <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Başakşehir" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Açıklama</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none" rows={3} placeholder="Proje açıklaması..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Başlangıç Tarihi</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Tahmini Bitiş</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md">Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
