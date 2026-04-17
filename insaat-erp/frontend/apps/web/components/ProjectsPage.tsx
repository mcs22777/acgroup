'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Plus, Search, LayoutGrid, List, MapPin,
  Calendar, ChevronRight, X, Home, Eye, Edit3,
  CheckCircle, Clock, PauseCircle, Loader2,
} from 'lucide-react'
import api, { ensureAuth, formatCurrency } from '@/lib/api'

interface Block { id: string; project_id: string; name: string; total_floors: number | null }
interface Project {
  id: string; name: string; code: string; city: string | null; district: string | null;
  description: string | null; status: string; start_date: string | null; expected_end: string | null;
  image_url: string | null; total_units: number; blocks: Block[]
}
interface ProjectStats { total_units: number; available: number; reserved: number; negotiation: number; sold: number }
interface UnitItem {
  id: string; floor_number: number; unit_number: string; room_type: string;
  gross_area_m2: number | null; list_price: number; status: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Müsait', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  reserved: { label: 'Rezerve', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  negotiation: { label: 'Müzakere', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  sold: { label: 'Satılmış', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
}

const projectStatusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active: { label: 'Aktif', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
  on_hold: { label: 'Beklemede', color: 'text-amber-700', bg: 'bg-amber-50', icon: PauseCircle },
  completed: { label: 'Tamamlandı', color: 'text-blue-700', bg: 'bg-blue-50', icon: Clock },
}

function StockMiniBar({ stats }: { stats: ProjectStats }) {
  const t = stats.total_units || 1
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [projects, setProjects] = useState<Project[]>([])
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({})
  const [units, setUnits] = useState<UnitItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      await ensureAuth()
      try {
        const res = await api.get('/projects')
        setProjects(res.data)
        // Load stats for each project
        const statsMap: Record<string, ProjectStats> = {}
        await Promise.all(res.data.map(async (p: Project) => {
          try {
            const sRes = await api.get(`/projects/${p.id}/summary`)
            statsMap[p.id] = sRes.data
          } catch {
            statsMap[p.id] = { total_units: p.total_units, available: 0, reserved: 0, negotiation: 0, sold: 0 }
          }
        }))
        setProjectStats(statsMap)
      } catch (err) {
        console.error('Projeler yüklenemedi:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Load units when project selected
  useEffect(() => {
    if (!selectedProject) { setUnits([]); return }
    async function loadUnits() {
      try {
        const res = await api.get('/units', { params: { project_id: selectedProject!.id, page_size: 200 } })
        setUnits(res.data)
      } catch (err) {
        console.error('Daireler yüklenemedi:', err)
      }
    }
    loadUnits()
  }, [selectedProject])

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.city || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const getStats = (id: string): ProjectStats => projectStats[id] || { total_units: 0, available: 0, reserved: 0, negotiation: 0, sold: 0 }

  // Group units by floor for the matrix
  const floorMap: Record<number, UnitItem[]> = {}
  units.forEach(u => {
    if (!floorMap[u.floor_number]) floorMap[u.floor_number] = []
    floorMap[u.floor_number].push(u)
  })
  const floors = Object.keys(floorMap).map(Number).sort((a, b) => b - a)
  const maxUnitsPerFloor = Math.max(1, ...Object.values(floorMap).map(arr => arr.length))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projeler & Stok Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} proje · {Object.values(projectStats).reduce((s, ps) => s + ps.total_units, 0)} toplam daire</p>
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
            type="text" placeholder="Proje adı, kodu veya şehir ara..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-sm transition outline-none"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
          <option value="all">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="on_hold">Beklemede</option>
          <option value="completed">Tamamlandı</option>
        </select>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`px-3 py-2.5 transition ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`px-3 py-2.5 transition ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(project => {
            const pStatus = projectStatusConfig[project.status] || projectStatusConfig.active
            const StatusIcon = pStatus.icon
            const stats = getStats(project.id)
            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() => setSelectedProject(project)}>
                <div className={`h-2 ${project.status === 'active' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : project.status === 'on_hold' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition">{project.name}</h3>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{project.code}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${pStatus.bg} ${pStatus.color}`}>
                      <StatusIcon className="w-3 h-3" />{pStatus.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    {project.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {project.city}{project.district ? `, ${project.district}` : ''}</span>}
                    {project.start_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(project.start_date).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}</span>}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="text-center"><p className="text-lg font-bold text-gray-900">{stats.total_units}</p><p className="text-[10px] text-gray-400">Toplam</p></div>
                    <div className="text-center"><p className="text-lg font-bold text-emerald-600">{stats.available}</p><p className="text-[10px] text-gray-400">Müsait</p></div>
                    <div className="text-center"><p className="text-lg font-bold text-amber-600">{stats.reserved}</p><p className="text-[10px] text-gray-400">Rezerve</p></div>
                    <div className="text-center"><p className="text-lg font-bold text-red-600">{stats.sold}</p><p className="text-[10px] text-gray-400">Satılmış</p></div>
                  </div>
                  <StockMiniBar stats={stats} />
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
                const pStatus = projectStatusConfig[project.status] || projectStatusConfig.active
                const stats = getStats(project.id)
                return (
                  <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer" onClick={() => setSelectedProject(project)}>
                    <td className="px-5 py-4"><p className="font-medium text-sm text-gray-900">{project.name}</p><p className="text-xs text-gray-400 font-mono">{project.code}</p></td>
                    <td className="px-5 py-4 text-sm text-gray-600">{project.city}{project.district ? `, ${project.district}` : ''}</td>
                    <td className="px-5 py-4 text-sm text-center text-gray-600">{project.blocks.length}</td>
                    <td className="px-5 py-4 text-sm text-center font-semibold">{stats.total_units}</td>
                    <td className="px-5 py-4 text-sm text-center font-semibold text-emerald-600">{stats.available}</td>
                    <td className="px-5 py-4 text-sm text-center font-semibold text-red-600">{stats.sold}</td>
                    <td className="px-5 py-4 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pStatus.bg} ${pStatus.color}`}>{pStatus.label}</span></td>
                    <td className="px-5 py-4 text-right"><ChevronRight className="w-4 h-4 text-gray-400 inline" /></td>
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
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedProject.name}</h2>
                <p className="text-sm text-gray-500">{selectedProject.city}{selectedProject.district ? `, ${selectedProject.district}` : ''} · {selectedProject.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => setSelectedProject(null)} className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6">
              {selectedProject.description && <p className="text-sm text-gray-600 mb-6">{selectedProject.description}</p>}
              {/* İstatistik Kartları */}
              {(() => {
                const stats = getStats(selectedProject.id); return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    {[
                      { label: 'Toplam', value: stats.total_units, color: 'text-gray-900' },
                      { label: 'Müsait', value: stats.available, color: 'text-emerald-600' },
                      { label: 'Rezerve', value: stats.reserved, color: 'text-amber-600' },
                      { label: 'Müzakere', value: stats.negotiation, color: 'text-blue-600' },
                      { label: 'Satılmış', value: stats.sold, color: 'text-red-600' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}
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
                          <p className="text-xs text-gray-400">{block.total_floors || '?'} kat</p>
                        </div>
                        <Building2 className="w-5 h-5 text-gray-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Daire Matrisi */}
              {floors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-primary-500" /> Daire Matrisi
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
                          {Array.from({ length: maxUnitsPerFloor }, (_, i) => (
                            <th key={i} className="text-center text-xs font-semibold text-gray-500 px-3 py-2 bg-gray-50">Daire {i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {floors.map(floor => (
                          <tr key={floor}>
                            <td className="px-3 py-2 text-sm font-medium text-gray-700 border-r border-gray-100 bg-gray-50/50">{floor}. Kat</td>
                            {(floorMap[floor] || []).map(unit => {
                              const cfg = statusConfig[unit.status] || statusConfig.available
                              return (
                                <td key={unit.id} className="px-1.5 py-1.5">
                                  <div className={`rounded-lg border p-2 text-center cursor-pointer hover:scale-105 transition-transform ${cfg.bg}`}
                                    title={`${unit.unit_number} · ${unit.room_type} · ${unit.gross_area_m2}m² · ${formatCurrency(Number(unit.list_price))}`}>
                                    <p className={`text-xs font-semibold ${cfg.color}`}>{unit.unit_number}</p>
                                    <p className="text-[10px] text-gray-500">{unit.room_type} · {unit.gross_area_m2}m²</p>
                                    <p className="text-[10px] font-medium text-gray-700 mt-0.5">{formatCurrency(Number(unit.list_price))}</p>
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
              )}
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
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Proje Adı *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Park Evler" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Proje Kodu *</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition font-mono" placeholder="PARK-EVLER" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Şehir</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="İstanbul" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">İlçe</label><input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Başakşehir" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Açıklama</label><textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none" rows={3} placeholder="Proje açıklaması..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Başlangıç Tarihi</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Tahmini Bitiş</label><input type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" /></div>
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
