"""Test verisi yükleme script'i — geliştirme ortamı için."""

import asyncio
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
import os

# Bu script'i backend container'ı içinden çalıştırın:
#   docker compose exec backend python /app/../scripts/seed-data.py
# veya lokal ortamda: cd backend && python -m scripts.seed-data
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://erp:erp_pass@postgres:5432/insaat_erp")


async def seed():
    engine = create_async_engine(DATABASE_URL)
    session_factory = async_sessionmaker(engine, class_=AsyncSession)

    async with session_factory() as db:
        from app.models import User, Project, Block, Unit, Customer, Opportunity, Supplier, Expense
        from app.core.security import hash_password

        # Admin kullanıcı
        admin = User(
            id=uuid.uuid4(),
            email="admin@acgrup.com",
            password_hash=hash_password("admin123"),
            first_name="Admin",
            last_name="AC Grup",
            phone="0532 000 0001",
            role="admin",
        )
        db.add(admin)

        # Satış müdürü
        manager = User(
            id=uuid.uuid4(),
            email="satis@acgrup.com",
            password_hash=hash_password("satis123"),
            first_name="Mehmet",
            last_name="Yılmaz",
            phone="0532 000 0002",
            role="sales_manager",
        )
        db.add(manager)

        # Proje 1
        p1 = Project(
            id=uuid.uuid4(),
            name="Park Evler Konutları",
            code="PARK-EVLER",
            city="İstanbul",
            district="Beylikdüzü",
            status="active",
            total_units=40,
            start_date=date(2025, 6, 1),
            expected_end=date(2027, 6, 1),
        )
        db.add(p1)

        # Proje 2
        p2 = Project(
            id=uuid.uuid4(),
            name="Deniz Konakları",
            code="DENIZ-KONAK",
            city="Antalya",
            district="Konyaaltı",
            status="active",
            total_units=60,
            start_date=date(2025, 3, 1),
            expected_end=date(2027, 12, 1),
        )
        db.add(p2)

        # Bloklar
        b1 = Block(id=uuid.uuid4(), project_id=p1.id, name="A Blok", total_floors=10)
        b2 = Block(id=uuid.uuid4(), project_id=p1.id, name="B Blok", total_floors=10)
        b3 = Block(id=uuid.uuid4(), project_id=p2.id, name="A Blok", total_floors=15)
        db.add_all([b1, b2, b3])

        # Daireler — Park Evler A Blok (10 kat x 2 daire = 20)
        for floor in range(1, 11):
            for unit_num in range(1, 3):
                status = "available"
                if floor <= 3 and unit_num == 1:
                    status = "sold"
                elif floor <= 5 and unit_num == 2:
                    status = "reserved"

                db.add(Unit(
                    project_id=p1.id,
                    block_id=b1.id,
                    floor_number=floor,
                    unit_number=f"A-{floor}-{unit_num}",
                    room_type="3+1" if unit_num == 1 else "2+1",
                    gross_area_m2=Decimal("120") if unit_num == 1 else Decimal("90"),
                    net_area_m2=Decimal("100") if unit_num == 1 else Decimal("75"),
                    list_price=Decimal("3500000") if unit_num == 1 else Decimal("2500000"),
                    status=status,
                    has_balcony=True,
                    direction="Güney" if unit_num == 1 else "Kuzey",
                ))

        # Müşteriler
        customers = [
            Customer(id=uuid.uuid4(), first_name="Ahmet", last_name="Kaya", phone="0555 111 2233", source="web", assigned_to=manager.id),
            Customer(id=uuid.uuid4(), first_name="Fatma", last_name="Demir", phone="0555 222 3344", source="referral", assigned_to=manager.id),
            Customer(id=uuid.uuid4(), first_name="Ali", last_name="Şahin", phone="0555 333 4455", source="walk_in", assigned_to=manager.id),
            Customer(id=uuid.uuid4(), first_name="Zeynep", last_name="Öztürk", phone="0555 444 5566", source="phone", assigned_to=manager.id),
            Customer(id=uuid.uuid4(), first_name="Hasan", last_name="Çelik", phone="0555 555 6677", source="ad", assigned_to=manager.id),
        ]
        db.add_all(customers)

        # Fırsatlar
        for i, cust in enumerate(customers[:3]):
            db.add(Opportunity(
                customer_id=cust.id,
                project_id=p1.id,
                offered_price=Decimal("3200000") + Decimal(str(i * 100000)),
                status=["new", "contacted", "proposal_sent"][i],
                priority=["high", "medium", "low"][i],
                assigned_to=manager.id,
            ))

        # Tedarikçiler
        sup1 = Supplier(id=uuid.uuid4(), name="ABC İnşaat Malzemeleri", phone="0212 111 2233", category="malzeme")
        sup2 = Supplier(id=uuid.uuid4(), name="XYZ Demir Çelik", phone="0212 222 3344", category="malzeme")
        sup3 = Supplier(id=uuid.uuid4(), name="Doğan Taşeronluk", phone="0212 333 4455", category="taseron")
        db.add_all([sup1, sup2, sup3])

        # Giderler
        db.add_all([
            Expense(supplier_id=sup1.id, project_id=p1.id, category="malzeme",
                    description="Çimento alımı - 500 ton", amount=Decimal("450000"),
                    due_date=date(2026, 4, 15), status="pending", created_by=admin.id),
            Expense(supplier_id=sup2.id, project_id=p1.id, category="malzeme",
                    description="Demir donatı", amount=Decimal("680000"),
                    due_date=date(2026, 4, 20), status="pending", created_by=admin.id),
            Expense(supplier_id=sup3.id, project_id=p2.id, category="iscilik",
                    description="Kaba inşaat - Nisan hakedişi", amount=Decimal("320000"),
                    due_date=date(2026, 4, 30), status="pending", created_by=admin.id),
        ])

        await db.commit()
        print("Test verileri başarıyla yüklendi!")


if __name__ == "__main__":
    asyncio.run(seed())
