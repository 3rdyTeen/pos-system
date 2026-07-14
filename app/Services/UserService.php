<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserService
{
    private const AVATAR_DIR = 'avatars';

    private const DISK = 'public';

    public function __construct(private readonly UserRepositoryInterface $users) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?UploadedFile $image = null): User
    {
        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        if ($image) {
            $data['profile_image_url'] = $this->storeImage($image);
        }

        return $this->users->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data, ?UploadedFile $image = null): User
    {
        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if ($image) {
            $this->deleteImage($user->profile_image_url);
            $data['profile_image_url'] = $this->storeImage($image);
        }

        return $this->users->update($user, $data);
    }

    public function toggle(User $user): User
    {
        return $this->users->update($user, ['is_enabled' => ! $user->is_enabled]);
    }

    public function delete(User $user): void
    {
        $this->users->delete($user);
    }

    /**
     * Store an avatar on the public disk and return its public URL.
     */
    private function storeImage(UploadedFile $image): string
    {
        $path = $image->store(self::AVATAR_DIR, self::DISK);

        return Storage::disk(self::DISK)->url($path);
    }

    /**
     * Remove a previously stored avatar given its public URL.
     */
    private function deleteImage(?string $url): void
    {
        if (! $url) {
            return;
        }

        $path = str_replace(Storage::disk(self::DISK)->url(''), '', $url);
        $path = ltrim($path, '/');

        if ($path && Storage::disk(self::DISK)->exists($path)) {
            Storage::disk(self::DISK)->delete($path);
        }
    }
}
