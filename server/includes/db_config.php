<?php
define('DB_HOST', 'sql201.infinityfree.com');
define('DB_NAME', 'if0_38413720_todolist');
define('DB_USER', 'if0_38413720');
define('DB_PASS', '6XOHT6R9FxK');

try {
    $db = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME, DB_USER, DB_PASS);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    error_log("Database Error: " . $e->getMessage());
    die(json_encode(['error' => 'Database connection failed']));
}
?> 