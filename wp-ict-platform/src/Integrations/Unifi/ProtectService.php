<?php

declare(strict_types=1);

namespace ICT_Platform\Integrations\Unifi;

/**
 * UniFi Protect integration API: NVR, cameras, snapshots, PTZ and sensors.
 *
 * @package ICT_Platform\Integrations\Unifi
 * @since   2.2.0
 */
class ProtectService
{
    public function __construct(private UnifiClient $client)
    {
    }

    /**
     * @return array<mixed>
     */
    public function info(): array
    {
        return $this->client->protect('GET', 'meta/info');
    }

    /**
     * @return array<mixed>
     */
    public function nvrs(): array
    {
        return $this->client->protect('GET', 'nvrs');
    }

    /**
     * @return array<mixed>
     */
    public function cameras(): array
    {
        return $this->client->protect('GET', 'cameras');
    }

    /**
     * @return array<mixed>
     */
    public function camera(string $cameraId): array
    {
        return $this->client->protect('GET', "cameras/{$cameraId}");
    }

    /**
     * Current frame from the camera as a data: URL the browser can render directly.
     */
    public function snapshotDataUrl(string $cameraId, bool $highQuality): string
    {
        $image = $this->client->protectBinary(
            "cameras/{$cameraId}/snapshot",
            ['highQuality' => $highQuality ? 'true' : 'false']
        );

        $type = str_starts_with($image['content_type'], 'image/') ? strtok($image['content_type'], ';') : 'image/jpeg';

        return 'data:' . $type . ';base64,' . base64_encode($image['body']);
    }

    public function gotoPtzPreset(string $cameraId, int $slot): void
    {
        $this->client->protect('POST', "cameras/{$cameraId}/ptz/goto/{$slot}");
    }

    /**
     * Create (or return existing) RTSPS stream URLs for the requested qualities.
     *
     * @param string[] $qualities Any of high, medium, low, package.
     * @return array<mixed>
     */
    public function createRtspsStream(string $cameraId, array $qualities): array
    {
        return $this->client->protect('POST', "cameras/{$cameraId}/rtsps-stream", [], ['qualities' => $qualities]);
    }

    /**
     * @return array<mixed>
     */
    public function sensors(): array
    {
        return $this->client->protect('GET', 'sensors');
    }

    /**
     * @return array<mixed>
     */
    public function lights(): array
    {
        return $this->client->protect('GET', 'lights');
    }
}
