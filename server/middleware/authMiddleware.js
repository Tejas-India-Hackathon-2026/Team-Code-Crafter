import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'workerconnect_super_secure_jwt_secret_2025';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      status: user.status || 'active',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }
    req.user = decoded;
    next();
  });
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
      });
    }
    next();
  };
}

export const requireAdmin = [authenticateToken, requireRole('admin')];
export const requireWorker = [authenticateToken, requireRole('worker')];
export const requireCustomer = [authenticateToken, requireRole('customer')];
export const requireCustomerOrWorker = [authenticateToken, requireRole('customer', 'worker', 'admin')];
