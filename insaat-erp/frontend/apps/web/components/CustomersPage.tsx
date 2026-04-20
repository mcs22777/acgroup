'use client'

import { useState, useEffect } from 'react'
import {
  Users, Plus, Search, Phone, Mail, User, Tag,
  X, ChevronRight, MessageSquare, Calendar, Clock,
  PhoneCall, Video, FileText, Star, Filter,
  ArrowRight, GripVertical, Loader2, Edit3, Trash2, Save,
} from 'lucide-react'
import api, { ensureAuth, formatDate } from '@/lib/api'

interface Customer {
  id: string; first_name: string; last_name: string; phone: string; email: string | null;
  source: string | null; assigned_to: string | null; notes: string | null;
  tc_kimlik_no?: string | null; address?: string | null; created_at?: string;
}
interface Opportunity {
  id: string; customer_id: string; project_id: string | null; unit_id: string | null;
  offered_price: number | null; status: string; priority: string; expected_close: string | null;
  notes: string | null; loss_reason: string | null;
}
interface Activity {
  id: string; customer_id: string; user_id: string; activity_type: string;
  subject: string | null; description: string | null; activity_date: string;
}

const sourceConfig: Record<string, { label: string; color: string; bg: string }> = {
  web: { label: 'Web', color: 'text-blue-700', bg: 'bg-blue-50' },
  referral: { label: 'Referans', color: 'text-purple-700', bg: 'bg-purple-50' },
  walk_in: { label: 'Ziyaret', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  phone: { label: 'Telefon', color: 'text-amber-700', bg: 'bg-amber-50' },
  ad: { label: 'Reklam', color: 'text-pink-700', bg: 'bg-pink-50' },
}

const kanbanColumns = [
  { id: 'new', label: 'Yeni', color: 'border-gray-300', bg: 'bg-gray-50' },
  { id: 'contacted', label: 'İletişimde', color: 'border-blue-400', bg: 'bg-blue-50' },
  { id: 'proposal_sent', label: 'Teklif Verildi', color: 'border-amber-400', bg: 'bg-amber-50' },
  { id: 'negotiation', label: 'Müzakere', color: 'border-purple-400', bg: 'bg-purple-50' },
  { id: 'won', label: 'Kazanıldı', color: 'border-emerald-400', bg: 'bg-emerald-50' },
  { id: 'lost', label: 'Kaybedildi', color: 'border-red-400', bg: 'bg-red-50' },
]

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
}

const activityIcons: Record<string, any> = {
  call: PhoneCall, meeting: Video, email: Mail, note: FileText, site_visit: Star,
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(n)
}

type View = 'list' | 'kanban' | 'timeline'

export default function CustomersPage() {
  const [view, setView] = useState<View>('list')
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    source: 'web', tc_kimlik_no: '', address: '', notes: '',
  })

  // Not ekleme state
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)

  // Fırsat ekleme state
  const [showOppForm, setShowOppForm] = useState(false)
  const [newOpp, setNewOpp] = useState({
    customer_id: '', offered_price: '', priority: 'medium', expected_close: '', notes: '',
  })

  // Aktivite ekleme state
  const [showActForm, setShowActForm] = useState(false)
  const [newAct, setNewAct] = useState({
    customer_id: '', activity_type: 'call', subject: '', description: '',
  })

  // Kanban ve Aktivite müşteri filtresi
  const [customerFilter, setCustomerFilter] = useState<string>('all')

  // Düzenleme state
  const [editMode, setEditMode] = useState(false)
  const [editCustomer, setEditCustomer] = useState<any>({})
  const [deleting, setDeleting] = useState(false)

  // Fırsat düzenleme state (Kanban)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [editOpp, setEditOpp] = useState<any>({})
  const [oppSaving, setOppSaving] = useState(false)

  useEffect(() => {
    async function load() {
      await ensureAuth()
      try {
        const [custRes, oppRes, actRes] = await Promise.all([
          api.get('/customers'),
          api.get('/customers/opportunities/all'),
          api.get('/customers/activities/all'),
        ])
        setCustomers(custRes.data)
        setOpportunities(oppRes.data)
        setActivities(actRes.data)
      } catch (err) {
        console.error('Müşteri verileri yüklenemedi:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getCustomerName = (customerId: string) => {
    const c = customers.find(c => c.id === customerId)
    return c ? `${c.first_name} ${c.last_name}` : '—'
  }

  const filteredCustomers = customers.filter(c => {
    const matchSearch =
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
    const matchSource = sourceFilter === 'all' || c.source === sourceFilter
    return matchSearch && matchSource
  })

  // Kanban ve Timeline'da müşteriye göre filtreleme
  const filteredOpportunities = customerFilter === 'all'
    ? opportunities
    : opportunities.filter(o => o.customer_id === customerFilter)
  const filteredActivities = customerFilter === 'all'
    ? activities
    : activities.filter(a => a.customer_id === customerFilter)

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Müşteriler & CRM</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} müşteri · {opportunities.length} fırsat</p>
        </div>
        <div className="flex gap-2">
          {view === 'kanban' && (
            <button onClick={() => { setNewOpp(p => ({ ...p, customer_id: '' })); setShowOppForm(true) }}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">
              <Plus className="w-4 h-4" /> Yeni Fırsat
            </button>
          )}
          {view === 'timeline' && (
            <button onClick={() => { setNewAct(p => ({ ...p, customer_id: '' })); setShowActForm(true) }}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">
              <Plus className="w-4 h-4" /> Yeni Aktivite
            </button>
          )}
          <button onClick={() => setShowNewForm(true)} className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md">
            <Plus className="w-4 h-4" /> Yeni Müşteri
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {([
            { id: 'list' as View, label: 'Müşteri Listesi' },
            { id: 'kanban' as View, label: 'Fırsat Kanban' },
            { id: 'timeline' as View, label: 'Aktiviteler' },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${view === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        {/* Müşteri filtresi — kanban ve timeline için */}
        {(view === 'kanban' || view === 'timeline') && (
          <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
            <option value="all">Tüm Müşteriler</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
          </select>
        )}
      </div>

      {/* ── Müşteri Listesi ── */}
      {view === 'list' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Ad, telefon veya e-posta ara..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 text-sm transition outline-none" />
            </div>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
              <option value="all">Tüm Kaynaklar</option>
              <option value="web">Web</option><option value="referral">Referans</option>
              <option value="walk_in">Ziyaret</option><option value="phone">Telefon</option><option value="ad">Reklam</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(customer => {
              const src = sourceConfig[customer.source || ''] || { label: customer.source || '—', color: 'text-gray-700', bg: 'bg-gray-50' }
              const custOpps = opportunities.filter(o => o.customer_id === customer.id).length
              const custActs = activities.filter(a => a.customer_id === customer.id).length
              return (
                <div key={customer.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5 cursor-pointer group"
                  onClick={() => setSelectedCustomer(customer)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                        {customer.first_name[0]}{customer.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition">{customer.first_name} {customer.last_name}</h3>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${src.bg} ${src.color}`}>{src.label}</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-3.5 h-3.5 text-gray-400" /> {customer.phone}</div>
                    {customer.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="w-3.5 h-3.5 text-gray-400" /> {customer.email}</div>}
                  </div>
                  {customer.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-3 line-clamp-2">{customer.notes}</p>}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {custOpps} fırsat</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {custActs} aktivite</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition" />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Kanban Board ── */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(col => {
            const colOpps = filteredOpportunities.filter(o => o.status === col.id)
            return (
              <div key={col.id} className="flex-shrink-0 w-72">
                <div className={`rounded-t-lg px-4 py-3 border-t-4 ${col.color} ${col.bg}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                    <span className="bg-white/80 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-600">{colOpps.length}</span>
                  </div>
                </div>
                <div className="bg-gray-50/50 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                  {colOpps.map(opp => (
                    <div key={opp.id}
                      onClick={() => {
                        setSelectedOpp(opp)
                        setEditOpp({
                          status: opp.status,
                          priority: opp.priority,
                          offered_price: opp.offered_price ? String(opp.offered_price) : '',
                          expected_close: opp.expected_close || '',
                          notes: opp.notes || '',
                          loss_reason: opp.loss_reason || '',
                        })
                      }}
                      className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm hover:shadow-md hover:border-primary-200 transition cursor-pointer group">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition">{getCustomerName(opp.customer_id)}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityColors[opp.priority] || ''}`}>
                          {opp.priority === 'high' ? 'Yüksek' : opp.priority === 'medium' ? 'Orta' : 'Düşük'}
                        </span>
                      </div>
                      {opp.offered_price && <p className="text-sm font-semibold text-primary-600">{formatCurrency(Number(opp.offered_price))}</p>}
                      {opp.notes && <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{opp.notes}</p>}
                      {opp.expected_close && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2">
                          <Calendar className="w-3 h-3" /> Hedef: {formatDate(opp.expected_close)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Fırsat Düzenleme Modal ── */}
      {selectedOpp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setSelectedOpp(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Fırsat Düzenle</h2>
                <p className="text-sm text-gray-500">{getCustomerName(selectedOpp.customer_id)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button disabled={deleting} onClick={async () => {
                  if (!confirm('Bu fırsatı silmek istediğinize emin misiniz?')) return
                  setDeleting(true)
                  try {
                    await api.delete(`/customers/opportunities/${selectedOpp.id}`)
                    setOpportunities(prev => prev.filter(o => o.id !== selectedOpp.id))
                    setSelectedOpp(null)
                  } catch (err: any) { alert(err?.response?.data?.detail || 'Fırsat silinemedi') }
                  finally { setDeleting(false) }
                }} className="p-2 rounded-lg hover:bg-red-50 transition text-red-500"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setSelectedOpp(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Durum */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Durum</label>
                <div className="flex flex-wrap gap-2">
                  {kanbanColumns.map(col => (
                    <button key={col.id} onClick={() => setEditOpp((p: any) => ({ ...p, status: col.id }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        editOpp.status === col.id
                          ? `${col.bg} ${col.color} border-current shadow-sm`
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Öncelik */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Öncelik</label>
                <select value={editOpp.priority || 'medium'} onChange={e => setEditOpp((p: any) => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                  <option value="high">Yüksek</option><option value="medium">Orta</option><option value="low">Düşük</option>
                </select>
              </div>
              {/* Fiyat & Tarih */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Teklif Fiyatı (TL)</label>
                  <input type="number" value={editOpp.offered_price || ''} onChange={e => setEditOpp((p: any) => ({ ...p, offered_price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" placeholder="3500000" />
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Hedef Kapanış</label>
                  <input type="date" value={editOpp.expected_close || ''} onChange={e => setEditOpp((p: any) => ({ ...p, expected_close: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" />
                </div>
              </div>
              {/* Notlar */}
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Notlar</label>
                <textarea value={editOpp.notes || ''} onChange={e => setEditOpp((p: any) => ({ ...p, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none" rows={2} placeholder="Fırsat hakkında notlar..." />
              </div>
              {/* Kayıp Sebebi — sadece lost durumunda */}
              {editOpp.status === 'lost' && (
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Kayıp Sebebi</label>
                  <input value={editOpp.loss_reason || ''} onChange={e => setEditOpp((p: any) => ({ ...p, loss_reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" placeholder="Fiyat uyuşmazlığı, rakip firma..." />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setSelectedOpp(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button disabled={oppSaving} onClick={async () => {
                setOppSaving(true)
                try {
                  const payload: any = { status: editOpp.status, priority: editOpp.priority }
                  if (editOpp.offered_price) payload.offered_price = Number(editOpp.offered_price)
                  else payload.offered_price = null
                  if (editOpp.expected_close) payload.expected_close = editOpp.expected_close
                  if (editOpp.notes !== undefined) payload.notes = editOpp.notes || null
                  if (editOpp.status === 'lost' && editOpp.loss_reason) payload.loss_reason = editOpp.loss_reason
                  const res = await api.put(`/customers/opportunities/${selectedOpp.id}`, payload)
                  setOpportunities(prev => prev.map(o => o.id === selectedOpp.id ? res.data : o))
                  setSelectedOpp(null)
                } catch (err: any) { alert(err?.response?.data?.detail || 'Fırsat güncellenemedi') }
                finally { setOppSaving(false) }
              }} className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-2">
                {oppSaving && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Aktivite Timeline ── */}
      {view === 'timeline' && (
        <div className="max-w-2xl">
          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Henüz aktivite bulunmuyor.</div>
          )}
          <div className="relative space-y-0">
            {filteredActivities.map((act, i) => {
              const Icon = activityIcons[act.activity_type] || MessageSquare
              const isLast = i === filteredActivities.length - 1
              return (
                <div key={act.id} className="relative flex gap-4 pb-6">
                  {!isLast && <div className="absolute left-5 top-10 w-0.5 h-[calc(100%-2rem)] bg-gray-200" />}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 border-2 border-primary-200 flex items-center justify-center z-10">
                    <Icon className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{act.subject || act.activity_type}</h4>
                        <p className="text-xs text-gray-500">{getCustomerName(act.customer_id)}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(act.activity_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}
                        {' '}
                        {new Date(act.activity_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {act.description && <p className="text-sm text-gray-600 mt-2">{act.description}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Müşteri Detay Modal ── */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-10 px-4" onClick={() => { setSelectedCustomer(null); setShowNoteForm(false); setEditMode(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                  {selectedCustomer.first_name[0]}{selectedCustomer.last_name[0]}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{selectedCustomer.first_name} {selectedCustomer.last_name}</h2>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditMode(!editMode); setEditCustomer({ first_name: selectedCustomer.first_name, last_name: selectedCustomer.last_name, phone: selectedCustomer.phone, email: selectedCustomer.email || '', source: selectedCustomer.source || 'web', address: selectedCustomer.address || '', notes: selectedCustomer.notes || '' }) }}
                  className={`p-2 rounded-lg hover:bg-gray-100 transition ${editMode ? 'text-primary-600 bg-primary-50' : 'text-gray-500'}`}><Edit3 className="w-4 h-4" /></button>
                <button disabled={deleting} onClick={async () => {
                  if (!confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) return
                  setDeleting(true)
                  try {
                    await api.delete(`/customers/${selectedCustomer.id}`)
                    setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id))
                    setSelectedCustomer(null)
                  } catch (err: any) { alert(err?.response?.data?.detail || 'Müşteri silinemedi') } finally { setDeleting(false) }
                }} className="p-2 rounded-lg hover:bg-red-50 transition text-red-500"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => { setSelectedCustomer(null); setShowNoteForm(false); setEditMode(false) }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Düzenleme modu */}
              {editMode ? (
                <div className="bg-primary-50/30 border border-primary-200 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Müşteri Bilgilerini Düzenle</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Ad</label><input value={editCustomer.first_name || ''} onChange={e => setEditCustomer((p: any) => ({ ...p, first_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Soyad</label><input value={editCustomer.last_name || ''} onChange={e => setEditCustomer((p: any) => ({ ...p, last_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-gray-500 mb-1">Telefon</label><input value={editCustomer.phone || ''} onChange={e => setEditCustomer((p: any) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">E-posta</label><input value={editCustomer.email || ''} onChange={e => setEditCustomer((p: any) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none" /></div>
                  </div>
                  <div><label className="block text-xs text-gray-500 mb-1">Kaynak</label>
                    <select value={editCustomer.source || 'web'} onChange={e => setEditCustomer((p: any) => ({ ...p, source: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none">
                      <option value="web">Web</option><option value="referral">Referans</option><option value="walk_in">Ziyaret</option><option value="phone">Telefon</option><option value="ad">Reklam</option>
                    </select>
                  </div>
                  <div><label className="block text-xs text-gray-500 mb-1">Adres</label><textarea value={editCustomer.address || ''} onChange={e => setEditCustomer((p: any) => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none" rows={2} /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Notlar</label><textarea value={editCustomer.notes || ''} onChange={e => setEditCustomer((p: any) => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none" rows={2} /></div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">İptal</button>
                    <button disabled={saving} onClick={async () => {
                      setSaving(true)
                      try {
                        const res = await api.put(`/customers/${selectedCustomer.id}`, editCustomer)
                        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, ...res.data } : c))
                        setSelectedCustomer({ ...selectedCustomer, ...res.data })
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
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">Telefon</p><p className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedCustomer.phone}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">E-posta</p><p className="text-sm font-medium text-gray-900 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {selectedCustomer.email || '—'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">Kaynak</p>
                  {(() => {
                    const src = sourceConfig[selectedCustomer.source || ''] || { label: selectedCustomer.source || '—', color: 'text-gray-700', bg: 'bg-gray-50' }; return (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${src.bg} ${src.color}`}>{src.label}</span>
                    )
                  })()}
                </div>
              </div>
              {(selectedCustomer.tc_kimlik_no || selectedCustomer.address) && (
                <div className="grid grid-cols-1 gap-4">
                  {selectedCustomer.tc_kimlik_no && (
                    <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">TC Kimlik No</p><p className="text-sm font-medium text-gray-900">{selectedCustomer.tc_kimlik_no}</p></div>
                  )}
                  {selectedCustomer.address && (
                    <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500 mb-1">Adres</p><p className="text-sm text-gray-700">{selectedCustomer.address}</p></div>
                  )}
                </div>
              )}
              {selectedCustomer.notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                  <p className="text-xs text-amber-600 font-medium mb-1">Notlar</p>
                  <p className="text-sm text-gray-700">{selectedCustomer.notes}</p>
                </div>
              )}
              </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary-600">{opportunities.filter(o => o.customer_id === selectedCustomer.id).length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Fırsat</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary-600">{activities.filter(a => a.customer_id === selectedCustomer.id).length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Aktivite</p>
                </div>
              </div>

              {/* Not ekleme formu */}
              {showNoteForm ? (
                <div className="border border-primary-200 rounded-lg p-4 space-y-3 bg-primary-50/30">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4 text-primary-500" /> Not Ekle</h4>
                  <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none bg-white"
                    rows={3} placeholder="Müşteri hakkında not yazın..." autoFocus />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setShowNoteForm(false); setNoteText('') }} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition">İptal</button>
                    <button disabled={noteSaving || !noteText.trim()} onClick={async () => {
                      setNoteSaving(true)
                      try {
                        const res = await api.post('/customers/activities', {
                          customer_id: selectedCustomer.id,
                          activity_type: 'note',
                          subject: 'Not',
                          description: noteText.trim(),
                        })
                        setActivities(prev => [res.data, ...prev])
                        setNoteText('')
                        setShowNoteForm(false)
                      } catch (err: any) { alert(err?.response?.data?.detail || 'Not eklenemedi') } finally { setNoteSaving(false) }
                    }} className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5">
                      {noteSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition"><Phone className="w-4 h-4" /> Ara</button>
                  <button onClick={() => setShowNoteForm(true)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition"><MessageSquare className="w-4 h-4" /> Not Ekle</button>
                </div>
              )}

              {/* Bu müşterinin son aktiviteleri */}
              {(() => {
                const custActivities = activities.filter(a => a.customer_id === selectedCustomer.id).slice(0, 5)
                if (custActivities.length === 0) return null
                return (
                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Son Aktiviteler</h4>
                    <div className="space-y-2">
                      {custActivities.map(act => {
                        const Icon = activityIcons[act.activity_type] || MessageSquare
                        return (
                          <div key={act.id} className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5">
                            <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-700">{act.subject || act.activity_type}</span>
                              {act.description && <p className="text-gray-500 mt-0.5 line-clamp-1">{act.description}</p>}
                            </div>
                            <span className="text-gray-400 whitespace-nowrap">{new Date(act.activity_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Müşteri Modal ── */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowNewForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yeni Müşteri Ekle</h2>
              <button onClick={() => setShowNewForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Ad *</label><input value={newCustomer.first_name} onChange={e => setNewCustomer(p => ({ ...p, first_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Ahmet" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Soyad *</label><input value={newCustomer.last_name} onChange={e => setNewCustomer(p => ({ ...p, last_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Kaya" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Telefon *</label><input value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="0532 111 2233" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">E-posta</label><input value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="ahmet@email.com" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Kaynak</label>
                  <select value={newCustomer.source} onChange={e => setNewCustomer(p => ({ ...p, source: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white transition">
                    <option value="web">Web</option><option value="referral">Referans</option><option value="walk_in">Ziyaret</option><option value="phone">Telefon</option><option value="ad">Reklam</option>
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">TC Kimlik No</label><input value={newCustomer.tc_kimlik_no} onChange={e => setNewCustomer(p => ({ ...p, tc_kimlik_no: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="12345678901" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Adres</label><textarea value={newCustomer.address} onChange={e => setNewCustomer(p => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none" rows={2} placeholder="Müşteri adresi..." /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Notlar</label><textarea value={newCustomer.notes} onChange={e => setNewCustomer(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none" rows={2} placeholder="Müşteri ile ilgili notlar..." /></div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNewForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button disabled={saving || !newCustomer.first_name || !newCustomer.last_name || !newCustomer.phone} onClick={async () => {
                setSaving(true)
                try {
                  const payload: any = { first_name: newCustomer.first_name, last_name: newCustomer.last_name, phone: newCustomer.phone, source: newCustomer.source }
                  if (newCustomer.email) payload.email = newCustomer.email
                  if (newCustomer.tc_kimlik_no) payload.tc_kimlik_no = newCustomer.tc_kimlik_no
                  if (newCustomer.address) payload.address = newCustomer.address
                  if (newCustomer.notes) payload.notes = newCustomer.notes
                  const res = await api.post('/customers', payload)
                  setCustomers(prev => [res.data, ...prev])
                  setNewCustomer({ first_name: '', last_name: '', phone: '', email: '', source: 'web', tc_kimlik_no: '', address: '', notes: '' })
                  setShowNewForm(false)
                } catch (err: any) { alert(err?.response?.data?.detail || 'Müşteri eklenemedi') } finally { setSaving(false) }
              }} className="px-5 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Fırsat Modal ── */}
      {showOppForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowOppForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yeni Fırsat Ekle</h2>
              <button onClick={() => setShowOppForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Müşteri *</label>
                <select value={newOpp.customer_id} onChange={e => setNewOpp(p => ({ ...p, customer_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                  <option value="">Seçiniz...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Teklif Fiyatı (TL)</label>
                  <input type="number" value={newOpp.offered_price} onChange={e => setNewOpp(p => ({ ...p, offered_price: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="3500000" />
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Öncelik</label>
                  <select value={newOpp.priority} onChange={e => setNewOpp(p => ({ ...p, priority: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                    <option value="high">Yüksek</option><option value="medium">Orta</option><option value="low">Düşük</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Hedef Kapanış Tarihi</label>
                <input type="date" value={newOpp.expected_close} onChange={e => setNewOpp(p => ({ ...p, expected_close: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" />
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Notlar</label>
                <textarea value={newOpp.notes} onChange={e => setNewOpp(p => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none" rows={2} placeholder="Fırsat hakkında notlar..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowOppForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button disabled={saving || !newOpp.customer_id} onClick={async () => {
                setSaving(true)
                try {
                  const payload: any = { customer_id: newOpp.customer_id, priority: newOpp.priority }
                  if (newOpp.offered_price) payload.offered_price = Number(newOpp.offered_price)
                  if (newOpp.expected_close) payload.expected_close = newOpp.expected_close
                  if (newOpp.notes) payload.notes = newOpp.notes
                  const res = await api.post('/customers/opportunities', payload)
                  setOpportunities(prev => [res.data, ...prev])
                  setNewOpp({ customer_id: '', offered_price: '', priority: 'medium', expected_close: '', notes: '' })
                  setShowOppForm(false)
                } catch (err: any) { alert(err?.response?.data?.detail || 'Fırsat eklenemedi') } finally { setSaving(false) }
              }} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Fırsat Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Aktivite Modal ── */}
      {showActForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowActForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Yeni Aktivite Ekle</h2>
              <button onClick={() => setShowActForm(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Müşteri *</label>
                <select value={newAct.customer_id} onChange={e => setNewAct(p => ({ ...p, customer_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                  <option value="">Seçiniz...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Aktivite Türü *</label>
                  <select value={newAct.activity_type} onChange={e => setNewAct(p => ({ ...p, activity_type: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none bg-white">
                    <option value="call">Arama</option><option value="meeting">Toplantı</option>
                    <option value="email">E-posta</option><option value="note">Not</option>
                    <option value="site_visit">Saha Ziyareti</option>
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Konu</label>
                  <input value={newAct.subject} onChange={e => setNewAct(p => ({ ...p, subject: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition" placeholder="Fiyat görüşmesi" />
                </div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1.5">Açıklama</label>
                <textarea value={newAct.description} onChange={e => setNewAct(p => ({ ...p, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none" rows={3} placeholder="Aktivite detayları..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowActForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">İptal</button>
              <button disabled={saving || !newAct.customer_id} onClick={async () => {
                setSaving(true)
                try {
                  const payload: any = { customer_id: newAct.customer_id, activity_type: newAct.activity_type }
                  if (newAct.subject) payload.subject = newAct.subject
                  if (newAct.description) payload.description = newAct.description
                  const res = await api.post('/customers/activities', payload)
                  setActivities(prev => [res.data, ...prev])
                  setNewAct({ customer_id: '', activity_type: 'call', subject: '', description: '' })
                  setShowActForm(false)
                } catch (err: any) { alert(err?.response?.data?.detail || 'Aktivite eklenemedi') } finally { setSaving(false) }
              }} className="px-5 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition shadow-sm hover:shadow-md flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Aktivite Ekle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
