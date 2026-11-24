<?php
require_once __DIR__ . '/helpers.php';
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_response(['error' => 'Método no permitido.'], 405);
json_response(['ok' => true, 'csrf_token' => csrf_token()]);
