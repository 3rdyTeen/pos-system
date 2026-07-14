<?php

namespace App\Services;

use App\Models\Register;
use App\Repositories\Contracts\RegisterRepositoryInterface;

class RegisterService
{
    public function __construct(private readonly RegisterRepositoryInterface $registers) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Register
    {
        return $this->registers->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Register $register, array $data): Register
    {
        return $this->registers->update($register, $data);
    }

    public function delete(Register $register): void
    {
        $this->registers->delete($register);
    }
}
