<?php
require_once __DIR__ . '/helpers.php';
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(['error' => 'Método no permitido.'], 405);
}

try {
    $pdo = db();

    /*
     * El catálogo público tolera bases que todavía no tengan todos los campos
     * añadidos por las últimas migraciones. Así una columna opcional faltante
     * no impide que se muestren las tarjetas de los cursos.
     */
    $cols = [];
    foreach ($pdo->query('SHOW COLUMNS FROM productos')->fetchAll() as $c) {
        $cols[$c['Field']] = true;
    }

    $required = ['id','nombre','descripcion','categoria','estado'];
    foreach ($required as $field) {
        if (!isset($cols[$field])) {
            json_response(['error' => "La tabla productos no contiene el campo obligatorio {$field}. Ejecuta las migraciones SCM."], 500);
        }
    }

    $expr = static function(array $cols, string $field, string $fallback, ?string $alias=null): string {
        $sql = isset($cols[$field]) ? "p.`{$field}`" : $fallback;
        return $alias ? "{$sql} AS `{$alias}`" : $sql;
    };

    $select = [
        'p.id',
        'p.nombre',
        'p.descripcion',
        'p.categoria',
        $expr($cols,'nivel',"''",'nivel'),
        $expr($cols,'duracion',"''",'duracion'),
        $expr($cols,'valoracion','0','valoracion'),
        $expr($cols,'tags',"''",'tags'),
        $expr($cols,'descuento','0','descuento'),
        $expr($cols,'fecha_publicacion','NULL','fecha_publicacion'),
        $expr($cols,'imagen',"'src/primer.jpg'",'imagen'),
        $expr($cols,'precio_venta','0','precio')
    ];

    if (isset($cols['stock_actual'], $cols['stock_minimo'])) {
        $select[] = "CASE
            WHEN p.stock_actual <= 0 THEN 'No disponible'
            WHEN p.stock_actual <= p.stock_minimo THEN 'Pocas licencias'
            ELSE 'Disponible'
        END AS disponibilidad";
    } else {
        $select[] = "'Disponible' AS disponibilidad";
    }

    $sql = 'SELECT ' . implode(', ', $select) . "\nFROM productos p\nWHERE LOWER(TRIM(p.estado)) = 'activo'\nORDER BY p.id ASC";
    $st = $pdo->query($sql);
    $cursos = $st->fetchAll();

    json_response([
        'ok' => true,
        'cursos' => $cursos,
        'total' => count($cursos)
    ]);
} catch (Throwable $e) {
    json_response([
        'error' => 'No fue posible consultar el catálogo público: ' . $e->getMessage()
    ], 500);
}
