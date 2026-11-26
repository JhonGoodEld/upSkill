# Upskill Academy — Implementación Etapas 4 y 5

## Base del proyecto

Esta actualización se aplicó sobre `upSkillNue_Actividad_CRM_ERP_FIX_2026_11.zip` y después se integró `upSkillNue_Hotfix_MiActividad_CRM_ERP_2026_11.zip`.

## Instalación de la actualización

1. Cierra sesión en Upskill Academy y detén Apache/MySQL desde XAMPP.
2. Haz una copia de seguridad de la carpeta actual del proyecto y exporta la base `upskill_crm` desde phpMyAdmin.
3. Sustituye los archivos del proyecto por los de este ZIP, conservando cualquier archivo local que no esté incluido.
4. Inicia MySQL y Apache.
5. En phpMyAdmin selecciona `upskill_crm` e importa `sql/migracion_etapa4_5_tienda_seguridad_2026_11.sql` al final, después de las migraciones CRM, SCM, ERP y actividad que ya utilizabas.
6. Vuelve a iniciar sesión: la actualización renueva el nombre de la cookie de sesión y descarta sesiones antiguas.
7. Para que se envíen los correos reales por Gmail crea `config.local.php` siguiendo `SMTP_CONFIGURACION.md` (PHPMailer ya viene en `lib/PHPMailer`).

La migración agrega el rol `soporte`, la relación de cuentas alumno con clientes CRM, direcciones, carritos, monederos, movimientos, pagos, tickets, promociones, impuestos, campos de tienda en las órdenes ERP y límites de intentos de inicio de sesión. El IVA se inicializa en 16 %.

## Flujo de compra implementado

1. El alumno inicia sesión y consulta el catálogo dinámico de cursos del SCM.
2. Puede buscar por texto, filtrar por categoría, ordenar, consultar detalle y agregar al carrito.
3. El carrito se guarda en MySQL y valida licencias disponibles.
4. En checkout el nombre y correo de cuenta son de solo lectura. La dirección solicitada se usa como contacto/facturación digital, no como dirección de envío físico.
5. Se calculan descuentos de producto, códigos promocionales e IVA vigente en el servidor.
6. Se aceptan monedero, tarjeta simulada, PayPal simulado y transferencia simulada. No se capturan números de tarjeta ni credenciales reales.
7. La compra crea una orden en `erp_ordenes`, detalle, pago e historial; descuenta inventario SCM y registra movimientos de salida. La estrategia PUSH puede crear y surtir automáticamente una reposición dentro de la misma transacción.
8. El alumno consulta folio, detalle, estado y seguimiento en Mi cuenta. El recibo se envía por correo cuando SMTP esté configurado.

## Monedero

- El monedero se crea con saldo inicial de $0.00 MXN.
- Se puede recargar de forma simulada con tarjeta, PayPal o transferencia.
- Las compras con monedero descuentan saldo y guardan movimiento negativo.
- Los reembolsos a compras pagadas con monedero acreditan saldo y crean movimiento positivo.
- El umbral de saldo bajo se puede cambiar desde ERP → Configuración comercial.
- El saldo, la alerta y el historial se consultan en Mi cuenta.

## Perfil, direcciones, pedidos y tickets

- El nombre y correo de acceso no se editan desde el checkout ni desde el perfil de tienda.
- El alumno puede actualizar teléfono e institución/empresa.
- Puede crear, editar, establecer como predeterminadas y retirar direcciones de contacto/facturación.
- Mis pedidos muestra las compras y su historial de estado.
- El alumno puede crear tickets vinculados opcionalmente a un pedido. No existe acción de eliminación de tickets.
- Administración y soporte pueden responder tickets. Ventas no recibe permisos de soporte.

## Rol Soporte técnico

El administrador principal crea las cuentas desde Panel administrador → Usuarios de soporte técnico. El rol puede acceder únicamente a `views/ERP/soporte.html`, donde atiende tickets y gestiona el estado de compras web. No tiene acceso al CRM, SCM, ERP general ni al panel administrativo.

## Configuración de impuestos y promociones

En ERP → Configuración comercial (solo administradores) se modifica el porcentaje de IVA y el umbral de alerta del monedero. El IVA de instalación es 16 %.

También se pueden crear códigos promocionales de porcentaje o monto fijo, definir vigencia, límite de usos y activar/desactivar códigos. El alumno ve los códigos activos en el catálogo y puede aplicarlos en checkout.

## Seguridad agregada

- Token CSRF obligatorio en todas las solicitudes API que modifican datos.
- Cookies de sesión HttpOnly y SameSite=Lax; Secure se activa al utilizar HTTPS.
- Modo estricto de sesiones y regeneración del identificador al iniciar sesión.
- Limitación de intentos de login: 5 fallos por ventana de 15 minutos.
- Verificación del rol desde base de datos en cada petición protegida.
- Consultas preparadas y validación de datos para los nuevos endpoints.
- Compra, inventario, monedero, orden e historial procesados en transacciones.
- Errores internos registrados en el log del servidor sin mostrar consultas o rutas al navegador.
- Reglas `.htaccess` para bloquear archivos de configuración, SQL, documentación y dependencias; directorio de imágenes sin ejecución de scripts.
- Credenciales SMTP fuera del repositorio y fuera del directorio público de API.
- No se almacenan datos reales de tarjeta, CVV ni credenciales de PayPal.

## Pruebas recomendadas después de importar la migración

1. Aprobar una cuenta alumno y verificar que aparece en CRM y que tiene monedero.
2. Iniciar sesión como alumno, agregar dos cursos, cambiar cantidad y retirar uno.
3. Intentar checkout con carrito vacío, producto sin stock y total cero: el servidor debe rechazarlo.
4. Recargar monedero con un método simulado y revisar el movimiento.
5. Comprar con monedero y comprobar saldo, pedido ERP, salida SCM y reposición PUSH si alcanza stock mínimo.
6. Comprar con tarjeta/PayPal/transferencia simuladas y comprobar que se identifican como simuladas.
7. Aplicar una promoción válida y otra vencida; comprobar descuento e IVA.
8. Abrir Mis pedidos y comprobar folio, detalle, seguimiento y recibo.
9. Crear un ticket, responderlo como soporte y comprobar que el alumno ve la respuesta.
10. Marcar una compra como entregada y realizar un reembolso simulado; comprobar devolución de licencias y, cuando aplique, devolución al monedero.
11. Cambiar el IVA desde configuración comercial y comprobar que solo afecta compras nuevas.
12. Probar cinco contraseñas incorrectas y comprobar el bloqueo temporal.
13. Verificar que una petición POST sin token CSRF es rechazada.

## Consideraciones de despliegue

Esta versión está preparada para el entorno local de XAMPP. Antes de publicar en Internet se debe configurar HTTPS, cambiar las credenciales predeterminadas de MySQL, definir secretos mediante variables de entorno, configurar SMTP verificado, programar respaldos y realizar pruebas de seguridad adicionales. Los pagos externos siguen siendo simulados; para cobrar dinero real se necesitaría integrar y validar una pasarela autorizada.
