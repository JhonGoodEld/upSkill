# Cambios ERP U3

- Nuevo rol `ventas` creado exclusivamente por superadmin.
- Login compartido Admin/Logística/Ventas con redirección por rol.
- Nuevo módulo `views/ERP/erp.html`.
- Endpoints ERP separados para limitar permisos del rol Ventas.
- Órdenes de clientes integradas con `clientes` (CRM) y `productos`/stock (SCM).
- Procesamiento automático de venta e inventario dentro de transacción.
- Registro automático del movimiento SCM de salida por venta ERP.
- Historial de estados de órdenes.
- Métricas ERP: clientes activos, órdenes, ventas, productos vendidos e inventario disponible.
- Reportes con alternancia tabla/gráfica.
- Nivel ERP: Básico, Integrado, Automatizado, Optimizado y checklist manual.
- Acceso rápido a ERP desde panel admin, CRM y SCM (solo admin).
