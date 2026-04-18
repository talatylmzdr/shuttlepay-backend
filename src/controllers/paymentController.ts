// paymentController.ts — Ödeme işlemleri
// iyzico entegrasyonu dahil

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import { createError } from '../middleware/errorHandler';
import { processPayment } from '../services/iyzico';

// POST /api/payment/load
export const loadBalance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount, cardId } = req.body;

    if (!amount || amount < 10) return next(createError('Minimum yükleme tutarı ₺10', 400));
    if (amount > 1000) return next(createError('Maksimum yükleme tutarı ₺1000', 400));

    // Öğrenci bilgilerini al
    const studentResult = await query(
      'SELECT id, balance, name, email FROM students WHERE id = $1 FOR UPDATE',
      [req.studentDbId]
    );
    if (studentResult.rows.length === 0) return next(createError('Öğrenci bulunamadı', 404));

    const student = studentResult.rows[0];
    const balanceBefore = parseFloat(student.balance);

    // Kart kontrolü
    if (cardId) {
      const cardResult = await query(
        'SELECT id FROM saved_cards WHERE id = $1 AND student_id = $2',
        [cardId, req.studentDbId]
      );
      if (cardResult.rows.length === 0) return next(createError('Kart bulunamadı', 404));
    }

    // iyzico ödeme işlemi
    const paymentResult = await processPayment({
      amount: Number(amount),
      studentId: req.studentId || '',
      studentName: student.name,
      studentEmail: student.email,
    });

    if (!paymentResult.success) {
      return next(createError(paymentResult.errorMessage || 'Ödeme başarısız', 402));
    }

    // Ödeme başarılı — bakiyeyi güncelle
    const balanceAfter = balanceBefore + Number(amount);

    await query('BEGIN');
    try {
      await query(
        'UPDATE students SET balance = $1, updated_at = NOW() WHERE id = $2',
        [balanceAfter, req.studentDbId]
      );

      const txResult = await query(
        `INSERT INTO transactions
           (student_id, type, amount, balance_before, balance_after, description, card_id, iyzico_payment_id, status)
         VALUES ($1, 'load', $2, $3, $4, 'Kart Yükleme', $5, $6, 'success')
         RETURNING id, created_at`,
        [req.studentDbId, amount, balanceBefore, balanceAfter, cardId || null, paymentResult.paymentId]
      );

      await query('COMMIT');

      res.json({
        success: true,
        data: {
          transactionId: txResult.rows[0].id,
          amount: Number(amount),
          balanceBefore,
          balanceAfter,
          paymentId: paymentResult.paymentId,
          createdAt: txResult.rows[0].created_at,
        },
      });
    } catch (err) {
      await query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

// GET /api/payment/cards
export const getSavedCards = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await query(
      'SELECT id, last_four, brand, bank_name, is_default FROM saved_cards WHERE student_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.studentDbId]
    );
    res.json({
      success: true,
      data: result.rows.map((c) => ({
        id: c.id, lastFour: c.last_four,
        brand: c.brand, bankName: c.bank_name, isDefault: c.is_default,
      })),
    });
  } catch (err) { next(err); }
};

// POST /api/payment/cards
export const addCard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { lastFour, brand, bankName, isDefault } = req.body;
    if (!lastFour || !brand) return next(createError('Kart bilgileri eksik', 400));

    if (isDefault) {
      await query('UPDATE saved_cards SET is_default = false WHERE student_id = $1', [req.studentDbId]);
    }

    const result = await query(
      'INSERT INTO saved_cards (student_id, last_four, brand, bank_name, is_default) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.studentDbId, lastFour, brand, bankName || null, isDefault || false]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.rows[0].id,
        lastFour: result.rows[0].last_four,
        brand: result.rows[0].brand,
        bankName: result.rows[0].bank_name,
        isDefault: result.rows[0].is_default,
      },
    });
  } catch (err) { next(err); }
};

// DELETE /api/payment/cards/:id
export const deleteCard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await query(
      'DELETE FROM saved_cards WHERE id = $1 AND student_id = $2 RETURNING id',
      [req.params.id, req.studentDbId]
    );
    if (result.rows.length === 0) return next(createError('Kart bulunamadı', 404));
    res.json({ success: true, message: 'Kart silindi' });
  } catch (err) { next(err); }
};
