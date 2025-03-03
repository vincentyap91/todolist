<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://vincentyap91.github.io');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../includes/db_config.php';

// 获取请求路径
$request = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// JWT密钥
define('JWT_SECRET', '你的密钥'); // 更改为一个安全的密钥

// 路由处理
$path = parse_url($request, PHP_URL_PATH);
$path = str_replace('/api/', '', $path);

switch($path) {
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
        echo json_encode(['error' => 'Not Found']);
        break;
}

function handleLogin($data) {
    global $db;
    
    if (!isset($data['username']) || !isset($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing credentials']);
        return;
    }

    try {
        $stmt = $db->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$data['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($data['password'], $user['password'])) {
            $token = generateToken($user);
            echo json_encode([
                'token' => $token,
                'user' => [
                    'username' => $user['username'],
                    'role' => $user['role']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
        }
    } catch(PDOException $e) {
        error_log("Login Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Login failed']);
    }
}

function generateToken($user) {
    $payload = [
        'username' => $user['username'],
        'role' => $user['role'],
        'exp' => time() + (24 * 60 * 60)
    ];
    
    return jwt_encode($payload, JWT_SECRET);
}

function verifyToken() {
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        exit;
    }

    $token = str_replace('Bearer ', '', $headers['Authorization']);
    try {
        $decoded = jwt_decode($token, JWT_SECRET);
        if ($decoded['exp'] < time()) {
            http_response_code(401);
            echo json_encode(['error' => 'Token expired']);
            exit;
        }
        return $decoded;
    } catch(Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        exit;
    }
}

function getTodos() {
    global $db;
    $user = verifyToken();
    
    try {
        $stmt = $db->prepare('
            SELECT t.* 
            FROM todos t 
            JOIN users u ON t.user_id = u.id 
            WHERE u.username = ?
            ORDER BY t.created_at DESC
        ');
        $stmt->execute([$user['username']]);
        $todos = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($todos);
    } catch(PDOException $e) {
        error_log("Get Todos Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to get todos']);
    }
}

function createTodo($data) {
    global $db;
    $user = verifyToken();
    
    if (!isset($data['text'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Todo text is required']);
        return;
    }

    try {
        // 获取用户ID
        $stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$user['username']]);
        $userId = $stmt->fetchColumn();

        // 创建待办事项
        $stmt = $db->prepare('
            INSERT INTO todos (user_id, text) 
            VALUES (?, ?)
        ');
        $stmt->execute([$userId, $data['text']]);
        
        $todoId = $db->lastInsertId();
        
        // 返回新创建的待办事项
        $stmt = $db->prepare('SELECT * FROM todos WHERE id = ?');
        $stmt->execute([$todoId]);
        $todo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode($todo);
    } catch(PDOException $e) {
        error_log("Create Todo Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create todo']);
    }
}

function updateTodo($data) {
    global $db;
    $user = verifyToken();
    
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Todo ID is required']);
        return;
    }

    try {
        $stmt = $db->prepare('
            UPDATE todos t
            JOIN users u ON t.user_id = u.id
            SET t.completed = ?, t.text = ?
            WHERE t.id = ? AND u.username = ?
        ');
        $stmt->execute([
            $data['completed'] ?? false,
            $data['text'] ?? '',
            $data['id'],
            $user['username']
        ]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['message' => 'Todo updated successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Todo not found']);
        }
    } catch(PDOException $e) {
        error_log("Update Todo Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update todo']);
    }
}

function deleteTodo($data) {
    global $db;
    $user = verifyToken();
    
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Todo ID is required']);
        return;
    }

    try {
        $stmt = $db->prepare('
            DELETE t FROM todos t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ? AND u.username = ?
        ');
        $stmt->execute([$data['id'], $user['username']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['message' => 'Todo deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Todo not found']);
        }
    } catch(PDOException $e) {
        error_log("Delete Todo Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete todo']);
    }
}

// JWT 辅助函数
function jwt_encode($payload, $secret) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $header = base64_encode($header);
    $payload = base64_encode(json_encode($payload));
    $signature = hash_hmac('sha256', "$header.$payload", $secret, true);
    $signature = base64_encode($signature);
    return "$header.$payload.$signature";
}

function jwt_decode($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new Exception('Invalid token format');
    }
    
    $header = base64_decode($parts[0]);
    $payload = base64_decode($parts[1]);
    $signature = $parts[2];
    
    $valid = hash_hmac('sha256', "$parts[0].$parts[1]", $secret, true);
    $valid = base64_encode($valid);
    
    if ($signature !== $valid) {
        throw new Exception('Invalid signature');
    }
    
    return json_decode($payload, true);
} 