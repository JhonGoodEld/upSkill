<?php
require_once __DIR__ . '/scm_helpers.php';
require_scm_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Método no permitido.'], 405);
}

if (!isset($_FILES['imagen']) || !is_uploaded_file($_FILES['imagen']['tmp_name'])) {
    json_response(['error' => 'Selecciona una imagen válida.'], 422);
}

$file = $_FILES['imagen'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    json_response(['error' => 'No fue posible recibir la imagen. Código: ' . $file['error']], 422);
}
if ($file['size'] <= 0 || $file['size'] > 5 * 1024 * 1024) {
    json_response(['error' => 'La imagen debe pesar máximo 5 MB.'], 422);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
$allowed = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif'
];
if (!isset($allowed[$mime])) {
    json_response(['error' => 'Formato no permitido. Usa JPG, PNG, WEBP o GIF.'], 422);
}

$dir = realpath(__DIR__ . '/../src');
if ($dir === false) json_response(['error' => 'No se encontró la carpeta src.'], 500);
$dir .= DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'cursos';
if (!is_dir($dir) && !mkdir($dir, 0775, true)) {
    json_response(['error' => 'No fue posible crear la carpeta de imágenes.'], 500);
}

$name = 'curso_' . date('Ymd_His') . '_' . bin2hex(random_bytes(5)) . '.' . $allowed[$mime];
$dest = $dir . DIRECTORY_SEPARATOR . $name;
if (!move_uploaded_file($file['tmp_name'], $dest)) {
    json_response(['error' => 'No fue posible guardar la imagen en el servidor.'], 500);
}

json_response([
    'ok' => true,
    'imagen' => 'src/uploads/cursos/' . $name,
    'mensaje' => 'Imagen cargada correctamente.'
], 201);
