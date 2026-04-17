#!/bin/sh
set -e

echo "⏳ PostgreSQL bağlantısı bekleniyor..."
# postgres hazır olana kadar bekle (depends_on healthcheck zaten bunu yapıyor)

echo "📦 Migration oluşturuluyor/çalıştırılıyor..."

# Eski/bozuk revision varsa temizle — alembic_version tablosunu sıfırla
# Bu, versions klasörü boş olduğunda "Can't locate revision" hatasını önler
if ! alembic current 2>&1 | grep -q "head\|(head)"; then
    echo "  → Eski revision tespit edildi, alembic_version sıfırlanıyor..."
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

# İlk migration yoksa oluştur
if [ ! "$(ls -A alembic/versions/*.py 2>/dev/null)" ]; then
    echo "  → İlk migration oluşturuluyor..."
    alembic revision --autogenerate -m "initial_tables" || echo "  ⚠️ Migration oluşturulamadı"
fi

# Migration'ları çalıştır
echo "  → Migration'lar uygulanıyor..."
alembic upgrade head || echo "  ⚠️ Migration uygulanamadı (tablo zaten mevcut olabilir)"

echo "🚀 Backend başlatılıyor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
