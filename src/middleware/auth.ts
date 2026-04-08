import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  studentId?: string;
  studentDbId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Yetkilendirme token\'ı gerekli',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      studentId: string;
      dbId: string;
    };

    req.studentId = decoded.studentId;
    req.studentDbId = decoded.dbId;
    next();
  } catch {
    res.status(401).json({
      success: false,
      message: 'Geçersiz veya süresi dolmuş token',
    });
  }
};
