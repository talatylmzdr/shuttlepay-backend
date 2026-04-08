# ShuttlePay Backend API 🚀

Node.js + Express + PostgreSQL + Claude AI

## Kurulum

### 1. PostgreSQL Kur

Windows için: https://www.postgresql.org/download/windows/
- Kurulum sırasında şifreyi not al

### 2. Veritabanı oluştur

pgAdmin'i aç veya komut satırında:
```sql
CREATE DATABASE shuttlepay;
```

### 3. Bağımlılıkları kur

```bash
cd ShuttlePayBackend
npm install
```

### 4. .env dosyasını oluştur

```bash
copy .env.example .env
```

`.env` dosyasını aç ve doldur:
```
DB_PASSWORD=postgresql_şifren
ANTHROPIC_API_KEY=sk-ant-...
```

### 5. Tabloları oluştur

```bash
npm run db:migrate
```

### 6. Test verisi ekle

```bash
npm run db:seed
```

### 7. Sunucuyu başlat

```bash
npm run dev
```

`http://localhost:3000/health` açılırsa çalışıyor! ✅

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/auth/login | Giriş |
| POST | /api/auth/register | Kayıt |
| GET | /api/student/me | Profil |
| GET | /api/student/balance | Bakiye |
| GET | /api/student/transactions | İşlemler |
| POST | /api/payment/load | Bakiye yükle |
| GET | /api/payment/cards | Kartlar |
| POST | /api/ai/chat | AI asistan |
| GET | /api/ai/insights | Harcama analizi |
| GET | /api/routes | Servis hatları |

## Test Bilgileri

```
Öğrenci No: 2021045123
Şifre: test123
```

## Mobil Uygulamayı Bağla

`ShuttlePay/src/services/api.ts` dosyasında IP adresini güncelle:

```bash
# Terminalde IP adresini öğren
ipconfig
# IPv4 Address satırındaki değeri al → örn: 192.168.1.45
```

```typescript
const BASE_URL = 'http://192.168.1.45:3000/api'; // kendi IP'n
```
