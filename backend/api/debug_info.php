<?php
// Debug script to check server variables
header('Content-Type: text/plain');
echo "SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'not set') . "\n";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'not set') . "\n";
echo "PHP_SELF: " . ($_SERVER['PHP_SELF'] ?? 'not set') . "\n";
echo "DOCUMENT_ROOT: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'not set') . "\n";
echo "\nFull PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'not set') . "\n";

// Calculate base path like Request does
$script = $_SERVER['SCRIPT_NAME'] ?? '';
if ($script === '') {
    $base = '';
} else {
    $base = rtrim(str_replace('\\\\', '/', dirname($script)), '/');
}
echo "\nCalculated basePath: '$base'\n";
echo "basePath length: " . strlen($base) . "\n";

// Now calculate what path() would return
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH);
$path = is_string($path) ? $path : '/';
echo "Original path from REQUEST_URI: '$path'\n";

if ($base !== '' && str_starts_with($path, $base)) {
    $path = substr($path, strlen($base));
    echo "After stripping base: '$path'\n";
}

$path = trim($path, '/');
echo "After trim('/'): '$path'\n";