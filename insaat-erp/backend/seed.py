"""
AC Grup Proje ERP — Veritabanı Seed Script
Tablolar boşsa örnek veri ekler (idempotent).
Kullanım: python seed.py
"""

import os
import uuid
from datetime import date, datetime, timezone, timedelta
from decimal import Decimal

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import Session

# DB URL — asyncpg yerine psycopg2
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://erp:erp_pass@postgres:5432/insaat_erp")
SYNC_URL = DATABASE_URL.replace("+asyncpg", "")

engine = create_engine(SYNC_URL)


def table_has_data(session, table_name: str) -> bool:
    result = session.execute(text(f"SELECT EXISTS(SELECT 1 FROM {table_name} LIMIT 1)"))
    return result.scalar()


def seed():
    with Session(engine) as session:
        # Eğer users tablosunda veri varsa seed yapma
        try:
            if table_has_data(session, "users"):
                print("✅ Veritabanında zaten veri var, seed atlanıyor.")
                return
        except Exception:
            print("⚠️ Tablolar henüz oluşturulmamış, seed atlanıyor.")
            return

        print("🌱 Seed verileri ekleniyor...")

        # ── Kullanıcılar ──
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        user1_id = uuid.uuid4()
        user2_id = uuid.uuid4()

        session.execute(text("""
            INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at)
            VALUES (:id, :email, :password_hash, :first_name, :last_name, :phone, :role, true, now(), now())
        """), {
            "id": str(user1_id), "email": "mehmet@acgrup.com",
            "password_hash": pwd_context.hash("Sifre123!"),
            "first_name": "Mehmet", "last_name": "Yılmaz",
            "phone": "0532 100 0001", "role": "sales_manager",
        })
        session.execute(text("""
            INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at)
            VALUES (:id, :email, :password_hash, :first_name, :last_name, :phone, :role, true, now(), now())
        """), {
            "id": str(user2_id), "email": "ayse@acgrup.com",
            "password_hash": pwd_context.hash("Sifre123!"),
            "first_name": "Ayşe", "last_name": "Güneş",
            "phone": "0533 100 0002", "role": "sales_agent",
        })
        print("  ✅ 2 kullanıcı eklendi")

        # ── Projeler ──
        proj1_id = uuid.uuid4()
        proj2_id = uuid.uuid4()
        proj3_id = uuid.uuid4()
        proj4_id = uuid.uuid4()

        projects = [
            {"id": str(proj1_id), "name": "Park Evler Konutları", "code": "PARK-EVLER",
             "city": "İstanbul", "district": "Başakşehir",
             "description": "Modern mimari ile tasarlanmış 3 blok, 120 daireden oluşan prestijli konut projesi.",
             "total_units": 40, "status": "active",
             "start_date": "2025-06-01", "expected_end": "2027-03-01"},
            {"id": str(proj2_id), "name": "Deniz Konakları", "code": "DENIZ-KONAK",
             "city": "İzmir", "district": "Karşıyaka",
             "description": "Deniz manzaralı, premium kalite malzemelerle inşa edilen lüks konut projesi.",
             "total_units": 60, "status": "active",
             "start_date": "2025-09-15", "expected_end": "2027-06-01"},
            {"id": str(proj3_id), "name": "Yeşil Vadi Rezidans", "code": "YESIL-VADI",
             "city": "Ankara", "district": "Çankaya",
             "description": "Yeşillikler içinde, doğayla iç içe bir yaşam sunan butik proje.",
             "total_units": 20, "status": "on_hold",
             "start_date": "2026-01-10", "expected_end": "2028-01-01"},
            {"id": str(proj4_id), "name": "Mavi Göl Evleri", "code": "MAVI-GOL",
             "city": "Bolu", "district": "Merkez",
             "description": "Göl kenarında, doğal yaşamı ön planda tutan villa ve daire karma projesi.",
             "total_units": 30, "status": "completed",
             "start_date": "2024-03-01", "expected_end": "2025-12-01"},
        ]
        for p in projects:
            session.execute(text("""
                INSERT INTO projects (id, name, code, city, district, description, total_units, status, start_date, expected_end, created_at, updated_at)
                VALUES (:id, :name, :code, :city, :district, :description, :total_units, :status, :start_date, :expected_end, now(), now())
            """), p)
        print("  ✅ 4 proje eklendi")

        # ── Bloklar ──
        block_ids = {}
        blocks = [
            {"name": "A Blok", "project_id": str(proj1_id), "total_floors": 10},
            {"name": "B Blok", "project_id": str(proj1_id), "total_floors": 8},
            {"name": "A Blok", "project_id": str(proj2_id), "total_floors": 12},
            {"name": "B Blok", "project_id": str(proj2_id), "total_floors": 6},
            {"name": "Tek Blok", "project_id": str(proj3_id), "total_floors": 5},
            {"name": "A Blok", "project_id": str(proj4_id), "total_floors": 5},
            {"name": "Villa Bölgesi", "project_id": str(proj4_id), "total_floors": 2},
        ]
        for b in blocks:
            bid = uuid.uuid4()
            block_ids[(b["project_id"], b["name"])] = bid
            session.execute(text("""
                INSERT INTO blocks (id, project_id, name, total_floors, created_at, updated_at)
                VALUES (:id, :project_id, :name, :total_floors, now(), now())
            """), {"id": str(bid), **b})
        print("  ✅ 7 blok eklendi")

        # ── Daireler (Units) ──
        unit_ids = {}
        unit_data = []
        # Park Evler A Blok — 5 kat x 4 daire
        b1_id = block_ids[(str(proj1_id), "A Blok")]
        statuses_p1 = [
            # floor 1
            ("A-1-1", "2+1", 95, 2800000, "sold"), ("A-1-2", "3+1", 130, 3500000, "sold"),
            ("A-1-3", "2+1", 95, 2800000, "reserved"), ("A-1-4", "1+1", 65, 1900000, "available"),
            # floor 2
            ("A-2-1", "2+1", 95, 2900000, "available"), ("A-2-2", "3+1", 130, 3600000, "negotiation"),
            ("A-2-3", "2+1", 95, 2900000, "sold"), ("A-2-4", "1+1", 65, 1950000, "available"),
            # floor 3
            ("A-3-1", "3+1", 130, 3700000, "sold"), ("A-3-2", "3+1", 130, 3700000, "available"),
            ("A-3-3", "2+1", 95, 3000000, "reserved"), ("A-3-4", "1+1", 65, 2050000, "negotiation"),
            # floor 4
            ("A-4-1", "2+1", 95, 3100000, "available"), ("A-4-2", "3+1", 130, 3800000, "available"),
            ("A-4-3", "2+1", 95, 3100000, "sold"), ("A-4-4", "1+1", 65, 2100000, "available"),
            # floor 5
            ("A-5-1", "3+1", 145, 4200000, "available"), ("A-5-2", "4+1", 180, 5500000, "reserved"),
            ("A-5-3", "3+1", 145, 4200000, "sold"), ("A-5-4", "2+1", 110, 3300000, "available"),
        ]
        for i, (unum, rtype, area, price, st) in enumerate(statuses_p1):
            uid = uuid.uuid4()
            floor = int(unum.split("-")[1])
            unit_ids[unum] = uid
            session.execute(text("""
                INSERT INTO units (id, project_id, block_id, floor_number, unit_number, room_type,
                    gross_area_m2, net_area_m2, list_price, status, has_balcony, has_parking, created_at, updated_at)
                VALUES (:id, :project_id, :block_id, :floor_number, :unit_number, :room_type,
                    :gross_area_m2, :net_area_m2, :list_price, :status, :has_balcony, :has_parking, now(), now())
            """), {
                "id": str(uid), "project_id": str(proj1_id), "block_id": str(b1_id),
                "floor_number": floor, "unit_number": unum, "room_type": rtype,
                "gross_area_m2": area, "net_area_m2": int(area * 0.8),
                "list_price": price, "status": st,
                "has_balcony": floor >= 3, "has_parking": floor >= 4,
            })

        # Deniz Konakları — 4 daire
        b3_id = block_ids[(str(proj2_id), "A Blok")]
        dk_units = [
            ("DK-1-1", "2+1", 90, 2700000, "sold"), ("DK-1-2", "3+1", 125, 3400000, "available"),
            ("DK-2-1", "2+1", 90, 2800000, "reserved"), ("DK-2-2", "4+1", 170, 5200000, "negotiation"),
        ]
        for unum, rtype, area, price, st in dk_units:
            uid = uuid.uuid4()
            floor = int(unum.split("-")[1])
            unit_ids[unum] = uid
            session.execute(text("""
                INSERT INTO units (id, project_id, block_id, floor_number, unit_number, room_type,
                    gross_area_m2, net_area_m2, list_price, status, has_balcony, has_parking, created_at, updated_at)
                VALUES (:id, :project_id, :block_id, :floor_number, :unit_number, :room_type,
                    :gross_area_m2, :net_area_m2, :list_price, :status, false, false, now(), now())
            """), {
                "id": str(uid), "project_id": str(proj2_id), "block_id": str(b3_id),
                "floor_number": floor, "unit_number": unum, "room_type": rtype,
                "gross_area_m2": area, "net_area_m2": int(area * 0.8),
                "list_price": price, "status": st,
            })

        print(f"  ✅ {len(statuses_p1) + len(dk_units)} daire eklendi")

        # ── Müşteriler ──
        cust_ids = {}
        customers = [
            {"key": "ahmet", "first_name": "Ahmet", "last_name": "Kaya", "phone": "0532 111 2233",
             "email": "ahmet.kaya@email.com", "source": "web", "assigned_to": str(user1_id),
             "notes": "Park Evler projesine ilgili.", "tc_kimlik_no": "12345678901"},
            {"key": "fatma", "first_name": "Fatma", "last_name": "Demir", "phone": "0533 222 4455",
             "email": "fatma.demir@email.com", "source": "referral", "assigned_to": str(user2_id),
             "notes": "3+1 daire arıyor, bütçe 3.5M civarı.", "tc_kimlik_no": None},
            {"key": "ali", "first_name": "Ali", "last_name": "Şahin", "phone": "0535 333 6677",
             "email": "ali.sahin@email.com", "source": "walk_in", "assigned_to": str(user1_id),
             "notes": "Yatırım amaçlı, birden fazla daire alabilir.", "tc_kimlik_no": "98765432109"},
            {"key": "zeynep", "first_name": "Zeynep", "last_name": "Arslan", "phone": "0536 444 8899",
             "email": None, "source": "phone", "assigned_to": str(user2_id),
             "notes": "Deniz Konakları için randevu alındı.", "tc_kimlik_no": None},
            {"key": "murat", "first_name": "Murat", "last_name": "Özkan", "phone": "0537 555 0011",
             "email": "murat.ozkan@email.com", "source": "ad", "assigned_to": str(user1_id),
             "notes": "Instagram reklamdan geldi, 2+1 arıyor.", "tc_kimlik_no": None},
            {"key": "elif", "first_name": "Elif", "last_name": "Yıldız", "phone": "0538 666 2233",
             "email": "elif.yildiz@email.com", "source": "web", "assigned_to": str(user2_id),
             "notes": "Yeşil Vadi projesiyle ilgileniyor.", "tc_kimlik_no": "55566677788"},
        ]
        for c in customers:
            cid = uuid.uuid4()
            cust_ids[c["key"]] = cid
            session.execute(text("""
                INSERT INTO customers (id, first_name, last_name, phone, email, source, assigned_to, notes, tc_kimlik_no, created_at, updated_at)
                VALUES (:id, :first_name, :last_name, :phone, :email, :source, :assigned_to, :notes, :tc_kimlik_no, now(), now())
            """), {"id": str(cid), "first_name": c["first_name"], "last_name": c["last_name"],
                   "phone": c["phone"], "email": c["email"], "source": c["source"],
                   "assigned_to": c["assigned_to"], "notes": c["notes"], "tc_kimlik_no": c["tc_kimlik_no"]})
        print("  ✅ 6 müşteri eklendi")

        # ── Fırsatlar (Opportunities) ──
        opportunities = [
            {"customer": "ahmet", "project_id": str(proj1_id), "unit_id": None,
             "offered_price": 3500000, "status": "proposal_sent", "priority": "high",
             "expected_close": "2026-05-01", "assigned_to": str(user1_id)},
            {"customer": "fatma", "project_id": str(proj2_id), "unit_id": None,
             "offered_price": 2900000, "status": "contacted", "priority": "medium",
             "expected_close": "2026-05-15", "assigned_to": str(user2_id)},
            {"customer": "ali", "project_id": str(proj1_id), "unit_id": str(unit_ids.get("A-4-1", uuid.uuid4())),
             "offered_price": 3000000, "status": "proposal_sent", "priority": "high",
             "expected_close": "2026-04-20", "assigned_to": str(user1_id)},
            {"customer": "zeynep", "project_id": str(proj2_id), "unit_id": None,
             "offered_price": None, "status": "contacted", "priority": "low",
             "expected_close": "2026-06-01", "assigned_to": str(user2_id)},
            {"customer": "ali", "project_id": str(proj2_id), "unit_id": str(unit_ids.get("DK-2-2", uuid.uuid4())),
             "offered_price": 5200000, "status": "negotiation", "priority": "high",
             "expected_close": "2026-04-25", "assigned_to": str(user1_id)},
            {"customer": "murat", "project_id": str(proj1_id), "unit_id": str(unit_ids.get("A-2-1", uuid.uuid4())),
             "offered_price": 2800000, "status": "new", "priority": "medium",
             "expected_close": "2026-06-15", "assigned_to": str(user1_id)},
            {"customer": "elif", "project_id": str(proj3_id), "unit_id": None,
             "offered_price": None, "status": "new", "priority": "low",
             "expected_close": "2026-07-01", "assigned_to": str(user2_id)},
            {"customer": "ahmet", "project_id": str(proj2_id), "unit_id": None,
             "offered_price": 4100000, "status": "won", "priority": "high",
             "expected_close": "2026-03-15", "assigned_to": str(user1_id)},
        ]
        for o in opportunities:
            oid = uuid.uuid4()
            session.execute(text("""
                INSERT INTO opportunities (id, customer_id, project_id, unit_id, offered_price, status, priority, expected_close, assigned_to, created_at, updated_at)
                VALUES (:id, :customer_id, :project_id, :unit_id, :offered_price, :status, :priority, :expected_close, :assigned_to, now(), now())
            """), {
                "id": str(oid), "customer_id": str(cust_ids[o["customer"]]),
                "project_id": o["project_id"], "unit_id": o["unit_id"],
                "offered_price": o["offered_price"], "status": o["status"],
                "priority": o["priority"], "expected_close": o["expected_close"],
                "assigned_to": o["assigned_to"],
            })
        print("  ✅ 8 fırsat eklendi")

        # ── Aktiviteler ──
        activities = [
            {"customer": "ali", "user_id": str(user1_id), "type": "meeting",
             "subject": "Saha ziyareti — Park Evler",
             "description": "Müşteri ile birlikte A Blok 4. kat gezildi. 2+1 dairelerle ilgilendi.",
             "date": "2026-04-10T14:30:00+00:00"},
            {"customer": "fatma", "user_id": str(user2_id), "type": "call",
             "subject": "Fiyat bilgilendirme",
             "description": "Deniz Konakları B-5-1 fiyat ve ödeme planı aktarıldı.",
             "date": "2026-04-10T10:15:00+00:00"},
            {"customer": "ahmet", "user_id": str(user1_id), "type": "email",
             "subject": "Teklif gönderildi",
             "description": "Deniz Konakları A-10-1 için resmi teklif e-posta ile gönderildi.",
             "date": "2026-04-09T16:00:00+00:00"},
            {"customer": "zeynep", "user_id": str(user2_id), "type": "call",
             "subject": "İlk iletişim",
             "description": "Müşteri arandı. Deniz Konakları hakkında bilgi verildi, randevu planlandı.",
             "date": "2026-04-09T11:30:00+00:00"},
            {"customer": "ali", "user_id": str(user1_id), "type": "note",
             "subject": "Müşteri notu",
             "description": "Müşteri yatırım amaçlı 2-3 daire almayı düşünüyor. Özel indirim talep ediyor.",
             "date": "2026-04-08T09:00:00+00:00"},
        ]
        for a in activities:
            session.execute(text("""
                INSERT INTO activities (id, customer_id, user_id, activity_type, subject, description, activity_date, created_at, updated_at)
                VALUES (:id, :customer_id, :user_id, :activity_type, :subject, :description, :activity_date, now(), now())
            """), {
                "id": str(uuid.uuid4()), "customer_id": str(cust_ids[a["customer"]]),
                "user_id": a["user_id"], "activity_type": a["type"],
                "subject": a["subject"], "description": a["description"],
                "activity_date": a["date"],
            })
        print("  ✅ 5 aktivite eklendi")

        # ── Tedarikçiler ──
        sup_ids = {}
        suppliers = [
            {"key": "abc", "name": "ABC İnşaat Malzemeleri", "contact_person": "Hasan Çelik",
             "phone": "0532 100 2000", "category": "malzeme"},
            {"key": "xyz", "name": "XYZ Demir Çelik A.Ş.", "contact_person": "Yusuf Demir",
             "phone": "0533 200 3000", "category": "malzeme"},
            {"key": "dogan", "name": "Doğan Taşeronluk", "contact_person": "Eren Doğan",
             "phone": "0535 300 4000", "category": "taseron"},
            {"key": "anadolu", "name": "Anadolu Elektrik Ltd.", "contact_person": "Kemal Anadolu",
             "phone": "0536 400 5000", "category": "taseron"},
            {"key": "mega", "name": "Mega Boya Kimya", "contact_person": "Selim Mega",
             "phone": "0537 500 6000", "category": "malzeme"},
        ]
        for s in suppliers:
            sid = uuid.uuid4()
            sup_ids[s["key"]] = sid
            session.execute(text("""
                INSERT INTO suppliers (id, name, contact_person, phone, category, created_at, updated_at)
                VALUES (:id, :name, :contact_person, :phone, :category, now(), now())
            """), {"id": str(sid), "name": s["name"], "contact_person": s["contact_person"],
                   "phone": s["phone"], "category": s["category"]})
        print("  ✅ 5 tedarikçi eklendi")

        # ── Giderler ──
        expenses = [
            {"supplier": "abc", "project_id": str(proj1_id), "category": "malzeme",
             "description": "Çimento alımı — 200 ton", "amount": 450000,
             "due_date": "2026-04-15", "paid_amount": 0, "status": "pending", "invoice_no": "FTR-2026-0401"},
            {"supplier": "xyz", "project_id": str(proj1_id), "category": "malzeme",
             "description": "Demir donatı çelik", "amount": 680000,
             "due_date": "2026-04-20", "paid_amount": 0, "status": "pending", "invoice_no": "FTR-2026-0385"},
            {"supplier": "dogan", "project_id": str(proj2_id), "category": "iscilik",
             "description": "Nisan ayı hakedişi — Kaba inşaat", "amount": 320000,
             "due_date": "2026-04-30", "paid_amount": 0, "status": "pending", "invoice_no": "HAK-2026-04"},
            {"supplier": "anadolu", "project_id": str(proj1_id), "category": "taseron",
             "description": "Elektrik tesisatı — A Blok 3-5. katlar", "amount": 85000,
             "due_date": "2026-03-25", "paid_amount": 85000, "status": "paid", "invoice_no": "FTR-2026-0310"},
            {"supplier": "abc", "project_id": str(proj2_id), "category": "malzeme",
             "description": "Tuğla ve yapı malzemesi", "amount": 195000,
             "due_date": "2026-03-10", "paid_amount": 100000, "status": "partial", "invoice_no": "FTR-2026-0280"},
            {"supplier": None, "project_id": None, "category": "kira",
             "description": "Ofis kirası — Nisan 2026", "amount": 45000,
             "due_date": "2026-04-01", "paid_amount": 45000, "status": "paid", "invoice_no": None},
            {"supplier": None, "project_id": None, "category": "vergi",
             "description": "KDV ödemesi — Q1 2026", "amount": 230000,
             "due_date": "2026-04-25", "paid_amount": 0, "status": "pending", "invoice_no": None},
            {"supplier": "mega", "project_id": str(proj1_id), "category": "malzeme",
             "description": "İç cephe boya ve astar", "amount": 120000,
             "due_date": "2026-03-01", "paid_amount": 0, "status": "overdue", "invoice_no": "FTR-2026-0250"},
        ]
        for e in expenses:
            session.execute(text("""
                INSERT INTO expenses (id, supplier_id, project_id, category, description, amount,
                    due_date, paid_amount, status, invoice_no, created_by, created_at, updated_at)
                VALUES (:id, :supplier_id, :project_id, :category, :description, :amount,
                    :due_date, :paid_amount, :status, :invoice_no, :created_by, now(), now())
            """), {
                "id": str(uuid.uuid4()),
                "supplier_id": str(sup_ids[e["supplier"]]) if e["supplier"] else None,
                "project_id": e["project_id"],
                "category": e["category"], "description": e["description"],
                "amount": e["amount"], "due_date": e["due_date"],
                "paid_amount": e["paid_amount"], "status": e["status"],
                "invoice_no": e["invoice_no"], "created_by": str(user1_id),
            })
        print("  ✅ 8 gider eklendi")

        # ── Satışlar ──
        sale1_id = uuid.uuid4()
        sale2_id = uuid.uuid4()
        sale3_id = uuid.uuid4()
        sale4_id = uuid.uuid4()

        sales_data = [
            {"id": str(sale1_id), "unit_key": "A-3-1", "customer": "ahmet",
             "sale_date": "2026-01-20", "sale_price": 3500000, "down_payment": 700000,
             "remaining_debt": 2800000, "installment_count": 24, "status": "active",
             "payment_start_date": "2026-02-15"},
            {"id": str(sale2_id), "unit_key": "DK-1-1", "customer": "fatma",
             "sale_date": "2025-11-10", "sale_price": 2900000, "down_payment": 580000,
             "remaining_debt": 2320000, "installment_count": 36, "status": "active",
             "payment_start_date": "2025-12-15"},
            {"id": str(sale3_id), "unit_key": "A-4-3", "customer": "ali",
             "sale_date": "2026-02-05", "sale_price": 3700000, "down_payment": 1850000,
             "remaining_debt": 1850000, "installment_count": 12, "status": "active",
             "payment_start_date": "2026-03-05"},
            {"id": str(sale4_id), "unit_key": "A-1-1", "customer": "elif",
             "sale_date": "2025-05-20", "sale_price": 1800000, "down_payment": 1800000,
             "remaining_debt": 0, "installment_count": 0, "status": "completed",
             "payment_start_date": None},
        ]
        for s in sales_data:
            session.execute(text("""
                INSERT INTO sales (id, unit_id, customer_id, sale_date, sale_price, down_payment,
                    remaining_debt, installment_count, payment_start_date, status, created_by, created_at, updated_at)
                VALUES (:id, :unit_id, :customer_id, :sale_date, :sale_price, :down_payment,
                    :remaining_debt, :installment_count, :payment_start_date, :status, :created_by, now(), now())
            """), {
                "id": s["id"],
                "unit_id": str(unit_ids[s["unit_key"]]),
                "customer_id": str(cust_ids[s["customer"]]),
                "sale_date": s["sale_date"], "sale_price": s["sale_price"],
                "down_payment": s["down_payment"], "remaining_debt": s["remaining_debt"],
                "installment_count": s["installment_count"],
                "payment_start_date": s["payment_start_date"],
                "status": s["status"], "created_by": str(user1_id),
            })
        print("  ✅ 4 satış eklendi")

        # ── Taksitler ──
        # Sale 1 — Ahmet Kaya — 6 taksit göster
        installments_s1 = [
            {"no": 1, "due_date": "2026-02-15", "amount": 116667, "paid_amount": 116667, "status": "paid"},
            {"no": 2, "due_date": "2026-03-15", "amount": 116667, "paid_amount": 116667, "status": "paid"},
            {"no": 3, "due_date": "2026-04-15", "amount": 116667, "paid_amount": 45000, "status": "partial"},
            {"no": 4, "due_date": "2026-05-15", "amount": 116667, "paid_amount": 0, "status": "pending"},
            {"no": 5, "due_date": "2026-06-15", "amount": 116667, "paid_amount": 0, "status": "pending"},
            {"no": 6, "due_date": "2026-07-15", "amount": 116667, "paid_amount": 0, "status": "pending"},
        ]
        inst_ids = {}
        for inst in installments_s1:
            iid = uuid.uuid4()
            inst_ids[(str(sale1_id), inst["no"])] = iid
            session.execute(text("""
                INSERT INTO installments (id, sale_id, installment_no, due_date, amount, paid_amount, status, created_at, updated_at)
                VALUES (:id, :sale_id, :installment_no, :due_date, :amount, :paid_amount, :status, now(), now())
            """), {"id": str(iid), "sale_id": str(sale1_id), "installment_no": inst["no"],
                   "due_date": inst["due_date"], "amount": inst["amount"],
                   "paid_amount": inst["paid_amount"], "status": inst["status"]})

        # Sale 2 — Fatma Demir — 5 taksit
        installments_s2 = [
            {"no": 1, "due_date": "2025-12-15", "amount": 64444, "paid_amount": 64444, "status": "paid"},
            {"no": 2, "due_date": "2026-01-15", "amount": 64444, "paid_amount": 64444, "status": "paid"},
            {"no": 3, "due_date": "2026-02-15", "amount": 64444, "paid_amount": 64444, "status": "paid"},
            {"no": 4, "due_date": "2026-03-01", "amount": 64444, "paid_amount": 0, "status": "overdue"},
            {"no": 5, "due_date": "2026-04-15", "amount": 64444, "paid_amount": 0, "status": "pending"},
        ]
        for inst in installments_s2:
            iid = uuid.uuid4()
            session.execute(text("""
                INSERT INTO installments (id, sale_id, installment_no, due_date, amount, paid_amount, status, created_at, updated_at)
                VALUES (:id, :sale_id, :installment_no, :due_date, :amount, :paid_amount, :status, now(), now())
            """), {"id": str(iid), "sale_id": str(sale2_id), "installment_no": inst["no"],
                   "due_date": inst["due_date"], "amount": inst["amount"],
                   "paid_amount": inst["paid_amount"], "status": inst["status"]})

        # Sale 3 — Ali Şahin — 3 taksit
        installments_s3 = [
            {"no": 1, "due_date": "2026-03-05", "amount": 154167, "paid_amount": 0, "status": "overdue"},
            {"no": 2, "due_date": "2026-04-05", "amount": 154167, "paid_amount": 0, "status": "pending"},
            {"no": 3, "due_date": "2026-05-05", "amount": 154167, "paid_amount": 0, "status": "pending"},
        ]
        for inst in installments_s3:
            iid = uuid.uuid4()
            session.execute(text("""
                INSERT INTO installments (id, sale_id, installment_no, due_date, amount, paid_amount, status, created_at, updated_at)
                VALUES (:id, :sale_id, :installment_no, :due_date, :amount, :paid_amount, :status, now(), now())
            """), {"id": str(iid), "sale_id": str(sale3_id), "installment_no": inst["no"],
                   "due_date": inst["due_date"], "amount": inst["amount"],
                   "paid_amount": inst["paid_amount"], "status": inst["status"]})
        print(f"  ✅ {len(installments_s1) + len(installments_s2) + len(installments_s3)} taksit eklendi")

        # ── Ödemeler ──
        payments = [
            # Sale 1 — Ahmet
            {"sale_id": str(sale1_id), "amount": 700000, "date": "2026-01-20", "method": "bank_transfer", "ref": "HAV-001"},
            {"sale_id": str(sale1_id), "amount": 116667, "date": "2026-02-15", "method": "bank_transfer", "ref": "HAV-002"},
            {"sale_id": str(sale1_id), "amount": 116667, "date": "2026-03-15", "method": "cash", "ref": "NAK-001"},
            {"sale_id": str(sale1_id), "amount": 45000, "date": "2026-04-05", "method": "bank_transfer", "ref": "HAV-003"},
            # Sale 2 — Fatma
            {"sale_id": str(sale2_id), "amount": 580000, "date": "2025-11-10", "method": "bank_transfer", "ref": "HAV-010"},
            {"sale_id": str(sale2_id), "amount": 64444, "date": "2025-12-15", "method": "bank_transfer", "ref": "HAV-011"},
            {"sale_id": str(sale2_id), "amount": 64444, "date": "2026-01-16", "method": "cash", "ref": "NAK-004"},
            {"sale_id": str(sale2_id), "amount": 64444, "date": "2026-02-15", "method": "credit_card", "ref": "KK-001"},
            # Sale 3 — Ali
            {"sale_id": str(sale3_id), "amount": 1850000, "date": "2026-02-05", "method": "bank_transfer", "ref": "HAV-020"},
            # Sale 4 — Elif (peşin)
            {"sale_id": str(sale4_id), "amount": 1800000, "date": "2025-05-20", "method": "bank_transfer", "ref": "HAV-050"},
        ]
        for p in payments:
            session.execute(text("""
                INSERT INTO payments (id, sale_id, amount, payment_date, payment_method, reference_no, recorded_by, created_at, updated_at)
                VALUES (:id, :sale_id, :amount, :payment_date, :payment_method, :reference_no, :recorded_by, now(), now())
            """), {
                "id": str(uuid.uuid4()), "sale_id": p["sale_id"],
                "amount": p["amount"], "payment_date": p["date"],
                "payment_method": p["method"], "reference_no": p["ref"],
                "recorded_by": str(user1_id),
            })
        print(f"  ✅ {len(payments)} ödeme eklendi")

        session.commit()
        print("\n🎉 Seed tamamlandı!")


if __name__ == "__main__":
    seed()
