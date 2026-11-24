# Etapa 5 — Seguridad, dispersión, cierre y defensa

## Controles aplicados en esta versión

1. **CSRF:** todas las operaciones POST, PUT, PATCH y DELETE de la API requieren un token de sesión enviado en `X-CSRF-Token`.
2. **Sesiones:** cookie HttpOnly, SameSite=Lax, Secure cuando el sitio usa HTTPS, modo estricto y regeneración al autenticar.
3. **Autenticación:** contraseñas con `password_hash`/`password_verify`; bloqueo temporal tras cinco intentos fallidos en quince minutos.
4. **Autorización:** cada endpoint vuelve a consultar el usuario y rol desde MySQL. Las cuentas de alumno, ventas, soporte, logística y administración tienen rutas separadas.
5. **Integridad:** las operaciones de compra, descuento de inventario, registro de movimientos y monedero se ejecutan en transacciones.
6. **Validación:** cantidad, stock, precios, impuestos, códigos promocionales, direcciones y estados se validan en servidor.
7. **Consultas SQL:** los endpoints nuevos usan consultas preparadas; no reciben nombres de tablas o columnas desde el navegador.
8. **Errores:** los errores internos se registran en el servidor y se devuelve un mensaje genérico JSON.
9. **Carga de imágenes:** el endpoint SCM permite solo imágenes por MIME y tamaño; el directorio de uploads bloquea ejecución de scripts.
10. **Secretos:** SMTP se configura en `config.local.php`, archivo ignorado por Git y bloqueado por Apache. Las credenciales de pago no se almacenan.

## Riesgos que siguen requiriendo configuración o pruebas

- Activar HTTPS antes de publicar para que la cookie de sesión utilice Secure.
- Cambiar el usuario/contraseña predeterminados de MySQL y definir variables `UPSKILL_DB_HOST`, `UPSKILL_DB_NAME`, `UPSKILL_DB_USER` y `UPSKILL_DB_PASS`.
- Configurar SMTP y validar dominio/remitente antes de enviar recibos a usuarios externos.
- Los pagos con tarjeta, PayPal y transferencia son simulados y no representan cobros reales.
- Realizar pruebas de penetración autorizadas, revisión de dependencias, respaldos y recuperación antes de producción.
- Revisar todos los módulos heredados en el ambiente real; los controles nuevos no sustituyen una auditoría profesional completa.
