<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);
// libs/infra (na raiz)
// bootstrap.php (agora na RAIZ)
require_once __DIR__ . '/app/Controllers/Api/AuthController.php';
require_once __DIR__ . '/app/Controllers/Api/PrestadorController.php';
require_once __DIR__ . '/app/Controllers/Api/LojaController.php';
require_once __DIR__ . '/app/Models/User.php';
require_once __DIR__ . '/app/Models/Prestador.php';
require_once __DIR__ . '/app/Models/Loja.php';
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/TokenService.php';

