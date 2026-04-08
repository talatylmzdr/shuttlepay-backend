import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { createError } from '../middleware/errorHandler';

const generateTokens = (studentId: string, dbId: string) => {
  const accessToken = jwt.sign(
    { studentId, dbId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
  return { accessToken };
};

// POST /api/auth/login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId, password } = req.body;

    if (!studentId || !password) {
      return next(createError('Öğrenci no ve şifre gerekli', 400));
    }

    // Öğrenciyi bul
    const result = await query(
      'SELECT * FROM students WHERE student_id = $1 AND is_active = true',
      [studentId]
    );

    if (result.rows.length === 0) {
      return next(createError('Öğrenci no veya şifre hatalı', 401));
    }

    const student = result.rows[0];

    // Şifre kontrolü
    const isValid = await bcrypt.compare(password, student.password_hash);
    if (!isValid) {
      return next(createError('Öğrenci no veya şifre hatalı', 401));
    }

    const { accessToken } = generateTokens(student.student_id, student.id);

    res.json({
      success: true,
      data: {
        token: accessToken,
        student: {
          id: student.id,
          studentId: student.student_id,
          name: student.name,
          email: student.email,
          department: student.department,
          balance: parseFloat(student.balance),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentId, name, email, department, password } = req.body;

    // Mevcut öğrenci kontrolü
    const existing = await query(
      'SELECT id FROM students WHERE student_id = $1 OR email = $2',
      [studentId, email]
    );

    if (existing.rows.length > 0) {
      return next(createError('Bu öğrenci no veya e-posta zaten kayıtlı', 409));
    }

    const passwordHash = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_ROUNDS) || 12
    );

    const result = await query(
      `INSERT INTO students (student_id, name, email, department, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, student_id, name, email, department, balance`,
      [studentId, name, email, department, passwordHash]
    );

    const student = result.rows[0];
    const { accessToken } = generateTokens(student.student_id, student.id);

    res.status(201).json({
      success: true,
      data: {
        token: accessToken,
        student: {
          id: student.id,
          studentId: student.student_id,
          name: student.name,
          email: student.email,
          department: student.department,
          balance: parseFloat(student.balance),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
