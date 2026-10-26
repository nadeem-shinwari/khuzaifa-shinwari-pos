<?php

declare(strict_types=1);

namespace App\Core;

final class Request
{
    private ?array $json = null;
    private ?string $apiBasePath = null;

    /**@var string|null=null*/
    private static ?string $cachedApiBasePath = null;

    /** HTTP verb, upper-cased. */
    public function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    /** Path relative to the API root, without a leading slash.
     * @example "v1/system/health"
     */
    public function path(): string
    {
        // When Apache (or the rewrite rule) provides PATH_INFO, prefer it:
        // it is already relative to the API root.
        $pathInfo = $_SERVER['PATH_INFO'] ?? null;
        if (is_string($pathInfo) && $pathInfo !== '') {
            return trim($pathInfo, '/');
        } else {
            $uri = $_SERVER['REQUEST_URI'] ?? '/';
            $path = parse_url($uri, PHP_URL_PATH);
            $path = is_string($path) ? $path : '/';
        }

        if (self::$cachedApiBasePath === null) {
            $script = $_SERVER['SCRIPT_NAME'] ?? '';
            $normalized = str_replace('\\', '/', $script);

            if (str_ends_with($normalized, '/api/index.php')) {
                self::$cachedApiBasePath = substr($normalized, 0, -strlen('/index.php'));
            } elseif (str_ends_with($normalized, '/api')) {
                self::$cachedApiBasePath = substr($normalized, 0, -strlen('/api')) . '/api';
            } else {
                self::$cachedApiBasePath = '';
            }
        }

        $base = self::$cachedApiBasePath;

        if ($base === '' && str_starts_with($path, '/api')) {
            $base = '/api';
        }

        if ($base !== '' && str_starts_with($path, $base)) {
            $path = substr($path, strlen($base));
        }

        $path = trim($path, '/');

        return $path;
    }

    /** The directory the API script lives in, used to strip the prefix. */
    private static function basePath(): string
    {
        $script = $_SERVER['SCRIPT_NAME'] ?? '';
        if ($script === '') {
            return '';
        }

        $base = rtrim(str_replace('\\\\', '/', dirname($script)), '/');

        return $base;
    }

    /** Decoded JSON body (empty array when the body is not JSON). */
    public function json(): array
    {
        if ($this->json !== null) {
            return $this->json;
        }

        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            $this->json = [];

            return $this->json;
        }

        $decoded = json_decode($raw, true);
        $this->json = is_array($decoded) ? $decoded : [];

        return $this->json;
    }

    /** Read a value from the JSON body, falling back to POST then GET. */
    public function input(string $key, mixed $default = null): mixed
    {
        $json = $this->json();
        if (array_key_exists($key, $json)) {
            return $json[$key];
        }

        if (array_key_exists($key, $_POST)) {
            return $_POST[$key];
        }

        if (array_key_exists($key, $_GET)) {
            return $_GET[$key];
        }

        return $default;
    }

    /** Read a trimmed string from the request. */
    public function string(string $key, string $default = ''): string
    {
        $value = $this->input($key, $default);

        if (is_scalar($value)) {
            return trim((string) $value);
        }

        return $default;
    }

    /** Read an integer from the request. */
    public function int(string $key, int $default = 0): int
    {
        $value = $this->input($key, $default);

        return is_numeric($value) ? (int) $value : $default;
    }

    /** Read a float from the request. */
    public function float(string $key, float $default = 0.0): float
    {
        $value = $this->input($key, $default);

        return is_numeric($value) ? (float) $value : $default;
    }

    /** Read a boolean from the request. */
    public function bool(string $key, bool $default = false): bool
    {
        $value = $this->input($key, $default);

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            return in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
        }

        return is_numeric($value) ? ((int) $value) === 1 : $default;
    }

    /** Read an array value from the request. */
    public function array(string $key): array
    {
        $value = $this->input($key, []);

        return is_array($value) ? $value : [];
    }

    /** Query string parameters. */
    public function query(): array
    {
        return $_GET;
    }

    /** Pagination parameters with sane bounds. */
    public function pagination(): array
    {
        $page = max(1, $this->int('page', 1));
        $perPage = $this->int('per_page', 25);
        $perPage = min(200, max(1, $perPage));

        return [
            'page' => $page,
            'per_page' => $perPage,
            'offset' => ($page - 1) * $perPage,
        ];
    }

    /** The client IP address (best effort, used for logging only). */
    public function ip(): string
    {
        return (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    }
}