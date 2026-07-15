<?php

namespace App\Providers;

use App\Repositories\Contracts\BranchRepositoryInterface;
use App\Repositories\Contracts\CompanyRepositoryInterface;
use App\Repositories\Contracts\CurrencyRepositoryInterface;
use App\Repositories\Contracts\CustomerGroupRepositoryInterface;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Repositories\Contracts\ModuleRepositoryInterface;
use App\Repositories\Contracts\NavigationRepositoryInterface;
use App\Repositories\Contracts\PaymentMethodRepositoryInterface;
use App\Repositories\Contracts\PermissionRepositoryInterface;
use App\Repositories\Contracts\ProductBarcodeRepositoryInterface;
use App\Repositories\Contracts\ProductCategoryRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\ProductUnitRepositoryInterface;
use App\Repositories\Contracts\ProductVariantRepositoryInterface;
use App\Repositories\Contracts\RegisterRepositoryInterface;
use App\Repositories\Contracts\RoleRepositoryInterface;
use App\Repositories\Contracts\SupplierRepositoryInterface;
use App\Repositories\Contracts\TaxRepositoryInterface;
use App\Repositories\Contracts\UnitRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\BranchRepository;
use App\Repositories\Eloquent\CompanyRepository;
use App\Repositories\Eloquent\CurrencyRepository;
use App\Repositories\Eloquent\CustomerGroupRepository;
use App\Repositories\Eloquent\CustomerRepository;
use App\Repositories\Eloquent\ModuleRepository;
use App\Repositories\Eloquent\NavigationRepository;
use App\Repositories\Eloquent\PaymentMethodRepository;
use App\Repositories\Eloquent\PermissionRepository;
use App\Repositories\Eloquent\ProductBarcodeRepository;
use App\Repositories\Eloquent\ProductCategoryRepository;
use App\Repositories\Eloquent\ProductRepository;
use App\Repositories\Eloquent\ProductUnitRepository;
use App\Repositories\Eloquent\ProductVariantRepository;
use App\Repositories\Eloquent\RegisterRepository;
use App\Repositories\Eloquent\RoleRepository;
use App\Repositories\Eloquent\SupplierRepository;
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
        ProductCategoryRepositoryInterface::class => ProductCategoryRepository::class,
        ProductRepositoryInterface::class => ProductRepository::class,
        ProductVariantRepositoryInterface::class => ProductVariantRepository::class,
        ProductUnitRepositoryInterface::class => ProductUnitRepository::class,
        ProductBarcodeRepositoryInterface::class => ProductBarcodeRepository::class,
        SupplierRepositoryInterface::class => SupplierRepository::class,
        CustomerRepositoryInterface::class => CustomerRepository::class,
        CustomerGroupRepositoryInterface::class => CustomerGroupRepository::class,
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
