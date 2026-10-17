<?php

namespace App\Http\Middleware;

use App\Support\RemoteDatabaseMutationGuard;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventRemoteDatabaseMutations
{
    public function handle(Request $request, Closure $next): Response
    {
        $connectionName = (string) config('database.default');
        $connections = config('database.connections', []);
        $reason = RemoteDatabaseMutationGuard::requestDenialReason(
            $request->method(),
            (string) config('database.mutation_guard_environment', 'local'),
            is_array($connections) ? $connections : [],
            $connectionName,
            config('database.allow_remote_db_mutations', false),
        );

        return $reason !== null
            ? response()->json(['error' => $reason], 503)
            : $next($request);
    }
}
