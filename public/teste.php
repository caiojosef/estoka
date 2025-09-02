<?php
$cfg = require __DIR__ . '/../config/config.php';
$dsn = "mysql:host={$cfg['db']['host']};port={$cfg['db']['port']};dbname={$cfg['db']['name']};charset={$cfg['db']['charset']}";
try {
    new PDO($dsn, $cfg['db']['user'], $cfg['db']['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "OK";
} catch (Throwable $e) {
    echo $e->getMessage();
}
