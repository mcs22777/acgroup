# İnşaat ERP — Yazılım Mimarisi ve Geliştirme Planı

> **Hazırlanma Tarihi:** 11 Nisan 2026
> **Versiyon:** 1.0
> **Kapsam:** CRM, Stok Yönetimi, Finans Takibi — İnşaat Firması

---

## 1. Önerilen Teknoloji Mimarisi

### Genel Mimari: Monolitik Modüler (Modular Monolith)

Mikroservis yerine **modüler monolit** öneriyorum. Sebepleri:

- Küçük-orta ölçekli bir ekiple geliştirme yapılacak; mikroservis operasyonel yükü bu aşamada gereksiz.
- Modüller arası sınırlar net tutulursa ileride mikroservise geçiş kolay olur.
- Tek deployment birimi, tek veritabanı — DevOps karmaşıklığı minimum.
- Docker ile paketlendiğinde zaten izole ve taşınabilir bir yapı elde edilir.

```
┌─────────────────────────────────────────────────────────────┐
│                        KULLANICILAR                         │
│              Web Tarayıcı  /  iPhone Uygulaması             │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
       ┌───────▼───────┐          ┌───────▼───────┐
       │   React Web   │          │  React Native │
       │   (Next.js)   │          │   (Expo)      │
       └───────┬───────┘          └───────┬───────┘
               │         REST API         │
               └────────────┬─────────────┘
                            │
                  ┌─────────▼─────────┐
                  │   Nginx / Caddy   │
                  │   Reverse Proxy   │
                  └─────────┬─────────┘
                            │
                  ┌─────────▼─────────┐
                  │   FastAPI (Python) │
                  │   Backend API      │
                  ├───────────────────┤
                  │ ┌───┐ ┌───┐ ┌───┐│
                  │ │PRJ│ │CRM│ │FIN││  ← Modüller
                  │ └───┘ └───┘ └───┘│
                  │ ┌───┐ ┌───┐ ┌───┐│
                  │ │DOC│ │RPT│ │AUT││
                  │ └───┘ └───┘ └───┘│
                  └─────────┬─────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
     ┌────────▼───┐  ┌─────▼─────┐ ┌─────▼─────┐
     │ PostgreSQL │  │   Redis   │ │  MinIO /   │
     │   (Ana DB) │  │  (Cache)  │ │  S3 (Dosya)│
     └────────────┘  └───────────┘ └───────────┘
```

---

## 2. Backend Teknoloji Seçimi: Python + FastAPI

### Neden Python?

- **FastAPI** modern, async destekli, otomatik OpenAPI/Swagger dökümantasyonu üretir.
- **Pydantic v2** ile güçlü veri validasyonu — CRM ve finans modüllerinde kritik.
- Python ekosistemi: PDF üretimi (WeasyPrint, ReportLab), Excel export (openpyxl), raporlama araçları zengin.
- Türkiye'de Python geliştirici havuzu geniş; ekip kurması kolay.

### Neden FastAPI (Django değil)?

- Django monolitik ve opinionated; kendi ORM'i, admin paneli vs. bir arada gelir. Küçük projede avantaj olabilir ama büyüdükçe esneklik kaybı yaşanır.
- FastAPI daha hafif, async-native, API-first yaklaşıma uygun.
- React + React Native frontend'leri REST API tüketecek; Django'nun template engine'ine ihtiyaç yok.
- Performans: FastAPI, Django REST Framework'ten ölçülebilir biçimde daha hızlı (async I/O sayesinde).

### ORM: SQLAlchemy 2.0 + Alembic

- SQLAlchemy 2.0: Modern async desteği, güçlü ilişki yönetimi.
- Alembic: Veritabanı migration'ları için endüstri standardı.

### Alternatif Değerlendirme

| Seçenek | Avantaj | Dezavantaj | Karar |
|---------|---------|------------|-------|
| Node.js + Express/Nest | JS ekosistemi, full-stack JS | Tip güvenliği zayıf (TS ile iyileşir), finans hesaplamalarında dikkat gerekir | Uygun ama Python daha güçlü ekosistem |
| Go + Gin | Yüksek performans | Geliştirme hızı düşük, ORM zayıf | Bu proje için overkill |
| .NET | Enterprise-grade | Ekosistem Türkiye'de dar, hosting maliyeti yüksek | Uygun değil |
| **Python + FastAPI** | **Hızlı geliştirme, zengin kütüphane, kolay bakım** | **CPU-yoğun işlerde Go/Rust kadar hızlı değil** | **Seçilen** |

---

## 3. Frontend Teknoloji Seçimi

### Web: Next.js (React)
### Mobil: React Native (Expo)

### Neden bu ikili?

- **Ortak kod tabanı hedefi:** React ve React Native arasında iş mantığı (hooks, state management, API çağrıları, validasyon) paylaşılabilir. Bunu bir **monorepo** yapısıyla (Turborepo) yönetmek en temiz çözüm.
- **Next.js:** SSR/SSG desteği, SEO (gerekirse), API routes, middleware — web için en olgun React framework.
- **Expo:** React Native geliştirmeyi kolaylaştırır. App Store'a yüklemeden cihaza kurulum için **Expo EAS (Enterprise/Ad Hoc)** build desteği var — tam olarak istenen özellik.
- **iPhone'a App Store'suz yükleme:** Expo EAS ile Ad Hoc distribution veya Apple Enterprise Program ile internal distribution yapılabilir. TestFlight de bir opsiyon.

### Monorepo Yapısı (Turborepo)

```
apps/
  web/                  → Next.js web uygulaması
  mobile/               → Expo React Native uygulaması
packages/
  shared/               → Ortak iş mantığı
    hooks/              → useAuth, useProjects, useUnits...
    api/                → API client (axios/fetch wrapper)
    types/              → TypeScript tip tanımları
    validation/         → Zod şemaları (form validasyonları)
    utils/              → Tarih, para formatı, hesaplamalar
  ui/                   → Ortak UI bileşenleri (mümkün olduğunca)
```

### UI Kütüphanesi

- **Web:** shadcn/ui + Tailwind CSS — modern, özelleştirilebilir, hafif.
- **Mobil:** React Native Paper veya Tamagui — Material Design uyumlu, cross-platform.

---

## 4. Sistem Modülleri

```
┌─────────────────────────────────────────────────┐
│              UYGULAMA MODÜLLERİ                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ AUTH          │  │ PROJE & STOK YÖNETİMİ   │ │
│  │ Kimlik doğr.  │  │ Projeler, Bloklar,       │ │
│  │ Rol yönetimi  │  │ Daireler, Durumlar       │ │
│  └──────────────┘  └──────────────────────────┘ │
│                                                 │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ CRM           │  │ SÖZLEŞME & DOKÜMAN      │ │
│  │ Müşteriler    │  │ Şablonlar, PDF üretimi,  │ │
│  │ Fırsatlar     │  │ Versiyon takibi          │ │
│  │ Aktiviteler   │  └──────────────────────────┘ │
│  └──────────────┘                               │
│                                                 │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ SATIŞ &       │  │ FİRMA GİDERLERİ         │ │
│  │ TAHSİLAT      │  │ Tedarikçiler, Ödemeler,  │ │
│  │ Ödemeler,     │  │ Vadeler                  │ │
│  │ Taksitler     │  └──────────────────────────┘ │
│  └──────────────┘                               │
│                                                 │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ RAPORLAMA &   │  │ BİLDİRİM SİSTEMİ       │ │
│  │ DASHBOARD     │  │ E-posta, Push, SMS       │ │
│  └──────────────┘  └──────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Modül Detayları

**A) Auth Modülü**
- JWT tabanlı kimlik doğrulama (access + refresh token).
- Rol tabanlı yetkilendirme (RBAC).
- Oturum yönetimi, şifre sıfırlama.

**B) Proje & Stok Yönetimi Modülü**
- Proje CRUD (oluştur, düzenle, sil, listele).
- Blok ve kat yapısı tanımlama.
- Daire kayıtları ve durum yönetimi.
- Toplu daire oluşturma (bir blokta 5 kat x 4 daire gibi).
- Daire durum geçişleri: Satışa Uygun → Rezerve → Satılmış (state machine).

**C) CRM Modülü**
- Müşteri kaydı ve arama.
- Satış fırsatı (opportunity) takibi.
- İletişim geçmişi (arama, toplantı, e-posta notu).
- Fırsat durumları: Yeni → İletişimde → Teklif Verildi → Müzakere → Kazanıldı / Kaybedildi.
- Bir müşterinin birden fazla fırsatı olabilir.

**D) Sözleşme & Doküman Modülü**
- Sözleşme şablonları (proje bazlı).
- Şablon değişkenleri: {{müşteri_adı}}, {{daire_no}}, {{satış_bedeli}} vb.
- PDF üretimi (WeasyPrint veya wkhtmltopdf).
- Doküman versiyonlama.
- Dosya depolama: MinIO (S3-uyumlu, self-hosted).

**E) Satış & Tahsilat Modülü**
- Satış kaydı oluşturma (daire + müşteri + finansal bilgiler).
- Otomatik taksit planı üretimi.
- Ödeme kaydı girişi.
- Gecikme hesaplama ve uyarı.
- Aylık tahsilat özeti.

**F) Firma Giderleri Modülü**
- Tedarikçi/alacaklı kaydı.
- Gider kaydı (tutar, vade, kategori, not).
- Ödeme durumu takibi.
- Vade takvimi.

**G) Raporlama & Dashboard Modülü**
- Anlık stok özeti (proje bazlı).
- Finansal özet (alacak, borç, nakit akışı).
- CRM metrikleri (fırsat sayıları, dönüşüm oranı).
- Grafik ve chart'lar (Recharts kütüphanesi).

---

## 5. Kullanıcı Rolleri

| Rol | Açıklama | Erişim |
|-----|----------|--------|
| **Admin** | Firma sahibi / yönetici | Tüm modüllere tam erişim, kullanıcı yönetimi, sistem ayarları |
| **Satış Müdürü** | Satış ekibi yöneticisi | CRM, stok, satış, raporlar — tam erişim; firma giderleri — sadece görüntüleme |
| **Satış Danışmanı** | Saha satışçısı | CRM (kendi müşterileri), stok görüntüleme, satış kaydı oluşturma |
| **Muhasebe** | Mali işler sorumlusu | Tahsilat, firma giderleri, raporlar — tam erişim; CRM — salt okunur |
| **Görüntüleyici** | Sadece raporları görebilen kişi | Dashboard ve raporlar — salt okunur |

### Yetki Matrisi

```
Modül              Admin  Sat.Md.  Sat.Dan.  Muhasebe  Görüntüleyici
─────────────────────────────────────────────────────────────────────
Projeler/Stok       CRUD   CRUD     R         R         R
CRM                 CRUD   CRUD     CRUD*     R         -
Sözleşmeler         CRUD   CRUD     R         R         -
Satış/Tahsilat      CRUD   CRUD     CR        CRUD      R
Firma Giderleri     CRUD   R        -         CRUD      R
Raporlar            R      R        R**       R         R
Kullanıcı Yönetimi  CRUD   -        -         -         -

* Satış danışmanı sadece kendi müşterilerini görür
** Satış danışmanı sadece kendi performans raporunu görür
```

---

## 6. Veritabanı Tabloları ve İlişkileri

### ER Diyagramı (Basitleştirilmiş)

```
┌──────────┐     ┌───────────┐     ┌──────────────┐
│  users   │     │ projects  │────<│    blocks     │
└──────────┘     └───────────┘     └──────┬───────┘
                                          │
                                   ┌──────▼───────┐
                                   │    units      │
                                   │  (daireler)   │
                                   └──────┬───────┘
                                          │
              ┌───────────┐        ┌──────▼───────┐
              │ customers │───────<│opportunities │
              └───────────┘        └──────┬───────┘
                                          │
                                   ┌──────▼───────┐     ┌──────────────┐
                                   │   sales      │────<│ installments │
                                   └──────┬───────┘     └──────────────┘
                                          │
                                   ┌──────▼───────┐     ┌──────────────┐
                                   │  contracts   │────<│  documents   │
                                   └──────────────┘     └──────────────┘

              ┌───────────┐        ┌──────────────┐
              │ suppliers │───────<│  expenses     │
              └───────────┘        └──────────────┘
```

### Tablo Tanımları

```sql
-- ============================================
-- AUTH & KULLANICI
-- ============================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    role            VARCHAR(50) NOT NULL DEFAULT 'viewer',
                    -- admin, sales_manager, sales_agent, accountant, viewer
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROJE & STOK
-- ============================================

CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE NOT NULL,       -- "PARK-EVLER", "DENIZ-KONAKLARI"
    city            VARCHAR(100),
    district        VARCHAR(100),
    address         TEXT,
    description     TEXT,
    total_units     INTEGER DEFAULT 0,
    status          VARCHAR(50) DEFAULT 'active',      -- active, completed, on_hold
    start_date      DATE,
    expected_end    DATE,
    image_url       VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,              -- "A Blok", "B Blok"
    total_floors    INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE units (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    block_id        UUID REFERENCES blocks(id),
    floor_number    INTEGER NOT NULL,
    unit_number     VARCHAR(20) NOT NULL,               -- "A-3-12" gibi
    room_type       VARCHAR(50) NOT NULL,               -- "2+1", "3+1", "4+1"
    gross_area_m2   DECIMAL(10,2),
    net_area_m2     DECIMAL(10,2),
    list_price      DECIMAL(15,2) NOT NULL,
    status          VARCHAR(50) DEFAULT 'available',
                    -- available, reserved, negotiation, sold
    has_balcony     BOOLEAN DEFAULT FALSE,
    has_parking     BOOLEAN DEFAULT FALSE,
    direction       VARCHAR(50),                        -- "Güney", "Kuzey-Batı"
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, block_id, floor_number, unit_number)
);

CREATE INDEX idx_units_project_status ON units(project_id, status);
CREATE INDEX idx_units_status ON units(status);

-- ============================================
-- CRM / MÜŞTERİ TAKİBİ
-- ============================================

CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20) NOT NULL,
    phone_secondary VARCHAR(20),
    email           VARCHAR(255),
    tc_kimlik_no    VARCHAR(11),                        -- TC Kimlik (opsiyonel)
    address         TEXT,
    source          VARCHAR(50),                        -- web, referral, walk_in, phone, ad
    notes           TEXT,
    assigned_to     UUID REFERENCES users(id),          -- Sorumlu satış danışmanı
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_assigned ON customers(assigned_to);

CREATE TABLE opportunities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID NOT NULL REFERENCES customers(id),
    project_id      UUID REFERENCES projects(id),
    unit_id         UUID REFERENCES units(id),          -- İlgilendiği daire (opsiyonel)
    offered_price   DECIMAL(15,2),
    status          VARCHAR(50) DEFAULT 'new',
                    -- new, contacted, proposal_sent, negotiation, won, lost
    priority        VARCHAR(20) DEFAULT 'medium',       -- low, medium, high
    expected_close  DATE,
    loss_reason     TEXT,
    assigned_to     UUID REFERENCES users(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);

CREATE TABLE activities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID NOT NULL REFERENCES customers(id),
    opportunity_id  UUID REFERENCES opportunities(id),
    user_id         UUID NOT NULL REFERENCES users(id), -- Görüşmeyi yapan kişi
    activity_type   VARCHAR(50) NOT NULL,               -- call, meeting, email, note, site_visit
    subject         VARCHAR(255),
    description     TEXT,
    activity_date   TIMESTAMPTZ DEFAULT NOW(),
    next_action     TEXT,
    next_action_date DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activities_customer ON activities(customer_id);
CREATE INDEX idx_activities_date ON activities(activity_date);

-- ============================================
-- SÖZLEŞME & DOKÜMAN
-- ============================================

CREATE TABLE contract_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID REFERENCES projects(id),       -- NULL ise genel şablon
    name            VARCHAR(255) NOT NULL,
    content_html    TEXT NOT NULL,                       -- HTML şablon ({{degisken}} formatında)
    version         INTEGER DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contracts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id         UUID NOT NULL,                      -- REFERENCES sales(id)
    template_id     UUID REFERENCES contract_templates(id),
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    content_html    TEXT,                                -- Oluşturulan sözleşme HTML'i
    status          VARCHAR(50) DEFAULT 'draft',        -- draft, signed, cancelled
    signed_date     DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    related_type    VARCHAR(50) NOT NULL,                -- sale, contract, project, customer
    related_id      UUID NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,               -- MinIO/S3 path
    file_size       BIGINT,
    mime_type       VARCHAR(100),
    version         INTEGER DEFAULT 1,
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_related ON documents(related_type, related_id);

-- ============================================
-- SATIŞ & TAHSİLAT
-- ============================================

CREATE TABLE sales (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         UUID NOT NULL REFERENCES units(id),
    customer_id     UUID NOT NULL REFERENCES customers(id),
    opportunity_id  UUID REFERENCES opportunities(id),
    sale_date       DATE NOT NULL,
    sale_price      DECIMAL(15,2) NOT NULL,
    down_payment    DECIMAL(15,2) DEFAULT 0,
    remaining_debt  DECIMAL(15,2) NOT NULL,
    installment_count INTEGER DEFAULT 0,
    payment_start_date DATE,
    status          VARCHAR(50) DEFAULT 'active',       -- active, completed, cancelled
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE installments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    installment_no  INTEGER NOT NULL,
    due_date        DATE NOT NULL,
    amount          DECIMAL(15,2) NOT NULL,
    paid_amount     DECIMAL(15,2) DEFAULT 0,
    paid_date       DATE,
    status          VARCHAR(50) DEFAULT 'pending',
                    -- pending, paid, partial, overdue
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_installments_sale ON installments(sale_id);
CREATE INDEX idx_installments_due ON installments(due_date, status);
CREATE INDEX idx_installments_status ON installments(status);

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id         UUID NOT NULL REFERENCES sales(id),
    installment_id  UUID REFERENCES installments(id),
    amount          DECIMAL(15,2) NOT NULL,
    payment_date    DATE NOT NULL,
    payment_method  VARCHAR(50),                        -- cash, bank_transfer, credit_card, check
    reference_no    VARCHAR(100),
    notes           TEXT,
    recorded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FİRMA GİDERLERİ
-- ============================================

CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    contact_person  VARCHAR(255),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    tax_number      VARCHAR(20),
    address         TEXT,
    category        VARCHAR(100),                       -- malzeme, iscilik, taseron, diger
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id     UUID REFERENCES suppliers(id),
    project_id      UUID REFERENCES projects(id),       -- Hangi projeye ait (opsiyonel)
    category        VARCHAR(100) NOT NULL,              -- malzeme, iscilik, kira, vergi, diger
    description     VARCHAR(500) NOT NULL,
    amount          DECIMAL(15,2) NOT NULL,
    due_date        DATE NOT NULL,
    paid_amount     DECIMAL(15,2) DEFAULT 0,
    paid_date       DATE,
    status          VARCHAR(50) DEFAULT 'pending',      -- pending, paid, partial, overdue
    payment_method  VARCHAR(50),
    invoice_no      VARCHAR(100),
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_due ON expenses(due_date, status);
CREATE INDEX idx_expenses_project ON expenses(project_id);
CREATE INDEX idx_expenses_supplier ON expenses(supplier_id);

-- ============================================
-- AUDIT LOG
-- ============================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(50) NOT NULL,               -- create, update, delete
    entity_type     VARCHAR(50) NOT NULL,               -- unit, sale, payment, ...
    entity_id       UUID NOT NULL,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

---

## 7. Örnek Entity / Model Yapıları (Python — SQLAlchemy)

```python
# backend/app/models/unit.py

from sqlalchemy import Column, String, Integer, Numeric, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.db.base import Base, TimestampMixin


class Unit(Base, TimestampMixin):
    __tablename__ = "units"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    block_id = Column(UUID(as_uuid=True), ForeignKey("blocks.id"))
    floor_number = Column(Integer, nullable=False)
    unit_number = Column(String(20), nullable=False)
    room_type = Column(String(50), nullable=False)       # "2+1", "3+1"
    gross_area_m2 = Column(Numeric(10, 2))
    net_area_m2 = Column(Numeric(10, 2))
    list_price = Column(Numeric(15, 2), nullable=False)
    status = Column(String(50), default="available")
    has_balcony = Column(Boolean, default=False)
    has_parking = Column(Boolean, default=False)
    direction = Column(String(50))
    notes = Column(Text)

    # İlişkiler
    project = relationship("Project", back_populates="units")
    block = relationship("Block", back_populates="units")
    sales = relationship("Sale", back_populates="unit")
    opportunities = relationship("Opportunity", back_populates="unit")
```

```python
# backend/app/schemas/unit.py  (Pydantic)

from pydantic import BaseModel, Field
from decimal import Decimal
from uuid import UUID
from typing import Optional
from enum import Enum


class UnitStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    NEGOTIATION = "negotiation"
    SOLD = "sold"


class UnitCreate(BaseModel):
    project_id: UUID
    block_id: Optional[UUID] = None
    floor_number: int = Field(ge=0)
    unit_number: str = Field(max_length=20)
    room_type: str                            # "2+1", "3+1"
    gross_area_m2: Optional[Decimal] = None
    net_area_m2: Optional[Decimal] = None
    list_price: Decimal = Field(gt=0)
    has_balcony: bool = False
    has_parking: bool = False
    direction: Optional[str] = None
    notes: Optional[str] = None


class UnitResponse(BaseModel):
    id: UUID
    project_id: UUID
    block_id: Optional[UUID]
    floor_number: int
    unit_number: str
    room_type: str
    gross_area_m2: Optional[Decimal]
    net_area_m2: Optional[Decimal]
    list_price: Decimal
    status: UnitStatus
    has_balcony: bool
    has_parking: bool
    direction: Optional[str]
    project_name: Optional[str] = None        # Join ile gelecek

    model_config = {"from_attributes": True}


class UnitStatusUpdate(BaseModel):
    status: UnitStatus
    notes: Optional[str] = None
```

```python
# backend/app/models/sale.py

class Sale(Base, TimestampMixin):
    __tablename__ = "sales"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    sale_date = Column(Date, nullable=False)
    sale_price = Column(Numeric(15, 2), nullable=False)
    down_payment = Column(Numeric(15, 2), default=0)
    remaining_debt = Column(Numeric(15, 2), nullable=False)
    installment_count = Column(Integer, default=0)
    payment_start_date = Column(Date)
    status = Column(String(50), default="active")

    # İlişkiler
    unit = relationship("Unit", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
    installments = relationship("Installment", back_populates="sale",
                                order_by="Installment.installment_no")
    payments = relationship("Payment", back_populates="sale")
    contracts = relationship("Contract", back_populates="sale")
```

---

## 8. API Tasarımı

### Genel Prensipler

- RESTful tasarım, JSON formatı.
- Versiyonlama: `/api/v1/...`
- Sayfalama: `?page=1&page_size=20`
- Filtreleme: `?status=available&project_id=xxx`
- Sıralama: `?sort_by=created_at&sort_order=desc`
- JWT Bearer token ile kimlik doğrulama.

### Endpoint Haritası

```
AUTH
────────────────────────────────────────────
POST   /api/v1/auth/login                  Giriş (email + şifre → JWT)
POST   /api/v1/auth/refresh                Token yenileme
POST   /api/v1/auth/logout                 Çıkış
POST   /api/v1/auth/forgot-password        Şifre sıfırlama talebi
POST   /api/v1/auth/reset-password         Şifre sıfırlama

PROJELER
────────────────────────────────────────────
GET    /api/v1/projects                    Proje listesi
POST   /api/v1/projects                    Yeni proje oluştur
GET    /api/v1/projects/{id}               Proje detayı
PUT    /api/v1/projects/{id}               Proje güncelle
DELETE /api/v1/projects/{id}               Proje sil
GET    /api/v1/projects/{id}/summary       Proje özet istatistik

BLOKLAR
────────────────────────────────────────────
GET    /api/v1/projects/{id}/blocks        Projedeki bloklar
POST   /api/v1/projects/{id}/blocks        Yeni blok
PUT    /api/v1/blocks/{id}                 Blok güncelle
DELETE /api/v1/blocks/{id}                 Blok sil

DAİRELER (UNITS)
────────────────────────────────────────────
GET    /api/v1/units                       Daire listesi (filtreli)
POST   /api/v1/units                       Yeni daire
POST   /api/v1/units/bulk                  Toplu daire oluşturma
GET    /api/v1/units/{id}                  Daire detayı
PUT    /api/v1/units/{id}                  Daire güncelle
PATCH  /api/v1/units/{id}/status           Durum değiştir
GET    /api/v1/projects/{id}/units         Projedeki daireler
GET    /api/v1/projects/{id}/units/matrix  Proje daire matrisi (kat x blok)

MÜŞTERİLER
────────────────────────────────────────────
GET    /api/v1/customers                   Müşteri listesi
POST   /api/v1/customers                   Yeni müşteri
GET    /api/v1/customers/{id}              Müşteri detayı
PUT    /api/v1/customers/{id}              Müşteri güncelle
GET    /api/v1/customers/{id}/activities   Müşteri aktiviteleri
GET    /api/v1/customers/{id}/opportunities Müşteri fırsatları

FIRSATLAR (OPPORTUNITIES)
────────────────────────────────────────────
GET    /api/v1/opportunities               Fırsat listesi
POST   /api/v1/opportunities               Yeni fırsat
GET    /api/v1/opportunities/{id}          Fırsat detayı
PUT    /api/v1/opportunities/{id}          Fırsat güncelle
PATCH  /api/v1/opportunities/{id}/status   Durum değiştir

AKTİVİTELER
────────────────────────────────────────────
POST   /api/v1/activities                  Yeni aktivite kaydet
GET    /api/v1/activities                  Aktivite listesi (filtreli)

SATIŞLAR
────────────────────────────────────────────
GET    /api/v1/sales                       Satış listesi
POST   /api/v1/sales                       Yeni satış oluştur
GET    /api/v1/sales/{id}                  Satış detayı
GET    /api/v1/sales/{id}/installments     Taksit planı
GET    /api/v1/sales/{id}/payments         Ödeme geçmişi

TAKSİTLER & ÖDEMELER
────────────────────────────────────────────
POST   /api/v1/payments                    Ödeme kaydet
GET    /api/v1/installments/overdue        Geciken taksitler
GET    /api/v1/installments/upcoming       Yaklaşan taksitler

SÖZLEŞMELER
────────────────────────────────────────────
GET    /api/v1/contract-templates          Şablon listesi
POST   /api/v1/contract-templates          Yeni şablon
POST   /api/v1/contracts/generate          Sözleşme üret (şablon + veri)
GET    /api/v1/contracts/{id}              Sözleşme detayı
GET    /api/v1/contracts/{id}/download     PDF indir

TEDARİKÇİLER & GİDERLER
────────────────────────────────────────────
GET    /api/v1/suppliers                   Tedarikçi listesi
POST   /api/v1/suppliers                   Yeni tedarikçi
GET    /api/v1/expenses                    Gider listesi
POST   /api/v1/expenses                    Yeni gider
PUT    /api/v1/expenses/{id}               Gider güncelle
PATCH  /api/v1/expenses/{id}/pay           Ödeme kaydet

DASHBOARD & RAPORLAR
────────────────────────────────────────────
GET    /api/v1/dashboard/stock-summary     Anlık stok özeti
GET    /api/v1/dashboard/financial-summary Bu ayki finansal özet
GET    /api/v1/dashboard/crm-summary       CRM metrikleri
GET    /api/v1/dashboard/overdue           Geciken ödemeler
GET    /api/v1/dashboard/upcoming-payments Yaklaşan ödemeler
GET    /api/v1/reports/cash-flow           Nakit akışı raporu
GET    /api/v1/reports/sales               Satış raporu (tarih aralığı)
GET    /api/v1/reports/project/{id}        Proje bazlı detaylı rapor
```

---

## 9. Web ve Mobil Ekran Önerileri

### Web Ekranları

```
1. Dashboard (Ana Sayfa)
   ├── Stok özet kartları (proje bazlı: boş/rezerve/satılmış)
   ├── Bu ay beklenen tahsilat
   ├── Geciken ödemeler uyarısı
   ├── Yaklaşan firma ödemeleri
   ├── Son aktiviteler (timeline)
   └── CRM: Açık fırsat sayısı, bu hafta kapanan

2. Projeler
   ├── Proje listesi (kart veya tablo görünümü)
   ├── Proje detay sayfası
   │   ├── Blok/Kat/Daire matrisi (renk kodlu durum haritası)
   │   ├── Proje istatistikleri
   │   └── Projeye ait satışlar
   └── Yeni proje / düzenleme formu

3. Daireler
   ├── Filtrelenebilir daire listesi
   ├── Daire detay sayfası
   ├── Durum değiştirme (quick action)
   └── Toplu daire oluşturma

4. CRM
   ├── Müşteri listesi (arama + filtreleme)
   ├── Müşteri detay sayfası
   │   ├── İletişim bilgileri
   │   ├── Fırsatlar
   │   ├── Aktivite geçmişi (timeline)
   │   └── Notlar
   ├── Fırsat kanban board (Yeni → İletişimde → Teklif → Müzakere → Kazanıldı)
   └── Yeni müşteri / fırsat formu

5. Satışlar
   ├── Satış listesi
   ├── Satış detayı
   │   ├── Daire + müşteri bilgisi
   │   ├── Taksit planı tablosu
   │   ├── Ödeme geçmişi
   │   └── Sözleşme bağlantısı
   └── Yeni satış formu (daire seç → müşteri seç → fiyat + taksit ayarla)

6. Tahsilat
   ├── Aylık tahsilat takvimi
   ├── Geciken ödemeler listesi
   ├── Ödeme kayıt formu
   └── Toplu ödeme listesi

7. Firma Giderleri
   ├── Gider listesi (filtre: tedarikçi, kategori, durum, tarih)
   ├── Tedarikçi listesi
   ├── Yeni gider / ödeme kayıt formu
   └── Vade takvimi

8. Sözleşmeler
   ├── Şablon yönetimi
   ├── Oluşturulmuş sözleşmeler
   └── PDF önizleme / indirme

9. Raporlar
   ├── Proje bazlı satış raporu
   ├── Aylık nakit akışı
   ├── Alacak-borç özeti
   └── CRM performans raporu

10. Ayarlar (Admin)
    ├── Kullanıcı yönetimi
    ├── Rol ve yetki ayarları
    └── Sistem ayarları
```

### Mobil Ekranlar (Öncelikli)

```
1. Dashboard (Tab 1)
   ├── Özet kartlar (stok, tahsilat, geciken)
   └── Hızlı erişim butonları

2. Projeler / Daireler (Tab 2)
   ├── Proje listesi
   ├── Proje detay + daire durum matrisi
   └── Daire durum değiştirme (swipe action)

3. CRM (Tab 3)
   ├── Müşteri arama
   ├── Müşteri detay
   ├── Hızlı arama notu ekleme
   ├── Arama butonu (müşteriyi doğrudan ara)
   └── Fırsat listesi

4. Tahsilat (Tab 4)
   ├── Bugün / bu hafta beklenen ödemeler
   ├── Geciken ödemeler
   └── Hızlı ödeme kayıt

5. Profil & Ayarlar (Tab 5)
   ├── Bildirim ayarları
   └── Çıkış
```

---

## 10. Sözleşme ve Doküman Yönetimi Yaklaşımı

### Mimari

```
Şablon Oluşturma       Sözleşme Üretimi         Depolama
─────────────────      ──────────────────       ──────────
HTML şablon            Jinja2 template engine    MinIO (S3)
Değişkenler:           Veri: Sale + Customer     Versiyonlama
{{müşteri_adı}}       + Unit + Project           Metadata: DB
{{daire_no}}          → HTML render
{{satış_bedeli}}      → WeasyPrint → PDF
```

### Akış

1. Admin, HTML formatında sözleşme şablonu oluşturur. Değişkenler `{{çift_süslü_parantez}}` ile tanımlanır.
2. Satış yapıldığında, sistem şablonu müşteri/daire/fiyat verileriyle doldurur (Jinja2).
3. Doldurulmuş HTML, WeasyPrint ile PDF'e çevrilir.
4. PDF, MinIO'ya yüklenir; referans bilgisi `documents` tablosuna kaydedilir.
5. Kullanıcı istediği zaman PDF'i indirebilir.

### İleride Eklenebilecek

- Dijital imza entegrasyonu (e-imza).
- Sözleşme karşılaştırma (diff).
- OCR ile taranmış sözleşme arşivleme.

---

## 11. Ödeme / Tahsilat Modülü Tasarımı

### Satış Oluşturma Akışı

```
1. Daire seçimi (status: available → reserved)
2. Müşteri seçimi veya yeni müşteri kaydı
3. Satış bilgileri girişi:
   - Satış bedeli
   - Peşinat tutarı
   - Taksit sayısı
   - İlk taksit tarihi
4. Sistem otomatik olarak:
   - remaining_debt = sale_price - down_payment
   - Taksit planı oluşturur (eşit taksit)
   - Daire durumunu "sold" yapar
   - Fırsat durumunu "won" yapar
```

### Taksit Planı Oluşturma (Örnek Servis Kodu)

```python
# backend/app/services/installment_service.py

from datetime import date
from dateutil.relativedelta import relativedelta
from decimal import Decimal, ROUND_HALF_UP


def generate_installment_plan(
    remaining_debt: Decimal,
    installment_count: int,
    start_date: date,
) -> list[dict]:
    """Eşit taksitli ödeme planı üretir."""
    monthly_amount = (remaining_debt / installment_count).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    plan = []
    total_assigned = Decimal("0")

    for i in range(installment_count):
        due = start_date + relativedelta(months=i)

        # Son taksitte kalan farkı ayarla (kuruş farkı)
        if i == installment_count - 1:
            amount = remaining_debt - total_assigned
        else:
            amount = monthly_amount
            total_assigned += amount

        plan.append({
            "installment_no": i + 1,
            "due_date": due,
            "amount": amount,
            "status": "pending",
        })

    return plan
```

### Gecikme Kontrolü (Cron Job)

```python
# Her gün çalışacak background task

async def check_overdue_installments():
    """Vadesi geçmiş ve ödenmemiş taksitleri 'overdue' olarak işaretle."""
    today = date.today()
    overdue = await db.execute(
        update(Installment)
        .where(
            Installment.due_date < today,
            Installment.status == "pending"
        )
        .values(status="overdue")
    )
    # Bildirim gönder (e-posta, push notification)
```

### Ödeme Kayıt Akışı

```
1. Muhasebe/Satış, ödeme bilgisini girer:
   - İlgili satış
   - Tutar
   - Ödeme tarihi
   - Yöntem (nakit/havale/kredi kartı/çek)
2. Sistem:
   - Ödemeyi en eski bekleyen/geciken taksite uygular
   - Taksit paid_amount güncellenir
   - Taksit tamamen ödendiyse status → "paid"
   - Kısmi ödemede status → "partial"
   - payments tablosuna kayıt eklenir
   - Satışın kalan borcu güncellenir
```

### Dashboard Finansal Özet Hesaplamaları

```sql
-- Bu ay beklenen tahsilat
SELECT SUM(amount - paid_amount) as expected
FROM installments
WHERE due_date BETWEEN '2026-04-01' AND '2026-04-30'
  AND status IN ('pending', 'partial');

-- Geciken ödemeler toplamı
SELECT SUM(amount - paid_amount) as overdue_total
FROM installments
WHERE status = 'overdue';

-- Toplam alacak
SELECT SUM(remaining_debt) as total_receivable
FROM sales
WHERE status = 'active';

-- Bu ay firma giderleri
SELECT SUM(amount - paid_amount) as payable
FROM expenses
WHERE due_date BETWEEN '2026-04-01' AND '2026-04-30'
  AND status IN ('pending', 'partial');
```

---

## 12. Dashboard ve Raporlama Yaklaşımı

### Dashboard Bileşenleri

```
┌─────────────────────────────────────────────────────────────────┐
│  STOK DURUMU (Proje Seçici)                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Toplam   │  │  Boş     │  │ Rezerve  │  │ Satılmış │       │
│  │   120    │  │   45     │  │    12    │  │    63    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  ┌───────────────────────────┐  ┌────────────────────────────┐ │
│  │ Proje Bazlı Stok Grafiği │  │ Bu Ay Finansal Özet        │ │
│  │ (Stacked Bar Chart)      │  │ Beklenen Tahsilat: 850K TL │ │
│  │                           │  │ Tahsil Edilen:     620K TL │ │
│  │  ParkEvler  ██████░░░░   │  │ Geciken:           180K TL │ │
│  │  DenizKon.  █████████░   │  │ Firma Giderleri:   340K TL │ │
│  │  YeşilVadi  ████░░░░░░  │  │                            │ │
│  └───────────────────────────┘  └────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────┐  ┌────────────────────────────┐ │
│  │ Geciken Ödemeler          │  │ CRM Özeti                  │ │
│  │ Ahmet Y. - 45,000 TL     │  │ Açık Fırsat: 28            │ │
│  │ Mehmet K. - 32,000 TL    │  │ Bu Hafta Yeni: 5           │ │
│  │ ...                       │  │ Bu Ay Kapanan: 3           │ │
│  └───────────────────────────┘  └────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────┐  ┌────────────────────────────┐ │
│  │ Yaklaşan Firma Ödemeleri  │  │ Son Aktiviteler            │ │
│  │ ABC İnşaat - 120K (15/04)│  │ 10:30 Arama - Ayşe H.     │ │
│  │ XYZ Malzeme - 85K (20/04)│  │ 09:15 Toplantı - Mehmet   │ │
│  └───────────────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Raporlama Teknik Yaklaşımı

- **Gerçek zamanlı dashboard:** API endpoint'lerinden doğrudan SQL aggregate sorguları.
- **Karmaşık raporlar:** Arka planda hesaplanıp cache'lenen (Redis) rapor sonuçları.
- **Export:** PDF (WeasyPrint) ve Excel (openpyxl) formatlarında indirme.
- **Grafik kütüphanesi:** Frontend'de Recharts (React) — bar chart, pie chart, line chart, area chart.

---

## 13. Docker Tabanlı Geliştirme ve Deployment Yapısı

### Dizin Yapısı

```
insaat-erp/
├── docker-compose.yml              # Tüm servisleri ayağa kaldır
├── docker-compose.prod.yml         # Production override
├── .env.example                    # Ortam değişkenleri şablonu
│
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml              # Python bağımlılıkları (Poetry veya pip)
│   ├── alembic/                    # DB migration'lar
│   │   ├── versions/
│   │   └── env.py
│   ├── app/
│   │   ├── main.py                 # FastAPI app entry
│   │   ├── core/
│   │   │   ├── config.py           # Ayarlar (pydantic-settings)
│   │   │   ├── security.py         # JWT, hashing
│   │   │   └── dependencies.py     # DB session, auth dependency
│   │   ├── db/
│   │   │   ├── base.py             # Base model, engine
│   │   │   └── session.py          # AsyncSession factory
│   │   ├── models/                 # SQLAlchemy modelleri
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── unit.py
│   │   │   ├── customer.py
│   │   │   ├── opportunity.py
│   │   │   ├── sale.py
│   │   │   ├── installment.py
│   │   │   ├── expense.py
│   │   │   └── document.py
│   │   ├── schemas/                # Pydantic şemaları
│   │   ├── api/                    # Route'lar
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── projects.py
│   │   │       ├── units.py
│   │   │       ├── customers.py
│   │   │       ├── sales.py
│   │   │       ├── expenses.py
│   │   │       ├── contracts.py
│   │   │       └── dashboard.py
│   │   ├── services/               # İş mantığı
│   │   └── tasks/                  # Celery / background tasks
│   └── tests/
│
├── frontend/                       # Turborepo monorepo
│   ├── turbo.json
│   ├── apps/
│   │   ├── web/                    # Next.js
│   │   └── mobile/                 # Expo React Native
│   └── packages/
│       ├── shared/                 # Ortak iş mantığı
│       ├── ui/                     # Ortak UI
│       └── tsconfig/               # Ortak TS config
│
├── nginx/
│   └── nginx.conf                  # Reverse proxy config
│
└── scripts/
    ├── init-db.sh                  # İlk veritabanı kurulumu
    └── seed-data.py                # Test verisi yükleme
```

### docker-compose.yml

```yaml
version: "3.9"

services:
  # ── Backend API ──
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://erp:erp_pass@postgres:5432/insaat_erp
      - REDIS_URL=redis://redis:6379/0
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./backend:/app            # Geliştirme: hot reload
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # ── PostgreSQL ──
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=insaat_erp
      - POSTGRES_USER=erp
      - POSTGRES_PASSWORD=erp_pass
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U erp -d insaat_erp"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ── Redis ──
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  # ── MinIO (Dosya Depolama) ──
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"           # MinIO Console

  # ── Web Frontend (geliştirme) ──
  web:
    build: ./frontend
    working_dir: /app/apps/web
    command: npm run dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    depends_on:
      - backend

  # ── Nginx (Production) ──
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
      - web
    profiles:
      - production

volumes:
  pgdata:
  minio_data:
```

### Production Deployment Notu

Production için ek katmanlar:

- **Nginx** veya **Caddy:** SSL termination, reverse proxy, static file serving.
- **Celery + Redis:** Background task'lar (gecikme kontrolü cron, PDF üretimi, e-posta gönderimi).
- **Veritabanı yedekleme:** pg_dump cron job.
- **Monitoring:** Prometheus + Grafana (opsiyonel, Faz 3).

---

## 14. MVP Kapsamı (Faz 1 — Tahmini 8–10 Hafta)

### Sprint 1–2: Temel Altyapı (2 hafta)
- Docker ortamı kurulumu.
- FastAPI boilerplate + PostgreSQL + Alembic migration altyapısı.
- Auth modülü (JWT login, register, RBAC).
- Next.js boilerplate + Expo boilerplate + Turborepo monorepo.
- Ortak API client ve tip tanımları.

### Sprint 3–4: Proje & Stok (2 hafta)
- Proje CRUD (web + mobil).
- Blok ve daire yönetimi.
- Daire durum takibi (renk kodlu matris).
- Toplu daire oluşturma.

### Sprint 5–6: CRM (2 hafta)
- Müşteri CRUD.
- Fırsat yönetimi ve kanban board (web).
- Aktivite kayıt ve geçmiş.
- Müşteri arama ve filtreleme.

### Sprint 7–8: Satış & Tahsilat (2 hafta)
- Satış kaydı oluşturma (daire + müşteri + fiyat).
- Otomatik taksit planı üretimi.
- Ödeme kayıt.
- Geciken ödeme takibi.
- Basit finansal özet.

### Sprint 9–10: Dashboard & İlk Release (2 hafta)
- Dashboard ekranları (stok özeti, finansal özet, gecikme uyarıları).
- Firma giderleri modülü (basit CRUD).
- Mobil uygulamayı Expo EAS ile Ad Hoc dağıtım.
- Test, bug fix, polish.

### MVP'de Olmayan (Faz 2+)
- Sözleşme şablonları ve PDF üretimi.
- Doküman versiyonlama.
- Gelişmiş raporlama ve export.
- Bildirim sistemi (push, e-posta).
- Gelişmiş arama (full-text search).

---

## 15. Sonraki Fazlarda Eklenebilecek Geliştirmeler

### Faz 2: Gelişmiş Özellikler (4–6 Hafta)

- **Sözleşme Motoru:** HTML şablon → Jinja2 render → WeasyPrint PDF.
- **Doküman Yönetimi:** MinIO entegrasyonu, dosya yükleme/indirme, versiyonlama.
- **Bildirim Sistemi:** Firebase Cloud Messaging (push), SMTP e-posta, gecikme hatırlatmaları.
- **Gelişmiş Raporlama:** Tarih aralığı bazlı raporlar, PDF/Excel export.
- **Aktivite Takvimi:** Takım takvimi, randevu planlama.

### Faz 3: Ölçeklendirme ve Entegrasyon (4–6 Hafta)

- **Multi-tenant:** Birden fazla firma desteği (SaaS modeline geçiş altyapısı).
- **Entegrasyonlar:** Muhasebe yazılımı API (e-fatura, e-arşiv), banka entegrasyonu.
- **Gelişmiş Analytics:** Satış dönüşüm hunisi, tahsilat tahmin modeli.
- **Offline Destek:** React Native offline-first yaklaşımı (SQLite + sync).
- **Monitoring:** Sentry (hata takibi), Prometheus + Grafana (performans).
- **CI/CD:** GitHub Actions ile otomatik test, build, deploy.

### Faz 4: İleri Seviye (Opsiyonel)

- **Dijital İmza:** e-imza entegrasyonu.
- **Chatbot / AI Asistanı:** Müşteri sorguları için doğal dil arayüzü.
- **Harita Entegrasyonu:** Proje lokasyonları, müşteri konumları.
- **App Store Yayını:** Full review süreci, public release.
- **Çoklu Dil Desteği:** i18n altyapısı (Türkçe + İngilizce + Arapça).

---

## Ek: iPhone'a App Store'suz Yükleme Seçenekleri

| Yöntem | Maliyet | Cihaz Limiti | Süre | Zorluk |
|--------|---------|--------------|------|--------|
| **Expo EAS + Ad Hoc** | Apple Developer ($99/yıl) | 100 cihaz | 1 yıl | Düşük |
| **TestFlight** | Apple Developer ($99/yıl) | 10.000 tester | 90 gün/build | Düşük |
| **Apple Enterprise Program** | $299/yıl | Sınırsız (firma içi) | 1 yıl | Orta |

**Önerim:** Başlangıçta **TestFlight** kullanın. Hem kolay hem de 10.000 teste kadar destekler. Uzun vadede firma içi kalacaksa Enterprise Program'a geçiş yapılabilir.

---

*Bu doküman, projenin tüm yaşam döngüsü boyunca referans alınabilecek bir mimari harita olarak tasarlanmıştır. Her faz tamamlandıkça güncellenmelidir.*
