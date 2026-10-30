<?php

declare(strict_types=1);

namespace ICT_Platform\Api\Controllers;

use ICT_Platform\Integrations\Unifi\AccessService;
use ICT_Platform\Integrations\Unifi\NetworkService;
use ICT_Platform\Integrations\Unifi\ProtectService;
use ICT_Platform\Integrations\Unifi\UnifiClient;
use ICT_Platform\Integrations\Unifi\UnifiException;
use ICT_Platform\Util\Cache;
use ICT_Platform\Util\Helper;
use Throwable;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * UniFi Network, Protect and Access management.
 *
 * Proxies the UniFi console APIs so credentials stay server-side. Read routes need
 * project or integration rights; control actions (restart, unlock, PTZ, vouchers) need
 * integration rights and are written to the activity log.
 *
 * @package ICT_Platform\Api\Controllers
 * @since   2.2.0
 */
class UnifiController extends AbstractController
{
    private const ID = '(?P<id>[A-Za-z0-9_\-]+)';

    protected $rest_base = 'unifi';

    private NetworkService $network;

    private ProtectService $protect;

    private AccessService $access;

    public function __construct(Helper $helper, Cache $cache, private UnifiClient $client)
    {
        parent::__construct($helper, $cache);
        $this->network = new NetworkService($client);
        $this->protect = new ProtectService($client);
        $this->access = new AccessService($client);
    }

    public function registerRoutes(): void
    {
        $view = [$this, 'canView'];
        $control = [$this, 'canControl'];
        $configure = [$this, 'canConfigure'];

        $this->route('/settings', WP_REST_Server::READABLE, 'getSettings', $configure);
        $this->route('/settings', WP_REST_Server::EDITABLE, 'updateSettings', $configure);
        $this->route('/status', WP_REST_Server::READABLE, 'getStatus', $view);

        // Network
        $this->route('/network/sites', WP_REST_Server::READABLE, 'getSites', $view);
        $this->route('/network/devices', WP_REST_Server::READABLE, 'getDevices', $view);
        $this->route('/network/devices/' . self::ID, WP_REST_Server::READABLE, 'getDevice', $view);
        $this->route('/network/devices/' . self::ID . '/restart', WP_REST_Server::CREATABLE, 'restartDevice', $control);
        $this->route(
            '/network/devices/' . self::ID . '/ports/(?P<port>\d+)/power-cycle',
            WP_REST_Server::CREATABLE,
            'powerCyclePort',
            $control
        );
        $this->route('/network/clients', WP_REST_Server::READABLE, 'getClients', $view);
        $this->route('/network/clients/' . self::ID . '/guest-access', WP_REST_Server::CREATABLE, 'setGuestAccess', $control);
        $this->route('/network/vouchers', WP_REST_Server::READABLE, 'getVouchers', $view);
        $this->route('/network/vouchers', WP_REST_Server::CREATABLE, 'createVouchers', $control);
        $this->route('/network/vouchers/' . self::ID, WP_REST_Server::DELETABLE, 'deleteVoucher', $control);

        // Protect
        $this->route('/protect/nvrs', WP_REST_Server::READABLE, 'getNvrs', $view);
        $this->route('/protect/cameras', WP_REST_Server::READABLE, 'getCameras', $view);
        $this->route('/protect/cameras/' . self::ID, WP_REST_Server::READABLE, 'getCamera', $view);
        $this->route('/protect/cameras/' . self::ID . '/snapshot', WP_REST_Server::READABLE, 'getSnapshot', $view);
        $this->route('/protect/cameras/' . self::ID . '/ptz/(?P<slot>\d+)', WP_REST_Server::CREATABLE, 'gotoPtzPreset', $control);
        $this->route('/protect/cameras/' . self::ID . '/rtsps-stream', WP_REST_Server::CREATABLE, 'createRtspsStream', $control);
        $this->route('/protect/sensors', WP_REST_Server::READABLE, 'getSensors', $view);
        $this->route('/protect/lights', WP_REST_Server::READABLE, 'getLights', $view);

        // Access
        $this->route('/access/doors', WP_REST_Server::READABLE, 'getDoors', $view);
        $this->route('/access/doors/' . self::ID . '/unlock', WP_REST_Server::CREATABLE, 'unlockDoor', $control);
        $this->route('/access/doors/' . self::ID . '/lock-rule', WP_REST_Server::READABLE, 'getLockRule', $view);
        $this->route('/access/doors/' . self::ID . '/lock-rule', WP_REST_Server::EDITABLE, 'setLockRule', $control);
        $this->route('/access/devices', WP_REST_Server::READABLE, 'getAccessDevices', $view);
        $this->route('/access/users', WP_REST_Server::READABLE, 'getAccessUsers', $view);
        $this->route('/access/logs', WP_REST_Server::READABLE, 'getAccessLogs', $view);
    }

    public function canView(): bool
    {
        return current_user_can('manage_options')
            || current_user_can('manage_ict_integrations')
            || current_user_can('manage_ict_projects');
    }

    public function canControl(): bool
    {
        return current_user_can('manage_options') || current_user_can('manage_ict_integrations');
    }

    public function canConfigure(): bool
    {
        return current_user_can('manage_options');
    }

    // ---- Settings & status -------------------------------------------------

    public function getSettings(): WP_REST_Response
    {
        return $this->success($this->client->settings()->toPublicArray());
    }

    public function updateSettings(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $result = $this->client->settings()->update((array) $request->get_json_params());
        if ($result !== true) {
            return $this->error('invalid_unifi_settings', $result, 400);
        }

        $this->audit('settings_updated', 'unifi_settings', 'UniFi settings', 'Updated UniFi console connection settings');

        return $this->success($this->client->settings()->toPublicArray());
    }

    /**
     * Reachability and version of each UniFi application; doubles as a connection test.
     */
    public function getStatus(): WP_REST_Response
    {
        $settings = $this->client->settings();

        $probe = function (bool $configured, callable $call): array {
            if (!$configured) {
                return ['configured' => false, 'reachable' => false, 'version' => null, 'error' => null];
            }
            try {
                return ['configured' => true, 'reachable' => true, 'version' => $call(), 'error' => null];
            } catch (UnifiException $e) {
                return ['configured' => true, 'reachable' => false, 'version' => null, 'error' => $e->getMessage()];
            }
        };

        return $this->success([
            'network' => $probe($settings->isNetworkConfigured(), fn () => $this->network->info()['applicationVersion'] ?? null),
            'protect' => $probe($settings->isNetworkConfigured(), fn () => $this->protect->info()['applicationVersion'] ?? null),
            'access'  => $probe($settings->isAccessConfigured(), function () {
                $this->access->doors();
                return null;
            }),
        ]);
    }

    // ---- Network -----------------------------------------------------------

    public function getSites(): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->network->sites());
    }

    public function getDevices(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->network->devices($this->siteId($request)));
    }

    public function getDevice(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->network->device($this->siteId($request), $request['id']));
    }

    public function restartDevice(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return $this->run(function () use ($request) {
            $this->network->restartDevice($this->siteId($request), $request['id']);
            $this->audit('restart', 'unifi_device', $request['id'], 'Restarted UniFi device');
            return ['restarted' => true];
        });
    }

    public function powerCyclePort(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return $this->run(function () use ($request) {
            $port = (int) $request['port'];
            $this->network->powerCyclePort($this->siteId($request), $request['id'], $port);
            $this->audit('power_cycle', 'unifi_device', $request['id'], "Power-cycled PoE port {$port}");
            return ['power_cycled' => true, 'port' => $port];
        });
    }

    public function getClients(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->network->clients($this->siteId($request)));
    }

    public function setGuestAccess(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $authorize = filter_var($request->get_param('authorize') ?? true, FILTER_VALIDATE_BOOLEAN);

        return $this->run(function () use ($request, $authorize) {
            $this->network->setGuestAccess($this->siteId($request), $request['id'], $authorize);
            $this->audit(
                $authorize ? 'guest_authorize' : 'guest_unauthorize',
                'unifi_client',
                $request['id'],
                $authorize ? 'Authorized guest access' : 'Revoked guest access'
            );
            return ['authorized' => $authorize];
        });
    }

    public function getVouchers(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->network->vouchers($this->siteId($request)));
    }

    public function createVouchers(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $name = sanitize_text_field((string) $request->get_param('name'));
        $count = (int) ($request->get_param('count') ?? 1);
        $minutes = (int) $request->get_param('timeLimitMinutes');

        if ($name === '' || $count < 1 || $count > 1000 || $minutes < 1) {
            return $this->error(
                'invalid_voucher',
                __('Vouchers need a name, a count between 1 and 1000, and a time limit in minutes.', 'ict-platform'),
                400
            );
        }

        $voucher = ['name' => $name, 'count' => $count, 'timeLimitMinutes' => $minutes];
        foreach (['authorizedGuestLimit', 'dataUsageLimitMBytes', 'rxRateLimitKbps', 'txRateLimitKbps'] as $limit) {
            $value = (int) $request->get_param($limit);
            if ($value > 0) {
                $voucher[$limit] = $value;
            }
        }

        return $this->run(function () use ($request, $voucher) {
            $created = $this->network->createVouchers($this->siteId($request), $voucher);
            $this->audit('create', 'unifi_voucher', $voucher['name'], "Created {$voucher['count']} hotspot voucher(s)");
            return $created;
        }, 201);
    }

    public function deleteVoucher(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return $this->run(function () use ($request) {
            $this->network->deleteVoucher($this->siteId($request), $request['id']);
            $this->audit('delete', 'unifi_voucher', $request['id'], 'Deleted hotspot voucher');
            return ['deleted' => true];
        });
    }

    // ---- Protect -----------------------------------------------------------

    public function getNvrs(): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->protect->nvrs());
    }

    public function getCameras(): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->protect->cameras());
    }

    public function getCamera(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->protect->camera($request['id']));
    }

    public function getSnapshot(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $highQuality = filter_var($request->get_param('high_quality'), FILTER_VALIDATE_BOOLEAN);

        return $this->run(fn () => [
            'image'       => $this->protect->snapshotDataUrl($request['id'], $highQuality),
            'captured_at' => gmdate('c'),
        ]);
    }

    public function gotoPtzPreset(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return $this->run(function () use ($request) {
            $slot = (int) $request['slot'];
            $this->protect->gotoPtzPreset($request['id'], $slot);
            $this->audit('ptz_preset', 'unifi_camera', $request['id'], "Moved camera to PTZ preset {$slot}");
            return ['preset' => $slot];
        });
    }

    public function createRtspsStream(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $allowed = ['high', 'medium', 'low', 'package'];
        $qualities = array_values(array_intersect((array) ($request->get_param('qualities') ?: ['high']), $allowed));
        if ($qualities === []) {
            return $this->error('invalid_quality', __('Quality must be one of high, medium, low, package.', 'ict-platform'), 400);
        }

        return $this->run(function () use ($request, $qualities) {
            $streams = $this->protect->createRtspsStream($request['id'], $qualities);
            $this->audit('stream_create', 'unifi_camera', $request['id'], 'Created RTSPS stream (' . implode(', ', $qualities) . ')');
            return $streams;
        });
    }

    public function getSensors(): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->protect->sensors());
    }

    public function getLights(): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->protect->lights());
    }

    // ---- Access ------------------------------------------------------------

    public function getDoors(): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->access->doors());
    }

    public function unlockDoor(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $user = wp_get_current_user();

        return $this->run(function () use ($request, $user) {
            $this->access->unlockDoor($request['id'], 'ict-' . $user->ID, $user->display_name ?: 'ICT Platform');
            $this->audit('unlock', 'unifi_door', $request['id'], 'Remotely unlocked door');
            return ['unlocked' => true];
        });
    }

    public function getLockRule(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->access->lockRule($request['id']));
    }

    public function setLockRule(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $type = (string) $request->get_param('type');
        $interval = (int) $request->get_param('interval');

        if (!in_array($type, AccessService::LOCK_RULES, true)) {
            return $this->error(
                'invalid_lock_rule',
                sprintf(__('Lock rule must be one of: %s.', 'ict-platform'), implode(', ', AccessService::LOCK_RULES)),
                400
            );
        }
        if ($type === 'custom' && ($interval < 1 || $interval > 1440)) {
            return $this->error('invalid_interval', __('A custom unlock needs an interval of 1–1440 minutes.', 'ict-platform'), 400);
        }

        return $this->run(function () use ($request, $type, $interval) {
            $this->access->setLockRule($request['id'], $type, $interval);
            $detail = $type === 'custom' ? "custom ({$interval} min)" : $type;
            $this->audit('lock_rule', 'unifi_door', $request['id'], "Set door lock rule: {$detail}");
            return ['type' => $type, 'interval' => $type === 'custom' ? $interval : null];
        });
    }

    public function getAccessDevices(): WP_REST_Response|WP_Error
    {
        return $this->run(fn () => $this->access->devices());
    }

    public function getAccessUsers(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $pagination = $this->getPaginationParams($request);

        return $this->run(fn () => $this->access->users($pagination['page'], $pagination['per_page']));
    }

    public function getAccessLogs(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $pagination = $this->getPaginationParams($request);
        $until = (int) ($request->get_param('until') ?: time());
        $since = (int) ($request->get_param('since') ?: $until - DAY_IN_SECONDS);

        if ($since >= $until) {
            return $this->error('invalid_range', __('"since" must be earlier than "until".', 'ict-platform'), 400);
        }

        return $this->run(fn () => $this->access->doorOpenings($since, $until, $pagination['page'], $pagination['per_page']));
    }

    // ---- Helpers -----------------------------------------------------------

    private function route(string $path, string $methods, string $callback, callable $permission): void
    {
        register_rest_route($this->namespace, '/' . $this->rest_base . $path, [
            'methods'             => $methods,
            'callback'            => [$this, $callback],
            'permission_callback' => $permission,
        ]);
    }

    private function siteId(WP_REST_Request $request): string
    {
        $requested = sanitize_text_field((string) $request->get_param('site_id'));
        if ($requested !== '' && !preg_match('/^[A-Za-z0-9_\-]+$/', $requested)) {
            throw new UnifiException(__('Invalid site ID.', 'ict-platform'), 400);
        }

        return $this->network->resolveSiteId($requested ?: null);
    }

    private function run(callable $call, int $status = 200): WP_REST_Response|WP_Error
    {
        try {
            return $this->success($call(), $status);
        } catch (UnifiException $e) {
            return $this->error('unifi_error', $e->getMessage(), $e->httpStatus());
        }
    }

    private function audit(string $action, string $entityType, string $entityName, string $description): void
    {
        if (!defined('ICT_ACTIVITY_LOG_TABLE')) {
            return;
        }

        global $wpdb;

        try {
            $wpdb->insert(ICT_ACTIVITY_LOG_TABLE, [
                'user_id'     => get_current_user_id(),
                'action'      => $action,
                'entity_type' => $entityType,
                'entity_name' => $entityName,
                'description' => $description,
                'ip_address'  => isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : null,
                'user_agent'  => isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT'])) : null,
                'created_at'  => current_time('mysql'),
            ]);
        } catch (Throwable) {
            // An audit-log failure must not undo an action the console already performed.
        }
    }
}
