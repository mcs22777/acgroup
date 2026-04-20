'use client'

import { useState, useEffect } from 'react'
import {
  Building2, Plus, Search, LayoutGrid, List, MapPin,
  Calendar, ChevronRight, X, Home, Eye, Edit3, Trash2,
  CheckCircle, Clock, PauseCircle, Loader2, Save, Layers,
} from 'lucide-react'
import api, { ensureAuth, formatCurrency } from '@/lib/api'

/* ── Tipler ── */
interface UnitItem {
  id: string; floor_number: number; unit_number: string; room_type: string;
  gross_area_m2: number | null; net_area_m2: number | null; list_price: number; status: string;
  has_balcony: boolean; has_parking: boolean; direction: string | null; notes: string | null
}
interface Block { id: string; project_id: string; name: string; total_floors: number | null; units: UnitItem[] }
interface Project {
  id: string; name: string; code: string; city: string | null; district: string | null;
  description: string | null; status: string; start_date: string | null; expected_end: string | null;
  image_url: string | null; total_units: number; blocks: Block[]
}
interface ProjectStats { total_units: number; available: number; reserved: number; negotiation: number; sold: number }

/* ── Konfigürasyon ── */
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
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '', code: '', city: '', district: '', description: '',
    start_date: '', expected_end: '',
  })

  // Düzenleme state
  const [editMode, setEditMode] = useState(false)
  const [editProject, setEditProject] = useState<any>({})
  const [deleting, setDeleting] = useState(false)

  // Blok yönetimi state
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<Block | null>(null)
  const [newBlock, setNewBlock] = useState({ name: '', total_floors: '' })

  // Daire ekleme/düzenleme state
  const [showUnitForm, setShowUnitForm] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null)
  const [editingUnit, setEditingUnit] = useState(false)
  const [unitBlockId, setUnitBlockId] = useState<string>('')
  const [newUnit, setNewUnit] = useState({
    floor_number: '', unit_number: '', room_type: '2+1',
    gross_area_m2: '', net_area_m2: '', list_price: '',
    has_balcony: false, has_parking: false, direction: '', notes: '',
  })

  /* ── Veri Yükleme ── */
  useEffect(() => {
    async function load() {
      await ensureAuth()
      try {
        const res = await api.get('/projects')
        setProjects(res.data)
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
      } catch (err) { console.error('Projeler yüklenemedi:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Proje seçildiğinde blok verilerini yeniden yükle (birimlerle birlikte)
  const reloadProject = async (projectId: string) => {
    try {
      const res = await api.get(`/projects/${projectId}`)
      const updated = res.data
      setSelectedProject(updated)
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p))
      // İlk bloğu aktif yap
      if (updated.blocks.length > 0 && !activeBlockId) {
        setActiveBlockId(updated.blocks[0].id)
      }
    } catch (err) { console.error('Proje yüklenemedi:', err) }
  }

  useEffect(() => {
    if (selectedProject) {
      reloadProject(selectedProject.id)
    } else {
      setActiveBlockId(null)
    }
  }, [selectedProject?.id])

  /* ── Filtre ── */
  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      (p.city || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const getStats = (id: string): ProjectStats =>
    projectStats[id] || { total_units: 0, available: 0, reserved: 0, negotiation: 0, sold: 0 }

  /* ── Aktif bloğun dairelerini matris yap ── */
  const activeBlock = selectedProject?.blocks.find(b => b.id === activeBlockId) || null
  const blockUnits = activeBlock?.units || []
  const floorMap: Record<number, UnitItem[]> = {}
  blockUnits.forEach(u => {
    if (!floorMap[u.floor_number]) floorMap[u.floor_number] = []
    floorMap[u.floor_number].push(u)
  })
  const floors = Object.keys(floorMap).map(Number).sort((a, b) => b - a)
  const maxUnitsPerFloor = Math.max(1, ...Object.values(floorMap).map(arr => arr.length))

  /* ── Proje Handlers ── */
  const handleDeleteProject = async () => {
    if (!selectedProject || !confirm('Bu projeyi silmek istediğinize emin misiniz?')) return
    setDeleting(true)
    try {
      await api.delete(`/projects/${selectedProject.id}`)
      setProjects(prev => prev.filter(p => p.id !== selectedProject.id))
      setSelectedProject(null)
    } catch (err: any) { alert(err?.response?.data?.detail || 'Proje silinemedi') }
    finally { setDeleting(false) }
  }

  const handleUpdateProject = async () => {
    if (!selectedProject) return
    setSaving(true)
    try {
      const res = await api.put(`/projects/${selectedProject.id}`, editProject)
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, ...res.data } : p))
      setSelectedProject(prev => prev ? { ...prev, ...res.data } : prev)
      setEditMode(false)
    } catch (err: any) { alert(err?.response?.data?.detail || 'Proje güncellenemedi') }
    finally { setSaving(false) }
  }

  /* ── Blok Handlers ── */
  const handleSaveBlock = async () => {
    if (!selectedProject) return
    setSaving(true)
    try {
      if (editingBlock) {
        // Güncelle
        await api.put(`/projects/${selectedProject.id}/blocks/${editingBlock.id}`, {
          name: newBlock.name,
          total_floors: newBlock.total_floors ? Number(newBlock.total_floors) : null,
        })
      } else {
        // Yeni oluştur
        await api.post(`/projects/${selectedProject.id}/blocks`, {
          name: newBlock.name,
          total_floors: newBlock.total_floors ? Number(newBlock.total_floors) : null,
        })
      }
      await reloadProject(selectedProject.id)
      setShowBlockForm(false)
      setEditingBlock(null)
      setNewBlock({ name: '', total_floors: '' })
    } catch (err: any) { alert(err?.response?.data?.detail || 'Blok kaydedilemedi') }
    finally { setSaving(false) }
  }

  const handleDeleteBlock = async (blockId: string) => {
    if (!selectedProject || !confirm('Bu bloğu ve içindeki tüm daireleri silmek istediğinize emin misiniz?')) return
    try {
      await api.delete(`/projects/${selectedProject.id}/blocks/${blockId}`)
      if (activeBlockId === blockId) setActiveBlockId(null)
      await reloadProject(selectedProject.id)
    } catch (err: any) { alert(err?.response?.data?.detail || 'Blok silinemedi') }
  }

  const openEditBlock = (block: Block) => {
    setEditingBlock(block)
    setNewBlock({ name: block.name, total_floors: block.total_floors ? String(block.total_floors) : '' })
    setShowBlockForm(true)
  }

  /* ── Daire Handlers ── */
  const handleSaveUnit = async () => {
    if (!selectedProject || !unitBlockId) return
    setSaving(true)
    try {
      if (editingUnit && selectedUnit) {
        const payload: any = {}
        if (newUnit.room_type) payload.room_type = newUnit.room_type
        if (newUnit.gross_area_m2) payload.gross_area_m2 = Number(newUnit.gross_area_m2)
        if (newUnit.net_area_m2) payload.net_area_m2 = Number(newUnit.net_area_m2)
        if (newUnit.list_price) payload.list_price = Number(newUnit.list_price)
        payload.has_balcony = newUnit.has_balcony
        payload.has_parking = newUnit.has_parking
        if (newUnit.direction) payload.direction = newUnit.direction
        if (newUnit.notes) payload.notes = newUnit.notes
        await api.put(`/units/${selectedUnit.id}`, payload)
      } else {
        const payload: any = {
          project_id: selectedProject.id,
          block_id: unitBlockId,
          floor_number: Number(newUnit.floor_number),
          unit_number: newUnit.unit_number,
          room_type: newUnit.room_type,
          list_price: Number(newUnit.list_price),
        }
        if (newUnit.gross_area_m2) payload.gross_area_m2 = Number(newUnit.gross_area_m2)
        if (newUnit.net_area_m2) payload.net_area_m2 = Number(newUnit.net_area_m2)
        payload.has_balcony = newUnit.has_balcony
        payload.has_parking = newUnit.has_parking
        if (newUnit.direction) payload.direction = newUnit.direction
        if (newUnit.notes) payload.notes = newUnit.notes
        await api.post('/units', payload)
      }
      await reloadProject(selectedProject.id)
      setShowUnitForm(false)
      setSelectedUnit(null)
      setEditingUnit(false)
      setNewUnit({ floor_number: '', unit_number: '', room_type: '2+1', gross_area_m2: '', net_area_m2: '', list_price: '', has_balcony: false, has_parking: false, direction: '', notes: '' })
    } catch (err: any) { alert(err?.response?.data?.detail || 'Daire kaydedilemedi') }
    finally { setSaving(false) }
  }

  const openEditUnit = (unit: UnitItem) => {
    setSelectedUnit(unit)
    setEditingUnit(true)
    setUnitBlockId(activeBlockId || '')
    setNewUnit({
      floor_number: String(unit.floor_number), unit_number: unit.unit_number,
      room_type: unit.room_type, gross_area_m2: unit.gross_area_m2 ? String(unit.gross_area_m2) : '',
      net_area_m2: unit.net_area_m2 ? String(unit.net_area_m2) : '', list_price: String(unit.list_price),
      has_balcony: unit.has_balcony, has_parking: unit.has_parking,
      direction: unit.direction || '', notes: unit.notes || '',
    })
    setShowUnitForm(true)
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!selectedProject || !confirm('Bu daireyi silmek istediğinize emin misiniz?')) return
    try {
      await api.delete(`/units/${unitId}`)
      await reloadProject(selectedProject.id)
    } catch (err: any) { alert(err?.response?.data?.detail || 'Daire silinemedi') }
  }

  const openNewUnit = (blockId: string) => {
    setEditingUnit(false)
    setSelectedUnit(null)
    setUnitBlockId(blockId)
    setNewUnit({ floor_number: '', unit_number: '', room_type: '2+1', gross_area_m2: '', net_area_m2: '', list_price: '', has_balcony: false, has_parking: false, direction: '', notes: '' })
    setShowUnitForm(true)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projeler & Stok Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">{projects.length} proje · {Object.values(projectStats).reduce((s, ps) => s + ps.total_units, 0)} toplam daire</p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" /> Yeni Proje
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Proje adı, kodu veya şehir ara..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-sm transition outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
          <option value="all">Tüm Durumlar</option>
          <option value="active">Aktif</option><option value="on_hold">Beklemede</option><option value="completed">Tamamlandı</option>
        </select>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`px-3 py-2.5 transition ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`px-3 py-2.5 transition ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><List className="w-4 h-4" /></button>
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
                onClick={() => { setSelectedProject(project); setActiveBlockId(null) }}>
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
                    <span className="text-xs text-primary-500 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Detayları Gör <ChevronRight className="w-3.5 h-3.5" /></span>
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
                  <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition cursor-pointer" onClick={() => { setSelectedProject(project); setActiveBlockId(null) }}>
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

      {/* ══════════════════════════════════════════
          PROJE DETAY MODAL
         ══════════════════════════════════════════ */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4" onClick={() => { setSelectedProject(null); setEditMode(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedProject.name}</h2>
                <p className="text-sm text-gray-500">{selectedProject.city}{selectedProject.district ? `, ${selectedProject.district}` : ''} · {selectedProject.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditMode(!editMode); setEditProject({ name: selectedProject.name, city: selectedProject.city || '', district: selectedProject.district || '', description: selectedProject.description || '', status: selectedProject.status, start_date: selectedProject.start_date || '', expected_end: selectedProject.expected_end || '' }) }}
                  className={`p-2 rounded-lg hover:bg-gray-100 transition ${editMode ? 'text-primary-600 bg-primary-50' : 'text-gray-500'}`}><Edit3 className="w-4 h-4" /></button>
                <button onClick={handleDeleteProject} disabled={deleting} className="p-2 rounded-lg hover:bg-red-50 transition text-red-500"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => { setSelectedProject(null); setEditMode(false) }} className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-6">
              {/* Proje Düzenleme */}
              {editMode && (
                <div className="bg-primary-50/30 border border-primary-200 rounded-lg p-4 mb-6 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Proje Bilgilerini Düzenle</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Proje Adı</label><input value={editProject.name || ''} onChange={e => setEditProject((p: any) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Durum</label>
                      <select value={editProject.status || 'active'} onChange={e => setEditProject((p: any) => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                        <option value="active">Aktif</option><option value="on_hold">Beklemede</option><option value="completed">Tamamlandı</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Şehir</label><input value={editProject.city || ''} onChange={e => setEditProject((p: any) => ({ ...p, city: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">İlçe</label><input value={editProject.district || ''} onChange={e => setEditProject((p: any) => ({ ...p, district: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                  </div>
                  <div><label className="block text-xs text-gray-500 mb-1">Açıklama</label><textarea value={editProject.description || ''} onChange={e => setEditProject((p: any) => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none" rows={2} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Başlangıç</label><input type="date" value={editProject.start_date || ''} onChange={e => setEditProject((p: any) => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Tahmini Bitiş</label><input type="date" value={editProject.expected_end || ''} onChange={e => setEditProject((p: any) => ({ ...p, expected_end: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">İptal</button>
                    <button disabled={saving} onClick={handleUpdateProject} className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Kaydet
                    </button>
                  </div>
                </div>
              )}

              {selectedProject.description && !editMode && <p className="text-sm text-gray-600 mb-6">{selectedProject.description}</p>}

              {/* İstatistik Kartları */}
              {(() => { const stats = getStats(selectedProject.id); return (
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
              ) })()}

              {/* ═══ BLOK YÖNETİMİ ═══ */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Layers className="w-4 h-4 text-primary-500" /> Bloklar</h3>
                  <button onClick={() => { setEditingBlock(null); setNewBlock({ name: '', total_floors: '' }); setShowBlockForm(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-lg transition">
                    <Plus className="w-3.5 h-3.5" /> Yeni Blok
                  </button>
                </div>

                {selectedProject.blocks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg">
                    Henüz blok eklenmemiş. "Yeni Blok" butonuyla başlayın.
                  </div>
                ) : (
                  <>
                    {/* Blok Tabları */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedProject.blocks.map(block => (
                        <div key={block.id}
                          className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all ${
                            activeBlockId === block.id
                              ? 'bg-primary-50 border-primary-300 text-primary-700 shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => setActiveBlockId(block.id)}>
                          <Building2 className="w-4 h-4" />
                          <div>
                            <p className="text-sm font-medium">{block.name}</p>
                            <p className="text-[10px] text-gray-400">{block.total_floors || '?'} kat · {block.units.length} daire</p>
                          </div>
                          {/* Blok işlem butonları */}
                          <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={e => { e.stopPropagation(); openEditBlock(block) }}
                              className="p-1 rounded hover:bg-primary-100 text-gray-400 hover:text-primary-600 transition">
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDeleteBlock(block.id) }}
                              className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Aktif Blok İçeriği */}
                    {activeBlock && (
                      <div className="border border-gray-200 rounded-xl p-4">
                        {/* Blok başlık */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{activeBlock.name}</h4>
                              <p className="text-xs text-gray-400">{activeBlock.total_floors || '?'} kat · {activeBlock.units.length} daire</p>
                            </div>
                          </div>
                          <button onClick={() => openNewUnit(activeBlock.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-lg transition">
                            <Plus className="w-3.5 h-3.5" /> Daire Ekle
                          </button>
                        </div>

                        {/* Durum legendı */}
                        <div className="flex items-center gap-4 mb-3 text-xs">
                          {Object.entries(statusConfig).map(([key, cfg]) => (
                            <span key={key} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded-sm border ${cfg.bg}`} /> {cfg.label}</span>
                          ))}
                        </div>

                        {/* Kat-Daire Matrisi */}
                        {floors.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr>
                                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2 bg-gray-50 rounded-tl-lg w-20">Kat</th>
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
                                          <div className={`rounded-lg border p-2 text-center cursor-pointer hover:scale-105 transition-transform relative group/unit ${cfg.bg}`}
                                            onClick={() => openEditUnit(unit)}
                                            title={`${unit.unit_number} · ${unit.room_type} · ${unit.gross_area_m2 || '?'}m² · ${formatCurrency(Number(unit.list_price))}`}>
                                            <p className={`text-xs font-semibold ${cfg.color}`}>{unit.unit_number}</p>
                                            <p className="text-[10px] text-gray-500">{unit.room_type} · {unit.gross_area_m2 || '?'}m²</p>
                                            <p className="text-[10px] font-medium text-gray-700 mt-0.5">{formatCurrency(Number(unit.list_price))}</p>
                                            {/* Silme butonu */}
                                            <button onClick={e => { e.stopPropagation(); handleDeleteUnit(unit.id) }}
                                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/unit:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                              title="Daireyi sil">
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg">
                            Bu blokta henüz daire yok. "Daire Ekle" butonuyla ekleyin.
                          </div>
                        )}
                      </div>
                    )}

                    {!activeBlockId && selectedProject.blocks.length > 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-lg">
                        Daireleri görmek için yukarıdan bir blok seçin.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          BLOK EKLEME/DÜZENLEME MODAL
         ══════════════════════════════════════════ */}
      {showBlockForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center px-4" onClick={() => setShowBlockForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingBlock ? 'Blok Düzenle' : 'Yeni Blok Ekle'}</h2>
              <button onClick={() => setShowBlockForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Blok Adı *</label>
                <input value={newBlock.name} onChange={e => setNewBlock(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" placeholder="A Blok" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Toplam Kat Sayısı</label>
                <input type="number" value={newBlock.total_floors} onChange={e => setNewBlock(p => ({ ...p, total_floors: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" placeholder="10" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowBlockForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button disabled={saving || !newBlock.name} onClick={handleSaveBlock}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingBlock ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DAİRE EKLEME/DÜZENLEME MODAL
         ══════════════════════════════════════════ */}
      {showUnitForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center px-4" onClick={() => setShowUnitForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingUnit ? 'Daire Düzenle' : 'Yeni Daire Ekle'}</h2>
              <button onClick={() => setShowUnitForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Blok Seçimi */}
              {!editingUnit && selectedProject && selectedProject.blocks.length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Blok *</label>
                  <select value={unitBlockId} onChange={e => setUnitBlockId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                    {selectedProject.blocks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Kat *</label><input type="number" value={newUnit.floor_number} onChange={e => setNewUnit(p => ({ ...p, floor_number: e.target.value }))} disabled={editingUnit} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none disabled:bg-gray-100" placeholder="3" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Daire No *</label><input value={newUnit.unit_number} onChange={e => setNewUnit(p => ({ ...p, unit_number: e.target.value }))} disabled={editingUnit} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none disabled:bg-gray-100" placeholder="301" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Oda Tipi *</label>
                  <select value={newUnit.room_type} onChange={e => setNewUnit(p => ({ ...p, room_type: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                    <option value="1+0">1+0</option><option value="1+1">1+1</option><option value="2+1">2+1</option>
                    <option value="3+1">3+1</option><option value="3+2">3+2</option><option value="4+1">4+1</option>
                    <option value="4+2">4+2</option><option value="5+1">5+1</option><option value="5+2">5+2</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Brüt m²</label><input type="number" value={newUnit.gross_area_m2} onChange={e => setNewUnit(p => ({ ...p, gross_area_m2: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" placeholder="120" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Net m²</label><input type="number" value={newUnit.net_area_m2} onChange={e => setNewUnit(p => ({ ...p, net_area_m2: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" placeholder="95" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Fiyat (TL) *</label><input type="number" value={newUnit.list_price} onChange={e => setNewUnit(p => ({ ...p, list_price: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" placeholder="3500000" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Yön</label><input value={newUnit.direction} onChange={e => setNewUnit(p => ({ ...p, direction: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" placeholder="Güney-Batı" /></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={newUnit.has_balcony} onChange={e => setNewUnit(p => ({ ...p, has_balcony: e.target.checked }))} className="rounded border-gray-300 text-primary-500 focus:ring-primary-400" /> Balkon
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={newUnit.has_parking} onChange={e => setNewUnit(p => ({ ...p, has_parking: e.target.checked }))} className="rounded border-gray-300 text-primary-500 focus:ring-primary-400" /> Otopark
                </label>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Notlar</label><textarea value={newUnit.notes} onChange={e => setNewUnit(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none" rows={2} placeholder="Daire hakkında notlar..." /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowUnitForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button disabled={saving || (!editingUnit && (!newUnit.floor_number || !newUnit.unit_number || !newUnit.list_price))} onClick={handleSaveUnit}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} {editingUnit ? 'Güncelle' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          YENİ PROJE MODAL
         ══════════════════════════════════════════ */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yeni Proje Oluştur</h2>
              <button onClick={() => setShowNewForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Proje Adı *</label><input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Park Evler" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Proje Kodu *</label><input value={newProject.code} onChange={e => setNewProject(p => ({ ...p, code: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition font-mono" placeholder="PARK-EVLER" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Şehir</label><input value={newProject.city} onChange={e => setNewProject(p => ({ ...p, city: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="İstanbul" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">İlçe</label><input value={newProject.district} onChange={e => setNewProject(p => ({ ...p, district: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Başakşehir" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Açıklama</label><textarea value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none" rows={3} placeholder="Proje açıklaması..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Başlangıç Tarihi</label><input type="date" value={newProject.start_date} onChange={e => setNewProject(p => ({ ...p, start_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Tahmini Bitiş</label><input type="date" value={newProject.expected_end} onChange={e => setNewProject(p => ({ ...p, expected_end: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button disabled={saving || !newProject.name || !newProject.code} onClick={async () => {
                setSaving(true)
                try {
                  const payload: any = { name: newProject.name, code: newProject.code }
                  if (newProject.city) payload.city = newProject.city
                  if (newProject.district) payload.district = newProject.district
                  if (newProject.description) payload.description = newProject.description
                  if (newProject.start_date) payload.start_date = newProject.start_date
                  if (newProject.expected_end) payload.expected_end = newProject.expected_end
                  const res = await api.post('/projects', payload)
                  setProjects(prev => [res.data, ...prev])
                  setProjectStats(prev => ({ ...prev, [res.data.id]: { total_units: 0, available: 0, reserved: 0, negotiation: 0, sold: 0 } }))
                  setNewProject({ name: '', code: '', city: '', district: '', description: '', start_date: '', expected_end: '' })
                  setShowNewForm(false)
                } catch (err: any) { alert(err?.response?.data?.detail || 'Proje oluşturulamadı') } finally { setSaving(false) }
              }} className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
