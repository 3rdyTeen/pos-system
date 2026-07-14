<?php

namespace App\Providers;

use App\Repositories\Contracts\BranchRepositoryInterface;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use App\Repositories\Contracts\CurrencyRepositoryInterface;
use App\Repositories\Contracts\ModuleRepositoryInterface;
use App\Repositories\Contracts\NavigationRepositoryInterface;
use App\Repositories\Contracts\PaymentMethodRepositoryInterface;
use App\Repositories\Contracts\PermissionRepositoryInterface;
use App\Repositories\Contracts\RegisterRepositoryInterface;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Contracts\TaxRepositoryInterface;
use App\Repositories\Contracts\UnitRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\BranchRepository;
use App\Repositories\Eloquent\CompanyRepository;
use App\Repositories\Eloquent\CurrencyRepository;
use App\Repositories\Eloquent\ModuleRepository;
use App\Repositories\Eloquent\NavigationRepository;
use App\Repositories\Eloquent\PaymentMethodRepository;
use App\Repositories\Eloquent\PermissionRepository;
use App\Repositories\Eloquent\RegisterRepository;
use App\Repositories\Eloquent\RoleRepository;
use App\Repositories\Eloquent\TaxRepository;
use App\Repositories\Eloquent\UnitRepository;
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
        CompanyRepositoryInterface::class => CompanyRepository::class,
        BranchRepositoryInterface::class => BranchRepository::class,
        RegisterRepositoryInterface::class => RegisterRepository::class,
        CurrencyRepositoryInterface::class => CurrencyRepository::class,
        TaxRepositoryInterface::class => TaxRepository::class,
        UnitRepositoryInterface::class => UnitRepository::class,
        PaymentMethodRepositoryInterface::class => PaymentMethodRepository::class,
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
