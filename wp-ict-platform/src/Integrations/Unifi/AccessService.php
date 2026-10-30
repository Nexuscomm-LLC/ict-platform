<?php

declare(strict_types=1);

namespace ICT_Platform\Integrations\Unifi;

/**
 * UniFi Access developer API: doors, lock rules, devices, users and door-opening logs.
 *
 * @package ICT_Platform\Integrations\Unifi
 * @since   2.2.0
 */
class AccessService
{
    public const LOCK_RULES = ['keep_lock', 'keep_unlock', 'custom', 'reset', 'lock_early'];

    public function __construct(private UnifiClient $client)
    {
    }

    /**
     * @return array<mixed>
     */
    public function doors(): array
    {
        return (array) $this->client->access('GET', 'doors');
    }

    /**
     * Remote unlock; the actor name appears in Access's own door-opening log.
     */
    public function unlockDoor(string $doorId, string $actorId, string $actorName): void
    {
        $this->client->access('PUT', "doors/{$doorId}/unlock", [], [
            'actor_id'   => $actorId,
            'actor_name' => $actorName,
        ]);
    }

    /**
     * @return array<mixed>
     */
    public function lockRule(string $doorId): array
    {
        return (array) $this->client->access('GET', "doors/{$doorId}/lock_rule");
    }

    /**
     * @param int $intervalMinutes Required for the "custom" rule (temporary unlock duration).
     */
    public function setLockRule(string $doorId, string $type, int $intervalMinutes = 0): void
    {
        $body = ['type' => $type];
        if ($type === 'custom') {
            $body['interval'] = $intervalMinutes;
        }

        $this->client->access('PUT', "doors/{$doorId}/lock_rule", [], $body);
    }

    /**
     * Access groups devices per hub; flatten to a single list.
     *
     * @return array<int, array<string, mixed>>
     */
    public function devices(): array
    {
        $devices = [];
        foreach ((array) $this->client->access('GET', 'devices') as $entry) {
            if (is_array($entry) && array_is_list($entry)) {
                array_push($devices, ...$entry);
            } elseif (is_array($entry)) {
                $devices[] = $entry;
            }
        }

        return $devices;
    }

    /**
     * @return array<mixed>
     */
    public function users(int $page, int $perPage): array
    {
        return (array) $this->client->access('GET', 'users', ['page_num' => $page, 'page_size' => $perPage]);
    }

    /**
     * Door-opening events in a time window (unix seconds).
     *
     * @return array<mixed>
     */
    public function doorOpenings(int $since, int $until, int $page, int $perPage): array
    {
        return (array) $this->client->access(
            'POST',
            'system/logs',
            ['page_num' => $page, 'page_size' => $perPage],
            ['topic' => 'door_openings', 'since' => $since, 'until' => $until]
        );
    }
}
