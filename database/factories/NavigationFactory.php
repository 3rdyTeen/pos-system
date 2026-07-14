<?php

namespace Database\Factories;

use App\Models\Module;
use App\Models\Navigation;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Navigation>
 */
class NavigationFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);
        $code = Str::slug($name);

        return [
            'module_id' => Module::factory(),
            'parent_id' => null,
            'name' => ucfirst($name),
            'code' => $code,
            'icon' => 'circle',
            'url' => '/'.$code,
            'order' => 0,
        ];
    }
}
