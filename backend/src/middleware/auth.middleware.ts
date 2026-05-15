import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido', code: 'AUTH_REQUIRED' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado', code: 'INVALID_TOKEN' });
  }
};

/**
 * Middleware to restrict access by role
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado', code: 'AUTH_REQUIRED' });
      return;
    }

    if (!roles.includes(req.user.rol)) {
      res.status(403).json({
        error: 'No tiene permisos para esta acción',
        code: 'FORBIDDEN',
        details: { rolActual: req.user.rol, rolesPermitidos: roles },
      });
      return;
    }

    next();
  };
};
