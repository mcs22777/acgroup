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

        projects = [
            {"id": str(proj1_id), "name": "AC Towers", "code": "AC-TOWERS",
             "city": "İstanbul", "district": "Ataşehir",
             "description": "Ataşehir merkezde 2 bloktan oluşan modern konut projesi. Sosyal tesisleri ve kapalı otoparkı ile konforlu bir yaşam sunuyor.",
             "total_units": 0, "status": "active",
             "start_date": "2025-09-01", "expected_end": "2027-06-01"},
            {"id": str(proj2_id), "name": "AC Garden", "code": "AC-GARDEN",
             "city": "Antalya", "district": "Konyaaltı",
             "description": "Konyaaltı sahiline yürüme mesafesinde, bahçeli ve havuzlu rezidans projesi.",
             "total_units": 0, "status": "active",
             "start_date": "2026-01-15", "expected_end": "2028-01-01"},
            {"id": str(proj3_id), "name": "AC Plaza", "code": "AC-PLAZA",
             "city": "Ankara", "district": "Çankaya",
             "description": "Çankaya'da karma kullanımlı proje. Alt katlar ticari, üst katlar konut.",
             "total_units": 0, "status": "on_hold",
             "start_date": "2026-06-01", "expected_end": "2028-12-01"},
        ]
        for p in projects:
            session.execute(text("""
                INSERT INTO projects (id, name, code, city, district, description, total_units, status, start_date, expected_end, created_at, updated_at)
                VALUES (:id, :name, :code, :city, :district, :description, :total_units, :status, :start_date, :expected_end, now(), now())
            """), p)
        print("  ✅ 3 proje eklendi")

        # ── Bloklar ──
        block_ids = {}
        blocks = [
            # AC Towers — 2 blok
            {"name": "A Blok", "project_id": str(proj1_id), "total_floors": 8},
            {"name": "B Blok", "project_id": str(proj1_id), "total_floors": 6},
            # AC Garden — 3 blok
            {"name": "Palmiye Blok", "project_id": str(proj2_id), "total_floors": 5},
            {"name": "Zeytin Blok", "project_id": str(proj2_id), "total_floors": 5},
            {"name": "Çınar Blok", "project_id": str(proj2_id), "total_floors": 4},
            # AC Plaza — 1 blok
            {"name": "Ana Bina", "project_id": str(proj3_id), "total_floors": 12},
        ]
        for b in blocks:
            bid = uuid.uuid4()
            block_ids[(b["project_id"], b["name"])] = bid
            session.execute(text("""
                INSERT INTO blocks (id, project_id, name, total_floors, created_at, updated_at)
                VALUES (:id, :project_id, :name, :total_floors, now(), now())
            """), {"id": str(bid), **b})
        print(f"  ✅ {len(blocks)} blok eklendi")

        # ── Daireler ──
        unit_ids = {}
        unit_count = 0

        # AC Towers A Blok — 4 kat x 3 daire
        a_blok = block_ids[(str(proj1_id), "A Blok")]
        towers_a = [
            # Kat 1
            (1, "A-101", "2+1", 95, 78, 3200000, "sold", True, False, "Güney"),
            (1, "A-102", "3+1", 130, 108, 4100000, "sold", True, True, "Güney-Batı"),
            (1, "A-103", "2+1", 95, 78, 3100000, "available", False, False, "Kuzey"),
            # Kat 2
            (2, "A-201", "2+1", 95, 78, 3350000, "reserved", True, False, "Güney"),
            (2, "A-202", "3+1", 130, 108, 4300000, "negotiation", True, True, "Güney-Batı"),
            (2, "A-203", "2+1", 95, 78, 3250000, "available", False, False, "Kuzey"),
            # Kat 3
            (3, "A-301", "3+1", 140, 115, 4800000, "sold", True, True, "Güney"),
            (3, "A-302", "4+1", 180, 150, 6200000, "available", True, True, "Güney-Batı"),
            (3, "A-303", "2+1", 100, 82, 3600000, "available", True, False, "Kuzey"),
            # Kat 4
            (4, "A-401", "3+1", 140, 115, 5000000, "reserved", True, True, "Güney"),
            (4, "A-402", "4+1", 180, 150, 6500000, "negotiation", True, True, "Güney-Batı"),
            (4, "A-403", "3+1", 140, 115, 4900000, "available", True, True, "Kuzey"),
        ]
        for fl, unum, rtype, gross, net, price, st, balcony, parking, direction in towers_a:
            uid = uuid.uuid4()
            unit_ids[unum] = uid
            session.execute(text("""
                INSERT INTO units (id, project_id, block_id, floor_number, unit_number, room_type,
                    gross_area_m2, net_area_m2, list_price, status, has_balcony, has_parking, direction, created_at, updated_at)
                VALUES (:id, :project_id, :block_id, :floor_number, :unit_number, :room_type,
                    :gross_area_m2, :net_area_m2, :list_price, :status, :has_balcony, :has_parking, :direction, now(), now())
            """), {
                "id": str(uid), "project_id": str(proj1_id), "block_id": str(a_blok),
                "floor_number": fl, "unit_number": unum, "room_type": rtype,
                "gross_area_m2": gross, "net_area_m2": net,
                "list_price": price, "status": st,
                "has_balcony": balcony, "has_parking": parking, "direction": direction,
            })
            unit_count += 1

        # AC Towers B Blok — 3 kat x 2 daire
        b_blok = block_ids[(str(proj1_id), "B Blok")]
        towers_b = [
            (1, "B-101", "1+1", 65, 52, 2100000, "sold", False, False, "Doğu"),
            (1, "B-102", "2+1", 90, 73, 2900000, "available", True, False, "Batı"),
            (2, "B-201", "1+1", 65, 52, 2200000, "available", False, False, "Doğu"),
            (2, "B-202", "2+1", 90, 73, 3000000, "reserved", True, False, "Batı"),
            (3, "B-301", "2+1", 95, 78, 3200000, "available", True, True, "Doğu"),
            (3, "B-302", "3+1", 125, 103, 4000000, "available", True, True, "Batı"),
        ]
        for fl, unum, rtype, gross, net, price, st, balcony, parking, direction in towers_b:
            uid = uuid.uuid4()
            unit_ids[unum] = uid
            session.execute(text("""
                INSERT INTO units (id, project_id, block_id, floor_number, unit_number, room_type,
                    gross_area_m2, net_area_m2, list_price, status, has_balcony, has_parking, direction, created_at, updated_at)
                VALUES (:id, :project_id, :block_id, :floor_number, :unit_number, :room_type,
                    :gross_area_m2, :net_area_m2, :list_price, :status, :has_balcony, :has_parking, :direction, now(), now())
            """), {
                "id": str(uid), "project_id": str(proj1_id), "block_id": str(b_blok),
                "floor_number": fl, "unit_number": unum, "room_type": rtype,
                "gross_area_m2": gross, "net_area_m2": net,
                "list_price": price, "status": st,
                "has_balcony": balcony, "has_parking": parking, "direction": direction,
            })
            unit_count += 1

        # AC Garden Palmiye Blok — 3 kat x 2 daire
        palmiye = block_ids[(str(proj2_id), "Palmiye Blok")]
        garden_p = [
            (1, "P-101", "2+1", 100, 82, 2800000, "sold", True, True, "Güney"),
            (1, "P-102", "3+1", 135, 112, 3500000, "available", True, True, "Güney-Batı"),
            (2, "P-201", "2+1", 100, 82, 2900000, "negotiation", True, True, "Güney"),
            (2, "P-202", "3+1", 135, 112, 3600000, "available", True, True, "Güney-Batı"),
            (3, "P-301", "3+1", 145, 120, 4100000, "available", True, True, "Güney"),
            (3, "P-302", "4+1", 175, 145, 5200000, "reserved", True, True, "Güney-Batı"),
        ]
        for fl, unum, rtype, gross, net, price, st, balcony, parking, direction in garden_p:
            uid = uuid.uuid4()
            unit_ids[unum] = uid
            session.execute(text("""
                INSERT INTO units (id, project_id, block_id, floor_number, unit_number, room_type,
                    gross_area_m2, net_area_m2, list_price, status, has_balcony, has_parking, direction, created_at, updated_at)
                VALUES (:id, :project_id, :block_id, :floor_number, :unit_number, :room_type,
                    :gross_area_m2, :net_area_m2, :list_price, :status, :has_balcony, :has_parking, :direction, now(), now())
            """), {
                "id": str(uid), "project_id": str(proj2_id), "block_id": str(palmiye),
                "floor_number": fl, "unit_number": unum, "room_type": rtype,
                "gross_area_m2": gross, "net_area_m2": net,
                "list_price": price, "status": st,
                "has_balcony": balcony, "has_parking": parking, "direction": direction,
            })
            unit_count += 1

        print(f"  ✅ {unit_count} daire eklendi")

        # ── Müşteriler ──
        cust_ids = {}
        customers = [
            {"key": "kemal", "first_name": "Kemal", "last_name": "Aydın", "phone": "0532 210 4455",
             "email": "kemal.aydin@email.com", "source": "web", "assigned_to": str(user1_id),
             "notes": "AC Towers A Blok ile ilgileniyor. Yatırım amaçlı.", "tc_kimlik_no": "10203040506",
             "address": "Kadıköy, İstanbul"},
            {"key": "selin", "first_name": "Selin", "last_name": "Korkmaz", "phone": "0533 320 5566",
             "email": "selin.korkmaz@email.com", "source": "referral", "assigned_to": str(user2_id),
             "notes": "3+1 daire arıyor, Antalya'ya taşınmayı düşünüyor.", "tc_kimlik_no": None,
             "address": "Beşiktaş, İstanbul"},
            {"key": "burak", "first_name": "Burak", "last_name": "Erdoğan", "phone": "0535 430 6677",
             "email": "burak.erdogan@email.com", "source": "walk_in", "assigned_to": str(user1_id),
             "notes": "Ailesi için geniş daire bakıyor, 4+1 tercih.", "tc_kimlik_no": "60708090123",
             "address": None},
            {"key": "derya", "first_name": "Derya", "last_name": "Çetin", "phone": "0536 540 7788",
             "email": None, "source": "phone", "assigned_to": str(user2_id),
             "notes": "Yazlık ev için AC Garden'a ilgi duyuyor.", "tc_kimlik_no": None,
             "address": "Çankaya, Ankara"},
            {"key": "emre", "first_name": "Emre", "last_name": "Özdemir", "phone": "0537 650 8899",
             "email": "emre.ozdemir@email.com", "source": "ad", "assigned_to": str(user1_id),
             "notes": "Google reklamdan geldi, küçük daire arıyor.", "tc_kimlik_no": None,
             "address": None},
        ]
        for c in customers:
            cid = uuid.uuid4()
            cust_ids[c["key"]] = cid
            session.execute(text("""
                INSERT INTO customers (id, first_name, last_name, phone, email, source, assigned_to, notes, tc_kimlik_no, address, created_at, updated_at)
                VALUES (:id, :first_name, :last_name, :phone, :email, :source, :assigned_to, :notes, :tc_kimlik_no, :address, now(), now())
            """), {"id": str(cid), "first_name": c["first_name"], "last_name": c["last_name"],
                   "phone": c["phone"], "email": c["email"], "source": c["source"],
                   "assigned_to": c["assigned_to"], "notes": c["notes"],
                   "tc_kimlik_no": c["tc_kimlik_no"], "address": c["address"]})
        print(f"  ✅ {len(customers)} müşteri eklendi")

        # ── Fırsatlar ──
        opportunities = [
            {"customer": "kemal", "project_id": str(proj1_id), "unit_id": str(unit_ids["A-302"]),
             "offered_price": 6000000, "status": "negotiation", "priority": "high",
             "expected_close": "2026-05-10", "assigned_to": str(user1_id),
             "notes": "Fiyat indirimi talep ediyor, 5.8M'ye düşersek anlaşabiliriz."},
            {"customer": "selin", "project_id": str(proj2_id), "unit_id": str(unit_ids["P-202"]),
             "offered_price": 3400000, "status": "proposal_sent", "priority": "medium",
             "expected_close": "2026-06-01", "assigned_to": str(user2_id),
             "notes": "Teklif gönderildi, hafta sonu saha ziyaretine gelecek."},
            {"customer": "burak", "project_id": str(proj1_id), "unit_id": str(unit_ids["A-402"]),
             "offered_price": 6300000, "status": "proposal_sent", "priority": "high",
             "expected_close": "2026-05-20", "assigned_to": str(user1_id),
             "notes": "4+1 penthouse istedi, A-402'yi çok beğendi."},
            {"customer": "derya", "project_id": str(proj2_id), "unit_id": None,
             "offered_price": None, "status": "contacted", "priority": "low",
             "expected_close": "2026-07-01", "assigned_to": str(user2_id),
             "notes": "İlk telefon görüşmesi yapıldı, henüz daire bakmadı."},
            {"customer": "emre", "project_id": str(proj1_id), "unit_id": str(unit_ids["B-201"]),
             "offered_price": 2100000, "status": "new", "priority": "medium",
             "expected_close": "2026-06-15", "assigned_to": str(user1_id),
             "notes": None},
            {"customer": "kemal", "project_id": str(proj1_id), "unit_id": str(unit_ids["A-101"]),
             "offered_price": 3200000, "status": "won", "priority": "high",
             "expected_close": "2026-02-01", "assigned_to": str(user1_id),
             "notes": "Satış tamamlandı."},
        ]
        for o in opportunities:
            session.execute(text("""
                INSERT INTO opportunities (id, customer_id, project_id, unit_id, offered_price, status, priority, expected_close, assigned_to, notes, created_at, updated_at)
                VALUES (:id, :customer_id, :project_id, :unit_id, :offered_price, :status, :priority, :expected_close, :assigned_to, :notes, now(), now())
            """), {
                "id": str(uuid.uuid4()), "customer_id": str(cust_ids[o["customer"]]),
                "project_id": o["project_id"], "unit_id": o["unit_id"],
                "offered_price": o["offered_price"], "status": o["status"],
                "priority": o["priority"], "expected_close": o["expected_close"],
                "assigned_to": o["assigned_to"], "notes": o["notes"],
            })
        print(f"  ✅ {len(opportunities)} fırsat eklendi")

        # ── Aktiviteler ──
        activities = [
            {"customer": "kemal", "user_id": str(user1_id), "type": "meeting",
             "subject": "Saha ziyareti — AC Towers A Blok",
             "description": "Kemal Bey ile A Blok 3. ve 4. kat gezildi. 4+1 penthouse ve 3+1 ile ilgilendi.",
             "date": "2026-04-15T14:00:00+00:00"},
            {"customer": "selin", "user_id": str(user2_id), "type": "call",
             "subject": "Fiyat ve ödeme planı görüşmesi",
             "description": "AC Garden Palmiye P-202 için fiyat bilgisi ve 24 ay taksit seçeneği aktarıldı.",
             "date": "2026-04-14T10:30:00+00:00"},
            {"customer": "burak", "user_id": str(user1_id), "type": "email",
             "subject": "Teklif gönderildi — A-402",
             "description": "AC Towers A-402 penthouse için resmi teklif ve ödeme planı e-posta ile gönderildi.",
             "date": "2026-04-12T16:00:00+00:00"},
            {"customer": "derya", "user_id": str(user2_id), "type": "call",
             "subject": "İlk iletişim",
             "description": "Derya Hanım ile ilk telefon görüşmesi. AC Garden hakkında bilgi verildi.",
             "date": "2026-04-11T09:15:00+00:00"},
            {"customer": "kemal", "user_id": str(user1_id), "type": "note",
             "subject": "Müşteri notu",
             "description": "Kemal Bey ciddi alıcı, 2 daire birden alabilir. Toplu alım indirimi sunulabilir.",
             "date": "2026-04-10T08:30:00+00:00"},
            {"customer": "emre", "user_id": str(user1_id), "type": "site_visit",
             "subject": "Saha ziyareti — AC Towers B Blok",
             "description": "Emre Bey B Blok 1+1 ve 2+1 dairelerini yerinde inceledi.",
             "date": "2026-04-09T11:00:00+00:00"},
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
        print(f"  ✅ {len(activities)} aktivite eklendi")

        # ── Tedarikçiler ──
        sup_ids = {}
        suppliers = [
            {"key": "atlas", "name": "Atlas Yapı Malzemeleri A.Ş.", "contact_person": "Hüseyin Kara",
             "phone": "0212 555 1001", "email": "info@atlasyapi.com", "tax_number": "1234567890",
             "address": "Bayrampaşa, İstanbul", "category": "malzeme",
             "notes": "Çimento, tuğla ve beton tedarikçisi."},
            {"key": "celik", "name": "Güney Çelik San. Ltd.", "contact_person": "Osman Güney",
             "phone": "0312 444 2002", "email": "satis@guneycelik.com", "tax_number": "9876543210",
             "address": "OSTİM, Ankara", "category": "malzeme",
             "notes": "Demir ve çelik donatı tedarikçisi."},
            {"key": "usta", "name": "Usta Taşeronluk", "contact_person": "Cengiz Usta",
             "phone": "0535 777 3003", "email": None, "tax_number": None,
             "address": None, "category": "taseron",
             "notes": "Kaba inşaat ve betonarme işleri."},
            {"key": "elektra", "name": "Elektra Tesisat ve Mühendislik", "contact_person": "Deniz Akın",
             "phone": "0536 888 4004", "email": "deniz@elektratesisat.com", "tax_number": "5566778899",
             "address": "Ataşehir, İstanbul", "category": "taseron",
             "notes": "Elektrik ve mekanik tesisat."},
        ]
        for s in suppliers:
            sid = uuid.uuid4()
            sup_ids[s["key"]] = sid
            session.execute(text("""
                INSERT INTO suppliers (id, name, contact_person, phone, email, tax_number, address, category, notes, created_at, updated_at)
                VALUES (:id, :name, :contact_person, :phone, :email, :tax_number, :address, :category, :notes, now(), now())
            """), {"id": str(sid), "name": s["name"], "contact_person": s["contact_person"],
                   "phone": s["phone"], "email": s["email"], "tax_number": s["tax_number"],
                   "address": s["address"], "category": s["category"], "notes": s["notes"]})
        print(f"  ✅ {len(suppliers)} tedarikçi eklendi")

        # ── Giderler ──
        expenses = [
            {"supplier": "atlas", "project_id": str(proj1_id), "category": "malzeme",
             "description": "Çimento alımı — 150 ton", "amount": 380000,
             "due_date": "2026-04-20", "paid_amount": 0, "status": "pending",
             "invoice_no": "ATL-2026-0412"},
            {"supplier": "celik", "project_id": str(proj1_id), "category": "malzeme",
             "description": "Nervürlü çelik donatı — 80 ton", "amount": 720000,
             "due_date": "2026-04-25", "paid_amount": 0, "status": "pending",
             "invoice_no": "GC-2026-0388"},
            {"supplier": "usta", "project_id": str(proj1_id), "category": "iscilik",
             "description": "Nisan ayı hakedişi — Kaba inşaat", "amount": 280000,
             "due_date": "2026-04-30", "paid_amount": 0, "status": "pending",
             "invoice_no": "UST-HAK-2026-04"},
            {"supplier": "elektra", "project_id": str(proj1_id), "category": "taseron",
             "description": "Elektrik tesisatı — A Blok 1-2. kat", "amount": 95000,
             "due_date": "2026-03-20", "paid_amount": 95000, "status": "paid",
             "invoice_no": "ELK-2026-0301"},
            {"supplier": "atlas", "project_id": str(proj2_id), "category": "malzeme",
             "description": "Tuğla ve yapı kimyasalları", "amount": 165000,
             "due_date": "2026-03-15", "paid_amount": 80000, "status": "partial",
             "invoice_no": "ATL-2026-0350"},
            {"supplier": None, "project_id": None, "category": "kira",
             "description": "Şantiye ofis kirası — Nisan 2026", "amount": 35000,
             "due_date": "2026-04-01", "paid_amount": 35000, "status": "paid",
             "invoice_no": None},
            {"supplier": None, "project_id": None, "category": "vergi",
             "description": "KDV ödemesi — Q1 2026", "amount": 195000,
             "due_date": "2026-04-25", "paid_amount": 0, "status": "pending",
             "invoice_no": None},
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
        print(f"  ✅ {len(expenses)} gider eklendi")

        # ── Satışlar ──
        sale1_id = uuid.uuid4()
        sale2_id = uuid.uuid4()
        sale3_id = uuid.uuid4()

        sales_data = [
            {"id": str(sale1_id), "unit_key": "A-101", "customer": "kemal",
             "sale_date": "2026-02-01", "sale_price": 3200000, "down_payment": 640000,
             "remaining_debt": 2560000, "installment_count": 24, "status": "active",
             "payment_start_date": "2026-03-01"},
            {"id": str(sale2_id), "unit_key": "A-301", "customer": "burak",
             "sale_date": "2026-03-10", "sale_price": 4800000, "down_payment": 2400000,
             "remaining_debt": 2400000, "installment_count": 12, "status": "active",
             "payment_start_date": "2026-04-10"},
            {"id": str(sale3_id), "unit_key": "P-101", "customer": "selin",
             "sale_date": "2026-01-20", "sale_price": 2800000, "down_payment": 2800000,
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
        print(f"  ✅ {len(sales_data)} satış eklendi")

        # ── Taksitler ──
        # Sale 1 — Kemal Aydın — 24 taksit, ilk 2 ödendi
        monthly = round(2560000 / 24)
        for i in range(1, 7):  # İlk 6 taksiti göster
            iid = uuid.uuid4()
            due = f"2026-{2 + i:02d}-01"
            if i <= 2:
                pa, st = monthly, "paid"
            elif i == 3:
                pa, st = 40000, "partial"
            else:
                pa, st = 0, "pending"
            session.execute(text("""
                INSERT INTO installments (id, sale_id, installment_no, due_date, amount, paid_amount, status, created_at, updated_at)
                VALUES (:id, :sale_id, :installment_no, :due_date, :amount, :paid_amount, :status, now(), now())
            """), {"id": str(iid), "sale_id": str(sale1_id), "installment_no": i,
                   "due_date": due, "amount": monthly, "paid_amount": pa, "status": st})

        # Sale 2 — Burak Erdoğan — 12 taksit, ilki gecikmiş
        monthly2 = round(2400000 / 12)
        for i in range(1, 5):  # İlk 4 taksiti göster
            iid = uuid.uuid4()
            due = f"2026-{3 + i:02d}-10"
            if i == 1:
                pa, st = 0, "overdue"
            else:
                pa, st = 0, "pending"
            session.execute(text("""
                INSERT INTO installments (id, sale_id, installment_no, due_date, amount, paid_amount, status, created_at, updated_at)
                VALUES (:id, :sale_id, :installment_no, :due_date, :amount, :paid_amount, :status, now(), now())
            """), {"id": str(iid), "sale_id": str(sale2_id), "installment_no": i,
                   "due_date": due, "amount": monthly2, "paid_amount": pa, "status": st})

        print("  ✅ 10 taksit eklendi")

        # ── Ödemeler ──
        payments = [
            # Kemal — peşinat
            {"sale_id": str(sale1_id), "amount": 640000, "date": "2026-02-01", "method": "bank_transfer", "ref": "HAV-2026-001"},
            # Kemal — 1. taksit
            {"sale_id": str(sale1_id), "amount": monthly, "date": "2026-03-01", "method": "bank_transfer", "ref": "HAV-2026-002"},
            # Kemal — 2. taksit
            {"sale_id": str(sale1_id), "amount": monthly, "date": "2026-04-01", "method": "bank_transfer", "ref": "HAV-2026-003"},
            # Kemal — 3. taksit kısmi
            {"sale_id": str(sale1_id), "amount": 40000, "date": "2026-04-15", "method": "cash", "ref": "NAK-2026-001"},
            # Burak — peşinat
            {"sale_id": str(sale2_id), "amount": 2400000, "date": "2026-03-10", "method": "bank_transfer", "ref": "HAV-2026-010"},
            # Selin — peşin ödeme
            {"sale_id": str(sale3_id), "amount": 2800000, "date": "2026-01-20", "method": "bank_transfer", "ref": "HAV-2026-020"},
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
