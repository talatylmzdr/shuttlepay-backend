import { query } from '../config/database';

async function migrate() {
  console.log('🔄 Veritabanı tabloları oluşturuluyor...');

  // Öğrenciler tablosu
  await query(`
    CREATE TABLE IF NOT EXISTS students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      department VARCHAR(100) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ students tablosu');

  // Kayıtlı kartlar tablosu
  await query(`
    CREATE TABLE IF NOT EXISTS saved_cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      last_four VARCHAR(4) NOT NULL,
      brand VARCHAR(20) NOT NULL,
      bank_name VARCHAR(100),
      iyzico_card_token VARCHAR(255),
      is_default BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ saved_cards tablosu');

  // İşlem geçmişi tablosu
  await query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      type VARCHAR(10) NOT NULL CHECK (type IN ('load', 'ride')),
      amount DECIMAL(10, 2) NOT NULL,
      balance_before DECIMAL(10, 2) NOT NULL,
      balance_after DECIMAL(10, 2) NOT NULL,
      description VARCHAR(255) NOT NULL,
      route VARCHAR(50),
      card_id UUID REFERENCES saved_cards(id),
      iyzico_payment_id VARCHAR(255),
      status VARCHAR(20) NOT NULL DEFAULT 'success'
        CHECK (status IN ('success', 'failed', 'pending')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ transactions tablosu');

  // Servis hatları tablosu
  await query(`
    CREATE TABLE IF NOT EXISTS routes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL,
      description VARCHAR(255),
      departure_point VARCHAR(150),
      arrival_point VARCHAR(150),
      fare DECIMAL(6, 2) NOT NULL DEFAULT 5.00,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ routes tablosu');

  // Servis sefer tablosu
  await query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      route_id UUID NOT NULL REFERENCES routes(id),
      departure_time TIME NOT NULL,
      days VARCHAR(20) NOT NULL DEFAULT 'weekdays',
      is_active BOOLEAN NOT NULL DEFAULT true
    );
  `);
  console.log('  ✅ schedules tablosu');

  // Refresh token tablosu
  await query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      token VARCHAR(500) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('  ✅ refresh_tokens tablosu');

  // İndeksler
  await query(`CREATE INDEX IF NOT EXISTS idx_transactions_student ON transactions(student_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_cards_student ON saved_cards(student_id);`);
  console.log('  ✅ İndeksler oluşturuldu');

  console.log('\n🎉 Migration tamamlandı!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration hatası:', err);
  process.exit(1);
});
