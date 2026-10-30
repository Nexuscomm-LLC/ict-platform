<?php

declare(strict_types=1);

namespace ICT_Platform\Integrations\Unifi;

/**
 * UniFi Network integration API: sites, devices, clients and hotspot vouchers.
 *
 * @package ICT_Platform\Integrations\Unifi
 * @since   2.2.0
 */
class NetworkService
{
    private const PAGE_SIZE = 200;

    private const MAX_PAGES = 10;

    public function __construct(private UnifiClient $client)
    {
    }

    /**
     * @return array<mixed>
     */
    public function info(): array
    {
        return $this->client->network('GET', 'info');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function sites(): array
    {
        return $this->collect('sites');
    }

    /**
     * Requested site, else the configured site, else the console's first site.
     */
    public function resolveSiteId(?string $requested = null): string
    {
        if ($requested) {
            return $requested;
        }

        $configured = $this->client->settings()->siteId();
        if ($configured !== '') {
            return $configured;
        }

        $sites = $this->sites();
        if (empty($sites[0]['id'])) {
            throw new UnifiException(__('No UniFi Network sites were found on this console.', 'ict-platform'), 404);
        }

        return (string) $sites[0]['id'];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function devices(string $siteId): array
    {
        return $this->collect("sites/{$siteId}/devices");
    }

    /**
     * Device detail merged with its latest statistics (uptime, CPU, memory, uplink rates).
     *
     * @return array<string, mixed>
     */
    public function device(string $siteId, string $deviceId): array
    {
        $device = $this->client->network('GET', "sites/{$siteId}/devices/{$deviceId}");

        try {
            $device['statistics'] = $this->client->network('GET', "sites/{$siteId}/devices/{$deviceId}/statistics/latest");
        } catch (UnifiException) {
            $device['statistics'] = null;
        }

        return $device;
    }

    public function restartDevice(string $siteId, string $deviceId): void
    {
        $this->client->network('POST', "sites/{$siteId}/devices/{$deviceId}/actions", [], ['action' => 'RESTART']);
    }

    public function powerCyclePort(string $siteId, string $deviceId, int $portIdx): void
    {
        $this->client->network(
            'POST',
            "sites/{$siteId}/devices/{$deviceId}/interfaces/ports/{$portIdx}/actions",
            [],
            ['action' => 'POWER_CYCLE']
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function clients(string $siteId): array
    {
        return $this->collect("sites/{$siteId}/clients");
    }

    public function setGuestAccess(string $siteId, string $clientId, bool $authorize): void
    {
        $this->client->network(
            'POST',
            "sites/{$siteId}/clients/{$clientId}/actions",
            [],
            ['action' => $authorize ? 'AUTHORIZE_GUEST_ACCESS' : 'UNAUTHORIZE_GUEST_ACCESS']
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function vouchers(string $siteId): array
    {
        return $this->collect("sites/{$siteId}/hotspot/vouchers");
    }

    /**
     * @param array<string, mixed> $voucher name, count, timeLimitMinutes and optional limits.
     * @return array<mixed>
     */
    public function createVouchers(string $siteId, array $voucher): array
    {
        return $this->client->network('POST', "sites/{$siteId}/hotspot/vouchers", [], $voucher);
    }

    public function deleteVoucher(string $siteId, string $voucherId): void
    {
        $this->client->network('DELETE', "sites/{$siteId}/hotspot/vouchers/{$voucherId}");
    }

    /**
     * Walk the integration API's offset pagination.
     *
     * @return array<int, array<string, mixed>>
     */
    private function collect(string $path): array
    {
        $items = [];
        $offset = 0;

        for ($page = 0; $page < self::MAX_PAGES; $page++) {
            $response = $this->client->network('GET', $path, ['offset' => $offset, 'limit' => self::PAGE_SIZE]);
            $batch = $response['data'] ?? [];
            $items = array_merge($items, $batch);
            $offset += count($batch);

            if ($batch === [] || $offset >= (int) ($response['totalCount'] ?? 0)) {
                break;
            }
        }

        return $items;
    }
}
