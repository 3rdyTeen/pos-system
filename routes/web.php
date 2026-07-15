<?php

use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\CompanyController;
use App\Http\Controllers\Api\CurrencyController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\CustomerGroupController;
use App\Http\Controllers\Api\ModuleController;
use App\Http\Controllers\Api\NavigationController;
use App\Http\Controllers\Api\PaymentMethodController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ProductBarcodeController;
use App\Http\Controllers\Api\ProductCategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductUnitController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TaxController;
use App\Http\Controllers\Api\UnitController;
use App\Http\Controllers\Api\UserController;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    // Dashboard stays ungated (landing page for every authenticated user).
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Page routes gated dynamically by the navigations table -> {module.code}.view.
    Route::middleware('module.access')->group(function () {
        Route::get('modules', fn () => Inertia::render('modules'))->name('modules');
        Route::get('permissions', fn () => Inertia::render('permissions'))->name('permissions');
        Route::get('navigations', fn () => Inertia::render('navigations'))->name('navigations');
        Route::get('roles', fn () => Inertia::render('roles'))->name('roles');
        Route::get('users', fn () => Inertia::render('users'))->name('users');

        // Organization module pages (Companies / Branches / Registers).
        Route::get('companies', fn () => Inertia::render('companies'))->name('companies');
        Route::get('branches', fn () => Inertia::render('branches'))->name('branches');
        Route::get('registers', fn () => Inertia::render('registers'))->name('registers');

        // System Settings module pages (Taxes / Units / Payment Methods / Currencies).
        Route::get('taxes', fn () => Inertia::render('taxes'))->name('taxes');
        Route::get('units', fn () => Inertia::render('units'))->name('units');
        Route::get('payment-methods', fn () => Inertia::render('payment-methods'))->name('payment-methods');
        Route::get('currencies', fn () => Inertia::render('currencies'))->name('currencies');

        // Catalog module pages (Products / Categories).
        Route::get('products', fn () => Inertia::render('products'))->name('products');
        Route::get('products/{product}', function (Product $product) {
            return Inertia::render('product-detail', [
                'product' => ProductResource::make($product->load(['company', 'category', 'baseUnit', 'tax'])),
            ]);
        })->name('products.show');
        Route::get('product-categories', fn () => Inertia::render('product-categories'))->name('product-categories');

        // Suppliers / Customers.
        Route::get('suppliers', fn () => Inertia::render('suppliers'))->name('suppliers');
        Route::get('customers', fn () => Inertia::render('customers'))->name('customers');

        // Demo business-module landing pages (seeded modules Inventory/Sales/Reports).
        Route::get('inventory', fn () => Inertia::render('placeholder', ['module' => 'Inventory']))->name('inventory');
        Route::get('sales', fn () => Inertia::render('placeholder', ['module' => 'Sales']))->name('sales');
        Route::get('reports', fn () => Inertia::render('placeholder', ['module' => 'Reports']))->name('reports');
    });

    // JSON API consumed by TanStack Query (shares the Inertia session + CSRF).
    Route::prefix('api')->name('api.')->group(function () {
        Route::get('roles/enabled', [RoleController::class, 'enabled'])->name('roles.enabled');
        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
        Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
        Route::get('roles/{role}/permissions', [RoleController::class, 'permissions'])->name('roles.permissions');
        Route::post('roles/{role}/permissions', [RoleController::class, 'savePermissions'])->name('roles.permissions.save');
        Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
        Route::patch('roles/{role}/toggle', [RoleController::class, 'toggle'])->name('roles.toggle');
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');

        Route::get('users', [UserController::class, 'index'])->name('users.index');
        Route::post('users', [UserController::class, 'store'])->name('users.store');
        Route::put('users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::patch('users/{user}/toggle', [UserController::class, 'toggle'])->name('users.toggle');
        Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        Route::get('modules/enabled', [ModuleController::class, 'enabled'])->name('modules.enabled');
        Route::get('modules', [ModuleController::class, 'index'])->name('modules.index');
        Route::post('modules', [ModuleController::class, 'store'])->name('modules.store');
        Route::put('modules/{module}', [ModuleController::class, 'update'])->name('modules.update');
        Route::patch('modules/{module}/toggle', [ModuleController::class, 'toggle'])->name('modules.toggle');
        Route::delete('modules/{module}', [ModuleController::class, 'destroy'])->name('modules.destroy');

        Route::get('permissions/enabled', [PermissionController::class, 'enabled'])->name('permissions.enabled');
        Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');
        Route::post('permissions', [PermissionController::class, 'store'])->name('permissions.store');
        Route::put('permissions/{permission}', [PermissionController::class, 'update'])->name('permissions.update');
        Route::patch('permissions/{permission}/toggle', [PermissionController::class, 'toggle'])->name('permissions.toggle');
        Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy');

        Route::get('navigations', [NavigationController::class, 'index'])->name('navigations.index');
        Route::post('navigations', [NavigationController::class, 'store'])->name('navigations.store');
        Route::put('navigations/{navigation}', [NavigationController::class, 'update'])->name('navigations.update');
        Route::delete('navigations/{navigation}', [NavigationController::class, 'destroy'])->name('navigations.destroy');

        Route::get('companies/options', [CompanyController::class, 'options'])->name('companies.options');
        Route::get('companies', [CompanyController::class, 'index'])->name('companies.index');
        Route::post('companies', [CompanyController::class, 'store'])->name('companies.store');
        Route::put('companies/{company}', [CompanyController::class, 'update'])->name('companies.update');
        Route::delete('companies/{company}', [CompanyController::class, 'destroy'])->name('companies.destroy');

        Route::get('branches/options', [BranchController::class, 'options'])->name('branches.options');
        Route::get('branches', [BranchController::class, 'index'])->name('branches.index');
        Route::post('branches', [BranchController::class, 'store'])->name('branches.store');
        Route::put('branches/{branch}', [BranchController::class, 'update'])->name('branches.update');
        Route::delete('branches/{branch}', [BranchController::class, 'destroy'])->name('branches.destroy');

        Route::get('registers', [RegisterController::class, 'index'])->name('registers.index');
        Route::post('registers', [RegisterController::class, 'store'])->name('registers.store');
        Route::put('registers/{register}', [RegisterController::class, 'update'])->name('registers.update');
        Route::delete('registers/{register}', [RegisterController::class, 'destroy'])->name('registers.destroy');

        Route::get('taxes/options', [TaxController::class, 'options'])->name('taxes.options');
        Route::get('taxes', [TaxController::class, 'index'])->name('taxes.index');
        Route::post('taxes', [TaxController::class, 'store'])->name('taxes.store');
        Route::put('taxes/{tax}', [TaxController::class, 'update'])->name('taxes.update');
        Route::delete('taxes/{tax}', [TaxController::class, 'destroy'])->name('taxes.destroy');

        Route::get('units/options', [UnitController::class, 'options'])->name('units.options');
        Route::get('units', [UnitController::class, 'index'])->name('units.index');
        Route::post('units', [UnitController::class, 'store'])->name('units.store');
        Route::put('units/{unit}', [UnitController::class, 'update'])->name('units.update');
        Route::delete('units/{unit}', [UnitController::class, 'destroy'])->name('units.destroy');

        Route::get('payment-methods', [PaymentMethodController::class, 'index'])->name('payment-methods.index');
        Route::post('payment-methods', [PaymentMethodController::class, 'store'])->name('payment-methods.store');
        Route::put('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update'])->name('payment-methods.update');
        Route::delete('payment-methods/{paymentMethod}', [PaymentMethodController::class, 'destroy'])->name('payment-methods.destroy');

        Route::get('currencies', [CurrencyController::class, 'index'])->name('currencies.index');
        Route::post('currencies', [CurrencyController::class, 'store'])->name('currencies.store');
        Route::put('currencies/{currency}', [CurrencyController::class, 'update'])->name('currencies.update');
        Route::delete('currencies/{currency}', [CurrencyController::class, 'destroy'])->name('currencies.destroy');

        Route::get('product-categories/options', [ProductCategoryController::class, 'options'])->name('product-categories.options');
        Route::get('product-categories', [ProductCategoryController::class, 'index'])->name('product-categories.index');
        Route::post('product-categories', [ProductCategoryController::class, 'store'])->name('product-categories.store');
        Route::put('product-categories/{productCategory}', [ProductCategoryController::class, 'update'])->name('product-categories.update');
        Route::delete('product-categories/{productCategory}', [ProductCategoryController::class, 'destroy'])->name('product-categories.destroy');

        Route::get('suppliers/options', [SupplierController::class, 'options'])->name('suppliers.options');
        Route::get('suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
        Route::post('suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
        Route::put('suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
        Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

        // Customer groups back the customer form's dropdown only (no CRUD page yet).
        Route::get('customer-groups/options', [CustomerGroupController::class, 'options'])->name('customer-groups.options');

        Route::get('customers/options', [CustomerController::class, 'options'])->name('customers.options');
        Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
        Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
        Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
        Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');

        Route::get('products', [ProductController::class, 'index'])->name('products.index');
        Route::post('products', [ProductController::class, 'store'])->name('products.store');
        Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

        // Per-product sub-entities (managed on the product detail page).
        Route::get('products/{product}/variants', [ProductVariantController::class, 'index'])->name('products.variants.index');
        Route::post('products/{product}/variants', [ProductVariantController::class, 'store'])->name('products.variants.store');
        Route::put('product-variants/{productVariant}', [ProductVariantController::class, 'update'])->name('product-variants.update');
        Route::delete('product-variants/{productVariant}', [ProductVariantController::class, 'destroy'])->name('product-variants.destroy');

        Route::get('products/{product}/units', [ProductUnitController::class, 'index'])->name('products.units.index');
        Route::post('products/{product}/units', [ProductUnitController::class, 'store'])->name('products.units.store');
        Route::put('product-units/{productUnit}', [ProductUnitController::class, 'update'])->name('product-units.update');
        Route::delete('product-units/{productUnit}', [ProductUnitController::class, 'destroy'])->name('product-units.destroy');

        Route::get('products/{product}/barcodes', [ProductBarcodeController::class, 'index'])->name('products.barcodes.index');
        Route::post('products/{product}/barcodes', [ProductBarcodeController::class, 'store'])->name('products.barcodes.store');
        Route::put('product-barcodes/{productBarcode}', [ProductBarcodeController::class, 'update'])->name('product-barcodes.update');
        Route::delete('product-barcodes/{productBarcode}', [ProductBarcodeController::class, 'destroy'])->name('product-barcodes.destroy');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
