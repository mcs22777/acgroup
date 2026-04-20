#!/bin/sh
set -e

echo "⏳ PostgreSQL bağlantısı bekleniyor..."
# postgres hazır olana kadar bekle (depends_on healthcheck zaten bunu yapıyor)

# PostgreSQL bağlantısını doğrula
echo "  → Bağlantı testi yapılıyor..."
python -c "
from sqlalchemy import create_engine, text
import os, sys
url = os.environ.get('DATABASE_URL', '').replace('+asyncpg', '')
if not url:
    print('  ❌ DATABASE_URL ayarlanmamış!')
    sys.exit(1)
try:
    engine = create_engine(url)
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
    engine.dispose()
    print('  ✅ PostgreSQL bağlantısı başarılı')
except Exception as e:
    print(f'  ❌ PostgreSQL bağlantı hatası: {e}')
    sys.exit(1)
"

echo "📦 Migration oluşturuluyor/çalıştırılıyor..."

# Önce users tablosu var mı kontrol et — yoksa migration'ı sıfırdan çalıştır
TABLES_EXIST=$(python -c "
from sqlalchemy import create_engine, text, inspect
import os
url = os.environ.get('DATABASE_URL', '').replace('+asyncpg', '')
engine = create_engine(url)
inspector = inspect(engine)
tables = inspector.get_table_names()
engine.dispose()
print('yes' if 'users' in tables else 'no')
" 2>/dev/null)

if [ "$TABLES_EXIST" = "no" ]; then
    echo "  → Tablolar bulunamadı, alembic_version sıfırlanıyor..."
    python -c "
from sqlalchemy import create_engine, text
import os
url = os.environ.get('DATABASE_URL', '').replace('+asyncpg', '')
if url:
    engine = create_engine(url)
    with engine.connect() as conn:
        conn.execute(text('DROP TABLE IF EXISTS alembic_version'))
        conn.commit()
    engine.dispose()
    print('  ✅ alembic_version tablosu silindi')
" 2>/dev/null || echo "  ⚠️ alembic_version sıfırlanamadı"
fi

# Migration'ları çalıştır
echo "  → Migration'lar uygulanıyor..."
if ! alembic upgrade head; then
    echo "  ⚠️ Alembic migration başarısız, tabloları doğrudan oluşturuyoruz..."
    python -c "
import asyncio
from app.db.base import Base
from app.db.session import engine
from app.models import *  # noqa

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('  ✅ Tablolar doğrudan oluşturuldu')

asyncio.run(create_tables())
"
fi

# Tabloların gerçekten oluştuğunu doğrula
echo "  → Tablo doğrulaması yapılıyor..."
python -c "
from sqlalchemy import create_engine, inspect
import os, sys
url = os.environ.get('DATABASE_URL', '').replace('+asyncpg', '')
engine = create_engine(url)
inspector = inspect(engine)
tables = inspector.get_table_names()
engine.dispose()
required = ['users', 'projects', 'blocks', 'units', 'customers', 'sales', 'installments', 'payments', 'expenses', 'suppliers', 'expense_installments']
missing = [t for t in required if t not in tables]
if missing:
    print(f'  ❌ Eksik tablolar: {missing}')
    sys.exit(1)
print(f'  ✅ Tüm tablolar mevcut ({len(tables)} tablo)')
"

echo "🌱 Seed verileri kontrol ediliyor..."
python /app/seed.py
if [ $? -ne 0 ]; then
    echo "  ⚠️ Seed çalıştırılamadı — detaylar yukarıda"
fi

echo "🚀 Backend başlatılıyor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
