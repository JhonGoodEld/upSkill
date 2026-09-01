// Validaciones simples y reutilizables. Lanzan AppError(400) con un mensaje claro.
import { AppError } from '../middleware/errorHandler.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireFields(body, fields) {
  const faltantes = fields.filter((f) => {
    const v = body?.[f];
    return v === undefined || v === null || String(v).trim() === '';
  });
  if (faltantes.length) {
    throw new AppError(400, `Faltan campos obligatorios: ${faltantes.join(', ')}`);
  }
}

export function assertEmail(correo) {
  if (!EMAIL_RE.test(String(correo).trim())) {
    throw new AppError(400, 'El correo no tiene un formato válido');
  }
}

export function assertEnum(valor, permitidos, campo) {
  if (!permitidos.includes(valor)) {
    throw new AppError(400, `${campo} debe ser uno de: ${permitidos.join(', ')}`);
  }
}

export function assertTelefono(telefono) {
  if (telefono == null || telefono === '') return; // opcional
  if (!/^[\d\s()+-]{7,20}$/.test(String(telefono))) {
    throw new AppError(400, 'El teléfono no tiene un formato válido');
  }
}

export function toInt(value, campo) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new AppError(400, `${campo} debe ser un entero positivo`);
  }
  return n;
}
