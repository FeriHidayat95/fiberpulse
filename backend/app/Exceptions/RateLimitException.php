<?php

namespace App\Exceptions;

use Exception;

class RateLimitException extends Exception
{
    protected $retryAfter;

    public function __construct($message = "Rate limit exceeded", $retryAfter = 60, $code = 429, Exception $previous = null)
    {
        $this->retryAfter = $retryAfter;
        parent::__construct($message, $code, $previous);
    }

    public function getRetryAfter()
    {
        return $this->retryAfter;
    }
}
