import { Request, Response, NextFunction } from 'express';

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  const headerToken = req.headers.authorization;

  if (headerToken) {
    const tokenParts = headerToken.split(' ');
    if (tokenParts.length === 2 && tokenParts[0] === 'Bearer') {
      const token = tokenParts[1];

      const checkToken = process.env.SERVER_TOKEN;

      if (!token) {
        return res.status(401).json({ erro: 'Token not provided' });
      }

      if (token != checkToken) {
        return res.status(403).json({ erro: 'Unauthenticated' });
      }

      //next();
    }
  }

  next();
};

export default checkToken;
