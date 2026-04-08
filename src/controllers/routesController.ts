import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

// GET /api/routes
export const getRoutes = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await query(
      `SELECT r.*, 
        json_agg(
          json_build_object('time', to_char(s.departure_time, 'HH24:MI'), 'days', s.days)
          ORDER BY s.departure_time
        ) as schedules
       FROM routes r
       LEFT JOIN schedules s ON r.id = s.route_id AND s.is_active = true
       WHERE r.is_active = true
       GROUP BY r.id
       ORDER BY r.name`,
      []
    );

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        departurePoint: r.departure_point,
        arrivalPoint: r.arrival_point,
        fare: parseFloat(r.fare),
        schedules: r.schedules.filter((s: { time: string }) => s.time),
      })),
    });
  } catch (err) {
    next(err);
  }
};
