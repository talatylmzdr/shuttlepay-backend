import bcrypt from 'bcryptjs';
import { query } from '../config/database';

async function seed() {
  console.log('🌱 Test verileri ekleniyor...');

  // Test öğrencisi
  const hash = await bcrypt.hash('test123', 12);
  await query(`
    INSERT INTO students (student_id, name, email, department, password_hash, balance)
    VALUES 
      ('2021045123', 'Ahmet Yılmaz', 'ahmet@nisantasi.edu.tr', 'Bilgisayar Mühendisliği', $1, 47.50),
      ('2022031456', 'Zeynep Kaya', 'zeynep@nisantasi.edu.tr', 'İşletme', $1, 120.00),
      ('2023018789', 'Mehmet Demir', 'mehmet@nisantasi.edu.tr', 'Hukuk', $1, 5.00)
    ON CONFLICT (student_id) DO NOTHING;
  `, [hash]);
  console.log('  ✅ 3 test öğrencisi eklendi');

  // Servis hatları
  await query(`
    INSERT INTO routes (name, description, departure_point, arrival_point, fare)
    VALUES 
      ('Hat 1', 'Merkez Kampüs Hattı', 'Şişli Metro', 'Ana Kampüs', 5.00),
      ('Hat 2', 'Güney Yerleşke Hattı', 'Beşiktaş İskelesi', 'Güney Yerleşke', 5.00),
      ('Hat 3', 'Kuzey Yerleşke Hattı', 'Levent Metro', 'Kuzey Yerleşke', 5.00)
    ON CONFLICT DO NOTHING;
  `);
  console.log('  ✅ 3 servis hattı eklendi');

  // Sefer saatleri
  await query(`
    INSERT INTO schedules (route_id, departure_time, days)
    SELECT r.id, s.departure_time::TIME, 'weekdays'
    FROM routes r
    CROSS JOIN (
      VALUES ('07:30'), ('08:00'), ('08:30'), ('09:00'),
             ('12:00'), ('13:00'), ('17:00'), ('17:30'),
             ('18:00'), ('18:30'), ('19:00')
    ) AS s(departure_time)
    ON CONFLICT DO NOTHING;
  `);
  console.log('  ✅ Sefer saatleri eklendi');

  console.log('\n🎉 Seed tamamlandı!');
  console.log('\nTest giriş bilgileri:');
  console.log('  Öğrenci No: 2021045123');
  console.log('  Şifre: test123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed hatası:', err);
  process.exit(1);
});
