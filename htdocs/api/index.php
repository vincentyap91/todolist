<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: *');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 添加测试路由
if ($_SERVER['REQUEST_URI'] === '/api/test') {
    echo json_encode(['status' => 'API is working']);
    exit;
}

require_once '../includes/db_config.php';

// 获取请求路径
$request = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// 记录请求信息
error_log("Request URI: " . $request);
error_log("Request Method: " . $method);

try {
    // 路由处理
    $path = parse_url($request, PHP_URL_PATH);
    $path = str_replace('/api/', '', $path);
    
    error_log("Processed Path: " . $path);

    switch($path) {
        case 'test':
            echo json_encode(['status' => 'API is working']);
            break;

        case 'login':
            if ($method === 'POST') {
                $data = json_decode(file_get_contents('php://input'), true);
                handleLogin($data);
            }
            break;

        case 'todos':
            verifyToken();
            switch($method) {
                case 'GET':
                    getTodos();
                    break;
                case 'POST':
                    $data = json_decode(file_get_contents('php://input'), true);
                    createTodo($data);
                    break;
                case 'PUT':
                    $data = json_decode(file_get_contents('php://input'), true);
                    updateTodo($data);
                    break;
                case 'DELETE':
                    $data = json_decode(file_get_contents('php://input'), true);
                    deleteTodo($data);
                    break;
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Not Found', 'path' => $path]);
            break;
    }
} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server Error: ' . $e->getMessage()]);
}

// ... 其他函数保持不变 ...
?> 