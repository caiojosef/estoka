<?php
class Validator {
  public static function email(string $email): bool {
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
  }

  public static function cpf(string $cpf): bool {
    // remove não dígitos
    $cpf = preg_replace('/\D/', '', $cpf ?? '');
    if (strlen($cpf) !== 11) return false;
    if (preg_match('/^(\d)\1{10}$/', $cpf)) return false;

    // dígitos verificadores
    for ($t = 9; $t < 11; $t++) {
      $sum = 0;
      for ($i = 0; $i < $t; $i++) $sum += $cpf[$i] * (($t + 1) - $i);
      $d = ((10 * $sum) % 11) % 10;
      if ($cpf[$t] != $d) return false;
    }
    return true;
  }

  public static function required(array $data, array $fields): array {
    $errors = [];
    foreach ($fields as $f) {
      if (!isset($data[$f]) || trim((string)$data[$f]) === '') {
        $errors[$f] = 'Campo obrigatório';
      }
    }
    return $errors;
  }

  public static function cep(string $cep): bool {
    $cep = preg_replace('/\D/', '', $cep ?? '');
    return strlen($cep) === 8;
  }

  public static function uf(string $uf): bool {
    return (bool) preg_match('/^[A-Z]{2}$/', strtoupper($uf ?? ''));
  }
}
