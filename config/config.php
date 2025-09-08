<?php
// Ajuste conforme o USBWebserver
return [
  'db' => [
    'host' => '127.0.0.1',   // ou 'localhost'
    'port' => '3306',        // USBWebserver usa 3307 por padrão
    'name' => 'vitrinedoslinks',
    'user' => 'root',
    'pass' => 'usbw',        // padrão do USBWebserver (muitas instalações)
    'charset' => 'utf8mb4',
  ],
  'cors_allowed_origin' => '*',
];
