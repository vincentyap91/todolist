<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

define('DB_HOST', 'sql201.infinityfree.com');
define('DB_NAME', 'if0_38413720_todolist');
define('DB_USER', 'if0_38413720');
define('DB_PASS', '6XOHT6R9FxK');

try {
    $db = new PDO(
        "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        array(
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        )
    );
} catch(PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}
?> 