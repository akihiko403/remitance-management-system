<?php

namespace Database\Seeders;

use App\Models\Person;
use Illuminate\Database\Seeder;

class MasterlistSeeder extends Seeder
{
    public function run(): void
    {
        $people = [
            ['code' => 'P-1001', 'nickname' => 'Ace', 'first_name' => 'Adrian', 'last_name' => 'Salazar', 'province' => 'South Cotabato'],
            ['code' => 'P-1002', 'nickname' => 'Ben', 'first_name' => 'Benjamin', 'last_name' => 'Dela Cruz', 'province' => 'Sultan Kudarat'],
            ['code' => 'P-1003', 'nickname' => 'Cathy', 'first_name' => 'Catherine', 'last_name' => 'Fernandez', 'province' => 'General Santos'],
            ['code' => 'P-1004', 'nickname' => 'Dex', 'first_name' => 'Dexter', 'last_name' => 'Mendoza', 'province' => 'Sarangani'],
            ['code' => 'P-1005', 'nickname' => 'Eli', 'first_name' => 'Elijah', 'last_name' => 'Torres', 'province' => 'Davao del Sur'],
            ['code' => 'P-1006', 'nickname' => 'Faith', 'first_name' => 'Faith', 'last_name' => 'Ramos', 'province' => 'Cotabato'],
            ['code' => 'P-1007', 'nickname' => 'Geo', 'first_name' => 'George', 'last_name' => 'Aquino', 'province' => 'North Cotabato'],
            ['code' => 'P-1008', 'nickname' => 'Hana', 'first_name' => 'Hannah', 'last_name' => 'Castillo', 'province' => 'Davao City'],
            ['code' => 'P-1009', 'nickname' => 'Ian', 'first_name' => 'Ian', 'last_name' => 'Morales', 'province' => 'Koronadal'],
            ['code' => 'P-1010', 'nickname' => 'Jules', 'first_name' => 'Julian', 'last_name' => 'Navarro', 'province' => 'Tacurong'],
            ['code' => 'P-1011', 'nickname' => 'Kai', 'first_name' => 'Karl', 'last_name' => 'Bautista', 'province' => 'Kidapawan'],
            ['code' => 'P-1012', 'nickname' => 'Lia', 'first_name' => 'Lia', 'last_name' => 'Villanueva', 'province' => 'Digos'],
            ['code' => 'P-1013', 'nickname' => 'Migs', 'first_name' => 'Miguel', 'last_name' => 'Soriano', 'province' => 'Mati'],
            ['code' => 'P-1014', 'nickname' => 'Nina', 'first_name' => 'Nina', 'last_name' => 'Valdez', 'province' => 'Isulan'],
            ['code' => 'P-1015', 'nickname' => 'Owen', 'first_name' => 'Owen', 'last_name' => 'Garcia', 'province' => 'Malaybalay'],
            ['code' => 'P-1016', 'nickname' => 'Pau', 'first_name' => 'Paulo', 'last_name' => 'Domingo', 'province' => 'Butuan'],
            ['code' => 'P-1017', 'nickname' => 'Que', 'first_name' => 'Queenie', 'last_name' => 'Lopez', 'province' => 'Surallah'],
            ['code' => 'P-1018', 'nickname' => 'Renz', 'first_name' => 'Lorenzo', 'last_name' => 'Reyes', 'province' => 'Pagadian'],
            ['code' => 'P-1019', 'nickname' => 'Sam', 'first_name' => 'Samantha', 'last_name' => 'Manalo', 'province' => 'Zamboanga del Sur'],
            ['code' => 'P-1020', 'nickname' => 'Toni', 'first_name' => 'Antonette', 'last_name' => 'De Vera', 'province' => 'Marbel'],
            ['code' => 'P-1021', 'nickname' => 'Uno', 'first_name' => 'Uno', 'last_name' => 'Campos', 'province' => 'Polomolok'],
            ['code' => 'P-1022', 'nickname' => 'Vince', 'first_name' => 'Vincent', 'last_name' => 'Santos', 'province' => 'Midsayap'],
            ['code' => 'P-1023', 'nickname' => 'Wyn', 'first_name' => 'Wynona', 'last_name' => 'Alvarez', 'province' => 'Bansalan'],
            ['code' => 'P-1024', 'nickname' => 'Xan', 'first_name' => 'Xander', 'last_name' => 'Flores', 'province' => 'Panabo'],
            ['code' => 'P-1025', 'nickname' => 'Ysa', 'first_name' => 'Ysabel', 'last_name' => 'Pineda', 'province' => 'Tagum'],
            ['code' => 'P-1026', 'nickname' => 'Zed', 'first_name' => 'Zedrick', 'last_name' => 'Lim', 'province' => 'Valencia'],
            ['code' => 'P-1027', 'nickname' => 'Aira', 'first_name' => 'Aira', 'last_name' => 'Rosales', 'province' => 'Davao Oriental'],
            ['code' => 'P-1028', 'nickname' => 'Bong', 'first_name' => 'Bonifacio', 'last_name' => 'Padilla', 'province' => 'Bukidnon'],
            ['code' => 'P-1029', 'nickname' => 'Cris', 'first_name' => 'Cristina', 'last_name' => 'Yap', 'province' => 'Cotabato City'],
            ['code' => 'P-1030', 'nickname' => 'Dani', 'first_name' => 'Danica', 'last_name' => 'Estrada', 'province' => 'Zamboanga Sibugay'],
        ];

        foreach ($people as $index => $personData) {
            Person::query()->updateOrCreate(
                ['code' => $personData['code']],
                [
                    ...$personData,
                    'phone' => '+63 917 100 '.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                    'email' => 'masterlist'.($index + 1).'@kgbi.local',
                    'address' => 'Barangay '.($index + 1).', Finance Operations District',
                    'notes' => 'Seeded masterlist profile',
                    'is_active' => true,
                ]
            );
        }
    }
}
