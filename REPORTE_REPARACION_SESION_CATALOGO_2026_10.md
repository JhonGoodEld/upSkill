# Reparación de sesión administrativa y catálogo público

## Problemas corregidos
- El SCM podía tratar a un administrador como logística cuando `usuario` aún no estaba cargado o la sesión tenía un rol obsoleto.
- El botón CRM/Panel y Regresar ahora validan el rol real contra `me.php` antes de navegar.
- Un error de red o de un endpoint SCM ya no expulsa al administrador al inicio: solo 401/403 redirigen al login.
- `require_login()` resincroniza la sesión con la fila actual de `usuarios` en MySQL.
- Si `es_superadmin=1`, el rol se normaliza a `admin`.
- `cursos_publicos.php` tolera columnas opcionales faltantes y devuelve el catálogo activo siempre que exista el esquema mínimo.

## Migración
Ejecutar `sql/migracion_reparacion_sesion_catalogo_2026_10.sql` una vez.

## Pruebas sugeridas
1. Abrir `api/me.php` autenticado como principal: debe mostrar `rol: admin` y `es_superadmin: 1`.
2. Abrir `api/cursos_publicos.php`: debe devolver `ok:true`, `total` mayor a 0 y `cursos:[...]`.
3. Entrar a SCM: debe cargar datos y permitir ir a CRM/Panel.
4. Abrir `views/cursos.html`: debe mostrar las tarjetas de los cursos activos.
