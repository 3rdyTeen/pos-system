<?php

namespace App\Providers;

use App\Repositories\Contracts\ModuleRepositoryInterface;
use App\Repositories\Contracts\NavigationRepositoryInterface;
use App\Repositories\Contracts\PermissionRepositoryInterface;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\ModuleRepository;
use App\Repositories\Eloquent\NavigationRepository;
use App\Repositories\Eloquent\PermissionRepository;
use App\Repositories\Eloquent\RoleRepository;
use App\Repositories\Eloquent\UserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Bind each repository contract to its Eloquent implementation so consumers
     * (Services, Controllers) depend only on the interfaces.
     *
     * @var array<class-string, class-string>
     */
    private const BINDINGS = [
        RoleRepositoryInterface::class => RoleRepository::class,
        UserRepositoryInterface::class => UserRepository::class,
        ModuleRepositoryInterface::class => ModuleRepository::class,
        PermissionRepositoryInterface::class => PermissionRepository::class,
        NavigationRepositoryInterface::class => NavigationRepository::class,
    ];

    /**
     * Register repository bindings.
     */
    public function register(): void
    {
        foreach (self::BINDINGS as $contract => $implementation) {
            $this->app->bind($contract, $implementation);
        }
    }
}
