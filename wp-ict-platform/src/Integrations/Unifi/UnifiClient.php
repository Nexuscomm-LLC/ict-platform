<?php

declare(strict_types=1);

namespace ICT_Platform\Integrations\Unifi;

/**
 * HTTP transport for the UniFi OS console: the Network and Protect integration APIs
 * (X-API-KEY) and the Access developer API (Bearer token on its own port).
 *
 * @package ICT_Platform\Integrations\Unifi
 * @since   2.2.0
 */
class UnifiClient
{
    private const TIMEOUT = 15;

    public function __construct(private UnifiSettings $settings)
    {
    }

    public function settings(): UnifiSettings
    {
        return $this->settings;
    }

    /**
     * @param array<string, mixed>      $query
     * @param array<string, mixed>|null $body
     * @return array<mixed>
     */
    public function network(string $method, string $path, array $query = [], ?array $body = null): array
    {
        return $this->json($method, $this->integrationUrl('network', $path), $this->apiKeyHeaders(), $query, $body);
    }

    /**
     * @param array<string, mixed>      $query
     * @param array<string, mixed>|null $body
     * @return array<mixed>
     */
    public function protect(string $method, string $path, array $query = [], ?array $body = null): array
    {
        return $this->json($method, $this->integrationUrl('protect', $path), $this->apiKeyHeaders(), $query, $body);
    }

    /**
     * Fetch a binary Protect resource (e.g. a camera snapshot).
     *
     * @param array<string, mixed> $query
     * @return array{body: string, content_type: string}
     */
    public function protectBinary(string $path, array $query = []): array
    {
        $response = $this->send('GET', $this->integrationUrl('protect', $path), $this->apiKeyHeaders(), $query, null);

        return [
            'body'         => (string) wp_remote_retrieve_body($response),
            'content_type' => (string) (wp_remote_retrieve_header($response, 'content-type') ?: 'image/jpeg'),
        ];
    }

    /**
     * Access responses wrap results as {code, msg, data}; this returns `data` or throws on a non-SUCCESS code.
     *
     * @param array<string, mixed>      $query
     * @param array<string, mixed>|null $body
     * @return mixed
     */
    public function access(string $method, string $path, array $query = [], ?array $body = null): mixed
    {
        if (!$this->settings->isAccessConfigured()) {
            throw new UnifiException(__('UniFi Access is not configured.', 'ict-platform'));
        }

        $decoded = $this->json(
            $method,
            $this->settings->accessBaseUrl() . '/' . ltrim($path, '/'),
            ['Authorization' => 'Bearer ' . $this->settings->accessToken()],
            $query,
            $body
        );

        if (($decoded['code'] ?? 'SUCCESS') !== 'SUCCESS') {
            throw new UnifiException(sprintf('UniFi Access: %s', $decoded['msg'] ?? $decoded['code']), 400);
        }

        return $decoded['data'] ?? null;
    }

    private function integrationUrl(string $app, string $path): string
    {
        if (!$this->settings->isNetworkConfigured()) {
            throw new UnifiException(__('UniFi console URL and API key are not configured.', 'ict-platform'));
        }

        return sprintf('%s/proxy/%s/integration/v1/%s', $this->settings->consoleUrl(), $app, ltrim($path, '/'));
    }

    /**
     * @return array<string, string>
     */
    private function apiKeyHeaders(): array
    {
        return ['X-API-KEY' => $this->settings->apiKey()];
    }

    /**
     * @param array<string, string>     $headers
     * @param array<string, mixed>      $query
     * @param array<string, mixed>|null $body
     * @return array<mixed>
     */
    private function json(string $method, string $url, array $headers, array $query, ?array $body): array
    {
        $response = $this->send($method, $url, $headers + ['Accept' => 'application/json'], $query, $body);
        $raw = (string) wp_remote_retrieve_body($response);

        if ($raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new UnifiException(__('UniFi console returned an unreadable response.', 'ict-platform'), 502);
        }

        return $decoded;
    }

    /**
     * @param array<string, string>     $headers
     * @param array<string, mixed>      $query
     * @param array<string, mixed>|null $body
     * @return array<mixed> WordPress HTTP response array.
     */
    private function send(string $method, string $url, array $headers, array $query, ?array $body): array
    {
        if ($query !== []) {
            $url = add_query_arg(array_map('rawurlencode', array_map('strval', $query)), $url);
        }

        $args = [
            'method'    => $method,
            'headers'   => $headers,
            'timeout'   => self::TIMEOUT,
            'sslverify' => $this->settings->verifySsl(),
        ];

        if ($body !== null) {
            $args['headers']['Content-Type'] = 'application/json';
            $args['body'] = wp_json_encode($body);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            throw new UnifiException(
                sprintf(__('Could not reach the UniFi console: %s', 'ict-platform'), $response->get_error_message())
            );
        }

        $status = (int) wp_remote_retrieve_response_code($response);
        if ($status >= 400) {
            throw new UnifiException($this->errorMessage($status, (string) wp_remote_retrieve_body($response)), $status);
        }

        return $response;
    }

    private function errorMessage(int $status, string $body): string
    {
        if ($status === 401 || $status === 403) {
            return __('The UniFi console rejected the credentials. Check the API key or Access token.', 'ict-platform');
        }

        $decoded = json_decode($body, true);
        $detail = is_array($decoded) ? ($decoded['message'] ?? $decoded['msg'] ?? $decoded['error'] ?? null) : null;

        return $detail
            ? sprintf('UniFi console error (%d): %s', $status, is_string($detail) ? $detail : wp_json_encode($detail))
            : sprintf('UniFi console error (%d).', $status);
    }
}
