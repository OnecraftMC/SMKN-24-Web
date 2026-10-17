<?php

namespace App\Support;

use RuntimeException;

final class UploadException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $status,
        public readonly ?int $retryAfter = null,
    ) {
        parent::__construct($message);
    }
}
