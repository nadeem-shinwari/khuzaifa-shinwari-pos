<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Lightweight pattern-matching router.
 *
 * Routes are registered as "METHOD /path" with optional "{param}" segments and
 * are matched against the request path. Handlers receive the route parameters
 * as an associative array.
 */
final class Router
{
    /** @var array<int, array{method: string, segments: array<int, string>, handler: callable}> */
    private array $routes = [];

    /**
     * Register a route.
     */
    public function add(string $method, string $path, callable $handler): void
    {
        $this->routes[] = [
            'method' => strtoupper($method),
            'segments' => $this->split($path),
            'handler' => $handler,
        ];
    }

    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function patch(string $path, callable $handler): void
    {
        $this->add('PATCH', $path, $handler);
    }

    public function delete(string $path, callable $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    /**
     * Dispatch the request.
     *
     * Handlers are called as handler(Request $request, array $params).
     *
     * @return array{0: bool, 1: bool} [matchedPath, matchedMethod]
     */
    public function dispatch(string $method, string $path, ?Request $request = null): array
    {
        $segments = $this->split($path);
        $pathMatched = false;

        foreach ($this->routes as $route) {
            $params = $this->match($route['segments'], $segments);
            if ($params === null) {
                continue;
            }

            $pathMatched = true;

            if ($route['method'] !== strtoupper($method)) {
                continue;
            }

            ($route['handler'])($request, $params);

            return [true, true];
        }

        return [$pathMatched, false];
    }

    /**
     * Split a path into trimmed segments.
     *
     * @return array<int, string>
     */
    private function split(string $path): array
    {
        $path = trim($path, '/');

        return $path === '' ? [] : explode('/', $path);
    }

    /**
     * Match route segments against request segments.
     *
     * @param array<int, string> $routeSegments
     * @param array<int, string> $requestSegments
     * @return array<string, string>|null
     */
    private function match(array $routeSegments, array $requestSegments): ?array
    {
        if (count($routeSegments) !== count($requestSegments)) {
            return null;
        }

        $params = [];

        foreach ($routeSegments as $index => $segment) {
            $requestSegment = $requestSegments[$index];

            if (str_starts_with($segment, '{') && str_ends_with($segment, '}')) {
                $params[trim($segment, '{}')] = $requestSegment;
                continue;
            }

            if ($segment !== $requestSegment) {
                return null;
            }
        }

        return $params;
    }
}
