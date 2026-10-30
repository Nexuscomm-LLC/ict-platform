<?php

declare(strict_types=1);

namespace ICT_Platform\Integrations\Unifi;

/**
 * UniFi console connection settings, persisted in wp_options with secrets encrypted at rest.
 *
 * @package ICT_Platform\Integrations\Unifi
 * @since   2.2.0
 */
class UnifiSettings
{
    public const OPTION = 'ict_unifi_settings';

    private const CIPHER = 'aes-256-cbc';

    private const DEFAULTS = [
        'console_url'  => '',
        'api_key'      => '',
        'access_token' => '',
        'access_port'  => 12445,
        'site_id'      => '',
        'verify_ssl'   => true,
    ];

    /**
     * @var array<string, mixed>
     */
    private array $values;

    public function __construct()
    {
        $stored = get_option(self::OPTION, []);
        $this->values = array_merge(self::DEFAULTS, is_array($stored) ? $stored : []);
    }

    public function consoleUrl(): string
    {
        return rtrim((string) $this->values['console_url'], '/');
    }

    public function apiKey(): string
    {
        return $this->decrypt((string) $this->values['api_key']);
    }

    public function accessToken(): string
    {
        return $this->decrypt((string) $this->values['access_token']);
    }

    public function accessPort(): int
    {
        return (int) $this->values['access_port'];
    }

    public function siteId(): string
    {
        return (string) $this->values['site_id'];
    }

    public function verifySsl(): bool
    {
        return (bool) $this->values['verify_ssl'];
    }

    public function isNetworkConfigured(): bool
    {
        return $this->consoleUrl() !== '' && $this->apiKey() !== '';
    }

    public function isAccessConfigured(): bool
    {
        return $this->consoleUrl() !== '' && $this->accessToken() !== '';
    }

    /**
     * Base URL of the Access developer API, which listens on its own port of the console host.
     */
    public function accessBaseUrl(): string
    {
        $host = (string) wp_parse_url($this->consoleUrl(), PHP_URL_HOST);

        return sprintf('https://%s:%d/api/v1/developer', $host, $this->accessPort());
    }

    /**
     * Settings safe to return to the browser: secrets are reduced to "is set" flags.
     *
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'console_url'      => $this->consoleUrl(),
            'access_port'      => $this->accessPort(),
            'site_id'          => $this->siteId(),
            'verify_ssl'       => $this->verifySsl(),
            'has_api_key'      => $this->apiKey() !== '',
            'has_access_token' => $this->accessToken() !== '',
        ];
    }

    /**
     * Merge and persist updated settings. Empty secret fields keep the stored secret.
     *
     * @param array<string, mixed> $input
     * @return true|string True on success, or an error message.
     */
    public function update(array $input): bool|string
    {
        if (array_key_exists('console_url', $input)) {
            $url = esc_url_raw(trim((string) $input['console_url']), ['https', 'http']);
            if ($url === '' && trim((string) $input['console_url']) !== '') {
                return __('Console URL must be a valid http(s) URL.', 'ict-platform');
            }
            $this->values['console_url'] = rtrim($url, '/');
        }

        foreach (['api_key', 'access_token'] as $secret) {
            if (!empty($input[$secret])) {
                $this->values[$secret] = $this->encrypt(sanitize_text_field((string) $input[$secret]));
            }
            if (!empty($input['clear_' . $secret])) {
                $this->values[$secret] = '';
            }
        }

        if (isset($input['access_port'])) {
            $port = (int) $input['access_port'];
            if ($port < 1 || $port > 65535) {
                return __('Access port must be between 1 and 65535.', 'ict-platform');
            }
            $this->values['access_port'] = $port;
        }

        if (array_key_exists('site_id', $input)) {
            $this->values['site_id'] = sanitize_text_field((string) $input['site_id']);
        }

        if (array_key_exists('verify_ssl', $input)) {
            $this->values['verify_ssl'] = filter_var($input['verify_ssl'], FILTER_VALIDATE_BOOLEAN);
        }

        update_option(self::OPTION, $this->values, false);

        return true;
    }

    private function encrypt(string $plain): string
    {
        if ($plain === '' || !function_exists('openssl_encrypt')) {
            return $plain;
        }

        $iv = random_bytes(openssl_cipher_iv_length(self::CIPHER));
        $cipher = openssl_encrypt($plain, self::CIPHER, $this->key(), OPENSSL_RAW_DATA, $iv);

        return 'v1:' . base64_encode($iv . $cipher);
    }

    private function decrypt(string $stored): string
    {
        if (!str_starts_with($stored, 'v1:') || !function_exists('openssl_decrypt')) {
            return $stored;
        }

        $raw = base64_decode(substr($stored, 3), true);
        $ivLength = openssl_cipher_iv_length(self::CIPHER);
        if ($raw === false || strlen($raw) <= $ivLength) {
            return '';
        }

        $plain = openssl_decrypt(substr($raw, $ivLength), self::CIPHER, $this->key(), OPENSSL_RAW_DATA, substr($raw, 0, $ivLength));

        return $plain === false ? '' : $plain;
    }

    private function key(): string
    {
        return hash('sha256', wp_salt('auth'), true);
    }
}
