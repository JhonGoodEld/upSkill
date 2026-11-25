# Etapa 3 — ERP (Semanas 7–9)

Esta versión agrega el módulo ERP sobre la última versión CRM + SCM del proyecto.

## Instalación
1. Haz respaldo de la base `upskill_crm`.
2. En phpMyAdmin selecciona `upskill_crm`.
3. Ejecuta `sql/migracion_erp_2026_10.sql`.
4. Sustituye los archivos del proyecto por esta versión.
5. Inicia sesión desde `views/CMR/Administradores/loggin.html`.

## Roles
- `admin`: CRM + SCM + ERP + panel administrativo.
- `logistica`: solo SCM.
- `ventas`: solo ERP. El ERP le expone únicamente los datos necesarios de clientes, cursos e inventario mediante endpoints propios.
- `docente` / `alumno`: sin acceso a los módulos internos anteriores.

El administrador principal puede crear/editar/desactivar cuentas de Ventas desde el mismo bloque donde gestiona administradores y logística.

## ERP
Ruta: `views/ERP/erp.html`

Incluye:
- Dashboard empresarial.
- Clientes activos tomados de CRM.
- Alta limitada de cliente desde el flujo ERP (el registro se guarda en `clientes` y queda disponible en CRM).
- Cursos e inventario tomados directamente de SCM.
- Órdenes de clientes con filtros, detalle e historial.
- Flujo Nueva orden: cliente -> productos/cantidades -> resumen -> procesamiento.
- Procesamiento transaccional: reduce inventario y registra movimientos de salida con motivo `venta` en SCM.
- Si un curso PUSH llega al mínimo, se conserva la lógica SCM de reposición automática y surtido inmediato.
- Nivel de implementación ERP con barra y checklist manual.
- Reportes en tabla y gráfica.

## Tablas nuevas
- `erp_ordenes`
- `erp_orden_detalle`
- `erp_orden_historial`
- `erp_configuracion`

La migración también crea las vistas `erp_recursos` y `erp_reporte_resumen` para integrar información sin duplicar clientes, productos ni inventario.

## Prueba recomendada
1. Como superadmin crea una cuenta de Ventas.
2. Cierra sesión e inicia con Ventas desde el mismo login administrativo.
3. Debe redirigir a ERP y bloquear CRM/SCM/panel administrativo.
4. Crea una orden con un cliente CRM y un curso SCM.
5. Confirma y procesa.
6. Verifica en ERP que la orden quede `procesada`.
7. Verifica en SCM > Movimientos que exista la salida automática con motivo `venta`.
8. Verifica que el stock se haya reducido (o repuesto si el curso era PUSH y llegó al mínimo).
