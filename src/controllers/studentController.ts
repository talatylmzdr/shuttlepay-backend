import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { createError } from '../middleware/errorHandler';

// GET /api/student/me
export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, student_id, name, email, department, balance, created_at
       FROM students WHERE id = $1`,
      [req.studentDbId]
    );

    if (result.rows.length === 0) {
      return next(createError('Öğrenci bulunamadı', 404));
    }

    const student = result.rows[0];

    res.json({
      success: true,
      data: {
        id: student.id,
        studentId: student.student_id,
        name: student.name,
        email: student.email,
        department: student.department,
        balance: parseFloat(student.balance),
        createdAt: student.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/student/balance
export const getBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await query(
      'SELECT balance FROM students WHERE id = $1',
      [req.studentDbId]
    );

    res.json({
      success: true,
      data: {
        balance: parseFloat(result.rows[0].balance),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/student/transactions
export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const type = req.query.type as string | undefined;

    let queryText = `
      SELECT t.*, sc.last_four, sc.brand
      FROM transactions t
      LEFT JOIN saved_cards sc ON t.card_id = sc.id
      WHERE t.student_id = $1
    `;
    const params: unknown[] = [req.studentDbId];

    if (type && ['load', 'ride'].includes(type)) {
      queryText += ` AND t.type = $2`;
      params.push(type);
    }

    queryText += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    // Toplam kayıt sayısı
    const countResult = await query(
      'SELECT COUNT(*) FROM transactions WHERE student_id = $1',
      [req.studentDbId]
    );

    res.json({
      success: true,
      data: {
        transactions: result.rows.map((t) => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount),
          balanceBefore: parseFloat(t.balance_before),
          balanceAfter: parseFloat(t.balance_after),
          description: t.description,
          route: t.route,
          status: t.status,
          createdAt: t.created_at,
          card: t.last_four
            ? { lastFour: t.last_four, brand: t.brand }
            : null,
        })),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].count),
          totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
// Token kaydetme fonksiyonu
export const updatePushToken = async (
  req: any, // AuthRequest tipin varsa onu kullanabilirsin
  res: any,
  next: any
): Promise<void> => {
  try {
    const { pushToken } = req.body;
    
    if (!pushToken) {
      res.status(400).json({ success: false, message: 'Token gönderilmedi' });
      return;
    }

    // Supabase'deki push_token odasına bu adresi yazıyoruz
    await query(
      'UPDATE students SET push_token = $1 WHERE id = $2',
      [pushToken, req.studentDbId]
    );

    res.json({ success: true, message: 'Bildirim adresi başarıyla kaydedildi' });
  } catch (err) {
    next(err);
  }
};