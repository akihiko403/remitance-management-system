<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (Permissions::all() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        foreach (Permissions::roleMatrix() as $roleName => $permissions) {
            Role::findOrCreate($roleName, 'web')->syncPermissions($permissions);
        }

        Setting::setValue('organization_name', 'KGBI');
        Setting::setValue('system_name', 'Fightline');
        Setting::setValue('support_email', 'finance@kgbi.local');
        Setting::setValue('support_phone', '+63 917 000 1200');
        Setting::setValue('finance_note', 'All shortage settlements are tracked per event and consolidated per person across the full ledger.');
        Setting::setValue('branding_crest_path', asset('branding/kgbi-crest.png'));

        $users = collect([
            ['name' => 'KGBI Super Admin', 'email' => 'admin@kgbi.local', 'job_title' => 'System Administrator', 'role' => 'super-admin'],
            ['name' => 'KGBI Finance Admin', 'email' => 'finance@kgbi.local', 'job_title' => 'Finance Controller', 'role' => 'finance-admin'],
            ['name' => 'KGBI Encoder', 'email' => 'encoder@kgbi.local', 'job_title' => 'Data Encoder', 'role' => 'encoder'],
            ['name' => 'KGBI Auditor', 'email' => 'auditor@kgbi.local', 'job_title' => 'Audit Officer', 'role' => 'auditor'],
            ['name' => 'KGBI Viewer', 'email' => 'viewer@kgbi.local', 'job_title' => 'Executive Viewer', 'role' => 'viewer'],
        ])->map(function (array $userData) {
            $user = User::query()->updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'phone' => '+63 917 555 010'.fake()->numberBetween(1, 9),
                    'job_title' => $userData['job_title'],
                    'is_active' => true,
                    'last_login_at' => now()->subDays(fake()->numberBetween(0, 5)),
                    'email_verified_at' => now(),
                    'password' => Hash::make('password'),
                ]
            );

            $user->syncRoles([$userData['role']]);

            return $user;
        });

        $admin = $users->first();

        $this->call(MasterlistSeeder::class);

        $admin->update(['last_login_at' => now()]);
    }
}
