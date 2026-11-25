<?php
require_once __DIR__ . '/helpers.php';
$user = require_login();
json_response(['ok' => true, 'usuario' => $user]);
