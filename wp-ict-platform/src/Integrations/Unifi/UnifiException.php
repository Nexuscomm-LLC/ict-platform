<?php

declare(strict_types=1);

namespace ICT_Platform\Integrations\Unifi;

use RuntimeException;

/**
 * Raised when a UniFi console request fails or returns an error.
 *
 * @package ICT_Platform\Integrations\Unifi
 * @since   2.2.0
 */
class UnifiException extends RuntimeException
{
    public function __construct(string $message, private int $upstreamStatus = 0)
    {
        parent::__construct($message);
    }

    public function upstreamStatus(): int
    {
        return $this->upstreamStatus;
    }

    /**
     * HTTP status to return to our own API caller. Upstream auth failures become 502 so the
     * browser does not mistake a bad UniFi key for its own expired session.
     */
    public function httpStatus(): int
    {
        return match (true) {
            $this->upstreamStatus === 404 => 404,
            $this->upstreamStatus === 400, $this->upstreamStatus === 422 => 400,
            $this->upstreamStatus === 429 => 429,
            $this->upstreamStatus === 0 => 503,
            default => 502,
        };
    }
}
