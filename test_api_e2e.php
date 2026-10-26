<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$base = 'http://localhost/khuzaifa-shinwari/api/v1';
$sessionCookie = '';

function extractSessionCookie(string $headers): string {
    if (preg_match('/^Set-Cookie:\s*(ks_session=[^;]+)/mi', $headers, $m)) {
        return $m[1];
    }
    return '';
}

function http($method, $url, $headers = [], $body = null) {
    global $sessionCookie;
    $allHeaders = $headers;
    if ($sessionCookie !== '') {
        $allHeaders[] = 'Cookie: ' . $sessionCookie;
    }
    if ($body !== null) {
        $allHeaders[] = 'Content-Type: application/json';
    }
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $allHeaders);
    curl_setopt($ch, CURLOPT_HEADER, true);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headerStr = substr($raw, 0, $headerSize);
    $bodyStr = substr($raw, $headerSize);
    curl_close($ch);
    // Keep the latest session cookie alive across requests.
    $found = extractSessionCookie($headerStr);
    if ($found !== '') {
        $sessionCookie = $found;
    }
    return ['code' => $httpCode, 'headers' => $headerStr, 'body' => $bodyStr];
}

// 1. CSRF token (establishes session)
$r = http('GET', "$base/system/csrf");
echo "CSRF: {$r['code']}\nBODY: {$r['body']}\n";
$csrf = null;
$payload = json_decode($r['body'], true);
if (isset($payload['data']['token'])) $csrf = $payload['data']['token'];

// 2. Login
$r = http('POST', "$base/auth/login", ['X-CSRF-Token: ' . $csrf], json_encode(['email' => 'admin@example.com', 'password' => 'Admin1234']));
echo "LOGIN: {$r['code']} " . $r['body'] . "\n";

// 3. Print sale invoice ID 2
$r = http('GET', "$base/sales/2/print", ['X-CSRF-Token: ' . $csrf]);
echo "SALE PRINT 2: {$r['code']}\n";
echo $r['body'] . "\n\n";

// 4. Print purchase invoice ID 1
$r = http('GET', "$base/purchases/1/print", ['X-CSRF-Token: ' . $csrf]);
echo "PURCHASE PRINT 1: {$r['code']}\n";
echo $r['body'] . "\n\n";

// 5. Non-existent invoice
$r = http('GET', "$base/sales/99999/print", ['X-CSRF-Token: ' . $csrf]);
echo "SALE PRINT 99999: {$r['code']} " . $r['body'] . "\n";
?>