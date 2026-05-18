import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "La variable de entorno JWT_SECRET es obligatoria. Definila en server/.env",
  );
}

export interface CustomRequest extends Request {
  usuario?: {
    id: number;
    email: string;
    rol: string;
    nombre: string;
  };
  io?: any;
}

export const validateToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction,
): void => {
  const headerToken = req.headers["authorization"];

  if (headerToken != undefined && headerToken.startsWith("Bearer ")) {
    try {
      const bearerToken = headerToken.slice(7);
      const payload = jwt.verify(
        bearerToken,
        JWT_SECRET,
      ) as CustomRequest["usuario"];
      if (!payload?.rol) {
        res
          .status(401)
          .json({
            msg: "Token inválido: sesión expirada, vuelve a iniciar sesión.",
          });
        return;
      }
      req.usuario = payload;
      next();
    } catch (error) {
      res.status(401).json({ msg: "Token no válido" });
    }
  } else {
    res.status(401).json({ msg: "Acceso denegado. Token no proporcionado." });
  }
};
