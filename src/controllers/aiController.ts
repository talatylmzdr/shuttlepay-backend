import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { createError } from '../middleware/errorHandler';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// POST /api/ai/chat
export const chat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history: Message[];
    };

    if (!message?.trim()) {
      return next(createError('Mesaj boş olamaz', 400));
    }

    // Öğrenci bilgilerini çek
    const studentResult = await query(
      'SELECT name, department, balance FROM students WHERE id = $1',
      [req.studentDbId]
    );
    const student = studentResult.rows[0];

    // Son 5 işlemi çek
    const txResult = await query(
      `SELECT type, amount, description, route, created_at
       FROM transactions WHERE student_id = $1
       ORDER BY created_at DESC LIMIT 5`,
      [req.studentDbId]
    );

    const recentTxSummary = txResult.rows.length > 0
      ? txResult.rows
          .map((t) =>
            `${t.type === 'load' ? '+' : '-'}₺${Math.abs(t.amount)} (${t.description}${t.route ? ' – ' + t.route : ''})`
          )
          .join(', ')
      : 'Henüz işlem yok';

    const systemPrompt = `Sen ShuttlePay'in yapay zeka asistanısın. Türkçe, kısa ve yardımsever cevaplar ver.

Kullanıcı bilgileri:
- Ad: ${student.name}
- Bölüm: ${student.department}
- Bakiye: ₺${parseFloat(student.balance).toFixed(2)}
- Son işlemler: ${recentTxSummary}

ShuttlePay hakkında:
- Nişantaşı Üniversitesi öğrencileri için servis kartı yükleme uygulaması
- Aktif hatlar: Hat 1 (Merkez), Hat 2 (Güney), Hat 3 (Kuzey)
- Servis ücreti: ₺5.00 per biniş
- Çalışma saatleri: 07:00-20:00 (hafta içi)
- Minimum yükleme: ₺10, Maksimum: ₺1000

Kural: Kart numarası, şifre gibi hassas bilgileri asla isteme.`;

    // Claude API çağrısı
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          ...history.slice(-8).map((m: Message) => ({
            role: m.role,
            content: m.content,
          })),
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      throw createError('AI servisi geçici olarak kullanılamıyor', 503);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const reply = data.content[0]?.text || 'Üzgünüm, yanıt üretemiyorum.';

    res.json({
      success: true,
      data: { reply },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/insights
export const getInsights = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Son 30 günlük işlem analizi
    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE type = 'ride') as ride_count,
        COUNT(*) FILTER (WHERE type = 'load') as load_count,
        SUM(amount) FILTER (WHERE type = 'load') as total_loaded,
        SUM(ABS(amount)) FILTER (WHERE type = 'ride') as total_spent,
        MODE() WITHIN GROUP (ORDER BY route) as favorite_route
       FROM transactions
       WHERE student_id = $1
         AND created_at >= NOW() - INTERVAL '30 days'`,
      [req.studentDbId]
    );

    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        rideCount: parseInt(stats.ride_count) || 0,
        loadCount: parseInt(stats.load_count) || 0,
        totalLoaded: parseFloat(stats.total_loaded) || 0,
        totalSpent: parseFloat(stats.total_spent) || 0,
        favoriteRoute: stats.favorite_route || null,
        period: '30 gün',
      },
    });
  } catch (err) {
    next(err);
  }
};
