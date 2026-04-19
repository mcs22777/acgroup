'use client'

import { useState, useEffect } from 'react'
import {
  Truck, Plus, Search, Phone, Mail, User, X,
  ChevronRight, FileText, Loader2, Package, Edit3, Trash2, Save,
} from 'lucide-react'
import api, { ensureAuth } from '@/lib/api'

interface Supplier {
  id: string; name: string; contact_person: string | null; phone: string | null;
  email: string | null; tax_number: string | null; category: string | null;
  notes: string | null
}

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  malzeme: { label: 'Malzeme', color: 'text-blue-700', bg: 'bg-blue-50' },
  iscilik: { label: 'İşçilik', color: 'text-amber-700', bg: 'bg-amber-50' },
  taseron: { label: 'Taşeron', color: 'text-purple-700', bg: 'bg-purple-50' },
  nakliye: { label: 'Nakliye', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  diger: { label: 'Diğer', color: 'text-gray-700', bg: 'bg-gray-50' },
}

export default function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newSupplier, setNewSupplier] = useState({
    name: '', contact_person: '', phone: '', email: '',
    tax_number: '', category: 'malzeme', notes: '',
  })
  const [editMode, setEditMode] = useState(false)
  const [editSupplier, setEditSupplier] = useState<any>({})
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      await ensureAuth()
      try {
        const res = await api.get('/expenses/suppliers')
        setSuppliers(res.data)
      } catch (err) {
        console.error('Tedarikçi verileri yüklenemedi:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = suppliers.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contact_person || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || '').includes(search) ||
      (s.tax_number || '').includes(search)
    const matchCategory = categoryFilter === 'all' || s.category === categoryFilter
    return matchSearch && matchCategory
  })

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tedarikçiler</h1>
          <p className="text-sm text-gray-500 mt-1">{suppliers.length} tedarikçi kayıtlı</p>
        </div>
        <button onClick={() => setShowNewForm(true)} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" /> Yeni Tedarikçi
        </button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Firma adı, yetkili kişi veya telefon ara..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-sm transition outline-none" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
          <option value="all">Tüm Kategoriler</option>
          {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Tedarikçi Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(supplier => {
          const cat = categoryConfig[supplier.category || ''] || categoryConfig.diger
          return (
            <div key={supplier.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 cursor-pointer group"
              onClick={() => setSelectedSupplier(supplier)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition">{supplier.name}</h3>
                    {supplier.contact_person && <p className="text-xs text-gray-400">{supplier.contact_person}</p>}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.bg} ${cat.color}`}>{cat.label}</span>
              </div>
              <div className="space-y-2 mb-3">
                {supplier.phone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" /> {supplier.phone}</div>}
                {supplier.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" /> {supplier.email}</div>}
                {supplier.tax_number && <div className="flex items-center gap-2 text-sm text-gray-600"><FileText className="w-3.5 h-3.5 text-gray-400" /> VKN: {supplier.tax_number}</div>}
              </div>
              {supplier.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-3 line-clamp-2">{supplier.notes}</p>}
              <div className="flex items-center justify-end pt-3 border-t border-gray-50">
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition" />
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Henüz tedarikçi kaydı bulunmuyor.</p>
          <button onClick={() => setShowNewForm(true)} className="mt-3 text-primary-500 text-sm font-medium hover:underline">İlk tedarikçiyi ekleyin</button>
        </div>
      )}

      {/* ── Tedarikçi Detay Modal ── */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4" onClick={() => { setSelectedSupplier(null); setEditMode(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{selectedSupplier.name}</h2>
                  {selectedSupplier.contact_person && <p className="text-sm text-gray-500">{selectedSupplier.contact_person}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditMode(!editMode); setEditSupplier({ name: selectedSupplier.name, contact_person: selectedSupplier.contact_person || '', phone: selectedSupplier.phone || '', email: selectedSupplier.email || '', tax_number: selectedSupplier.tax_number || '', category: selectedSupplier.category || 'malzeme', notes: selectedSupplier.notes || '' }) }}
                  className={`p-2 rounded-lg hover:bg-gray-100 transition ${editMode ? 'text-primary-600 bg-primary-50' : 'text-gray-500'}`}><Edit3 className="w-4 h-4" /></button>
                <button disabled={deleting} onClick={async () => {
                  if (!confirm('Bu tedarikçiyi silmek istediğinize emin misiniz?')) return
                  setDeleting(true)
                  try {
                    await api.delete(`/expenses/suppliers/${selectedSupplier.id}`)
                    setSuppliers(prev => prev.filter(s => s.id !== selectedSupplier.id))
                    setSelectedSupplier(null)
                  } catch (err: any) { alert(err?.response?.data?.detail || 'Tedarikçi silinemedi') } finally { setDeleting(false) }
                }} className="p-2 rounded-lg hover:bg-red-50 transition text-red-500"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => { setSelectedSupplier(null); setEditMode(false) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {editMode ? (
                <div className="bg-primary-50/30 border border-primary-200 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Tedarikçi Bilgilerini Düzenle</h4>
                  <div><label className="block text-xs text-gray-500 mb-1">Firma Adı</label><input value={editSupplier.name || ''} onChange={e => setEditSupplier((p: any) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Yetkili Kişi</label><input value={editSupplier.contact_person || ''} onChange={e => setEditSupplier((p: any) => ({ ...p, contact_person: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Kategori</label>
                      <select value={editSupplier.category || 'malzeme'} onChange={e => setEditSupplier((p: any) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
                        {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Telefon</label><input value={editSupplier.phone || ''} onChange={e => setEditSupplier((p: any) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">E-posta</label><input value={editSupplier.email || ''} onChange={e => setEditSupplier((p: any) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                  </div>
                  <div><label className="block text-xs text-gray-500 mb-1">Vergi No</label><input value={editSupplier.tax_number || ''} onChange={e => setEditSupplier((p: any) => ({ ...p, tax_number: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Notlar</label><textarea value={editSupplier.notes || ''} onChange={e => setEditSupplier((p: any) => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none resize-none" rows={2} /></div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">İptal</button>
                    <button disabled={saving} onClick={async () => {
                      setSaving(true)
                      try {
                        const res = await api.put(`/expenses/suppliers/${selectedSupplier.id}`, editSupplier)
                        setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? res.data : s))
                        setSelectedSupplier(res.data)
                        setEditMode(false)
                      } catch (err: any) { alert(err?.response?.data?.detail || 'Güncellenemedi') } finally { setSaving(false) }
                    }} className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Kaydet
                    </button>
                  </div>
                </div>
              ) : (
              <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">Telefon</p><p className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedSupplier.phone || '—'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">E-posta</p><p className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {selectedSupplier.email || '—'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">Vergi No</p><p className="text-sm font-medium text-gray-900">{selectedSupplier.tax_number || '—'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">Kategori</p>
                  {(() => {
                    const cat = categoryConfig[selectedSupplier.category || ''] || categoryConfig.diger
                    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.bg} ${cat.color}`}>{cat.label}</span>
                  })()}
                </div>
              </div>
              {selectedSupplier.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs text-amber-600 font-medium mb-1">Notlar</p>
                  <p className="text-sm text-gray-700">{selectedSupplier.notes}</p>
                </div>
              )}
              </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Tedarikçi Modal ── */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yeni Tedarikçi Ekle</h2>
              <button onClick={() => setShowNewForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Firma Adı *</label><input value={newSupplier.name} onChange={e => setNewSupplier(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="ABC İnşaat Malzemeleri" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Yetkili Kişi</label><input value={newSupplier.contact_person} onChange={e => setNewSupplier(p => ({ ...p, contact_person: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Ali Veli" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Kategori</label>
                  <select value={newSupplier.category} onChange={e => setNewSupplier(p => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white transition">
                    {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Telefon</label><input value={newSupplier.phone} onChange={e => setNewSupplier(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="0532 111 2233" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">E-posta</label><input value={newSupplier.email} onChange={e => setNewSupplier(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="info@firma.com" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Vergi Numarası</label><input value={newSupplier.tax_number} onChange={e => setNewSupplier(p => ({ ...p, tax_number: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="1234567890" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Notlar</label><textarea value={newSupplier.notes} onChange={e => setNewSupplier(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none" rows={2} placeholder="Tedarikçi hakkında notlar..." /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button disabled={saving || !newSupplier.name} onClick={async () => {
                setSaving(true)
                try {
                  const payload: any = { name: newSupplier.name }
                  if (newSupplier.contact_person) payload.contact_person = newSupplier.contact_person
                  if (newSupplier.phone) payload.phone = newSupplier.phone
                  if (newSupplier.email) payload.email = newSupplier.email
                  if (newSupplier.tax_number) payload.tax_number = newSupplier.tax_number
                  if (newSupplier.category) payload.category = newSupplier.category
                  if (newSupplier.notes) payload.notes = newSupplier.notes
                  const res = await api.post('/expenses/suppliers', payload)
                  setSuppliers(prev => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)))
                  setNewSupplier({ name: '', contact_person: '', phone: '', email: '', tax_number: '', category: 'malzeme', notes: '' })
                  setShowNewForm(false)
                } catch (err: any) { alert(err?.response?.data?.detail || 'Tedarikçi eklenemedi') } finally { setSaving(false) }
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
