# PROMPT PARA CLAUDE CODE: Construcción de "Pump Tracker" desde cero

> **Instrucción principal:** Construye la aplicación completa "Pump Tracker" siguiendo este documento de principio a fin. Implementa cada sección en orden. No omitas ningún paso. Si un archivo ya existe, modifícalo en lugar de crearlo de nuevo.

---

## 1. Contexto del Proyecto

**Pump Tracker** es una aplicación web para el control diario de horas de trabajo de bombas de lodo en taladros de perforación petrolera. Reemplaza un formulario Excel con código **FGOP-XXXX** que los equipos de campo llenan manualmente.

### Problema que resuelve
- El Excel se pierde, se corrompe o no se sincroniza entre turnos (día/noche).
- No hay alertas automáticas cuando los componentes superan sus horas límite.
- No se puede consultar el historial de mantenimiento de forma centralizada.
- El personal de campo trabaja en zonas sin internet → necesita modo offline.

### Usuarios del sistema
| Rol | Descripción | Permisos clave |
|-----|-------------|----------------|
| `admin` | Administrador del sistema | Acceso total, gestiona taladros, usuarios y reportes globales |
| `rig_manager` | Jefe de equipo del taladro | Gestiona su taladro, aprueba cambios de componentes |
| `supervisor` | Supervisor de turno (día/noche) | Crea y edita registros diarios de su taladro |
| `encuellador` | Encuellador de turno | Crea registros diarios, ve alertas de su taladro |

### Flujo principal
1. Cada día (o cada turno), un supervisor/encuellador abre el formulario de registro diario para su bomba.
2. Ingresa las horas trabajadas en el día.
3. El sistema calcula automáticamente las horas acumuladas de cada componente (camisa, pistón, módulos de succión/descarga, válvulas, asientos).
4. Si un componente fue reemplazado, marca el checkbox "cambio" e ingresa el nuevo serial.
5. El sistema guarda el registro, genera alertas si algún componente supera los umbrales, y permite exportar a PDF en formato FGOP-XXXX.

---

## 2. Estructura del Formulario Excel (FGOP-XXXX)

El Excel original tiene esta estructura. La aplicación debe replicarla fielmente, especialmente en el PDF exportado.

### Encabezado del formulario
```
FGOP-XXXX
CONTROL DE HORAS DE TRABAJO DE BOMBAS DE LODO
TALADRO: [nombre]    POZO: [nombre]    MES/AÑO: [mes/año]
JEFE DE EQUIPO: [nombre]    SUPERVISOR DÍA: [nombre]    SUPERVISOR NOCHE: [nombre]
ENCUELLADOR DÍA: [nombre]   ENCUELLADOR NOCHE: [nombre]
BOMBA N°: [número]   MARCA: [marca]   MODELO: [modelo]   SERIAL: [serial]
LINER: [diámetro liner]
```

### Tabla principal (orientación horizontal / landscape)

Cada bomba triplex tiene 3 posiciones: **Izquierda (I)**, **Medio (M)**, **Derecha (D)**.
Cada posición tiene 4 componentes: Camisa, Pistón, Módulo Succión, Válvula Succión, Asiento Succión, Módulo Descarga, Válvula Descarga, Asiento Descarga = **8 componentes × 3 posiciones = 24 componentes por bomba**.

Adicionalmente, la tabla lleva una columna de **Amortiguador (dampener pressure)**.

| DÍA | HRS DÍA | HRS ACUM | DAMPENER | CAMISA (I) | PISTÓN (I) | MOD SUC (I) | VAL SUC (I) | AST SUC (I) | MOD DESC (I) | VAL DESC (I) | AST DESC (I) | CAMISA (M) | ... | CAMISA (D) | ... | COMENTARIOS |
|-----|---------|----------|----------|------------|------------|-------------|-------------|-------------|--------------|--------------|--------------|------------|-----|------------|-----|-------------|
| 1   | 12.0    | 12.0     | 350      | 12.0       | 12.0       | 12.0        | 12.0        | 12.0        | 12.0         | 12.0         | 12.0         | 12.0       | ... | 12.0       | ... |             |
| 2   | 24.0    | 36.0     | 360      | 36.0       | 36.0       | 36.0        | 36.0        | 36.0        | 36.0         | 36.0         | 36.0         | 36.0       | ... | 36.0       | ... |             |

**Reglas de colores en el PDF:**
- **Amarillo:** fila con comentarios.
- **Naranja:** componente en umbral de advertencia (warning).
- **Rojo:** componente en umbral crítico (critical).
- **Verde (negrita):** fila donde hubo cambio de componente (serial nuevo registrado).

---

## 3. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Laravel | 11.x |
| Frontend | Blade + Livewire | 3.x |
| Interactividad | Alpine.js | 3.x (incluido con Livewire) |
| Base de datos | MySQL | 8.x (XAMPP/WAMP local) |
| Auth | Laravel Breeze | Blade driver |
| UI | Tailwind CSS | 3.x |
| Componentes | Flux UI o Blade personalizados | - |
| PDF | barryvdh/laravel-dompdf | ^3.0 |
| Gráficos | Chart.js | vía CDN |
| Offline/PWA | service-worker.js personalizado | - |
| Validación | Laravel Form Requests | - |
| Iconos | Heroicons | vía Blade |

---

## 4. Setup Inicial

### 4.1 Crear el proyecto

```bash
composer create-project laravel/laravel pump-tracker
cd pump-tracker
```

### 4.2 Instalar dependencias PHP

```bash
composer require livewire/livewire barryvdh/laravel-dompdf laravel/breeze
php artisan breeze:install blade
```

### 4.3 Instalar dependencias JS y compilar assets

```bash
npm install && npm run build
```

### 4.4 Configurar `.env` para MySQL local (XAMPP/WAMP)

```dotenv
APP_NAME="Pump Tracker"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pump_tracker
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
QUEUE_CONNECTION=sync
CACHE_STORE=file
```

### 4.5 Crear la base de datos

Ejecutar en MySQL/phpMyAdmin:
```sql
CREATE DATABASE pump_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4.6 Generar APP_KEY

```bash
php artisan key:generate
```

---

## 5. Database Schema — Migraciones MySQL

Crea todas las migraciones en el orden exacto indicado para respetar las claves foráneas.

### 5.1 Migración: `create_rigs_table`

```php
<?php
// database/migrations/xxxx_create_rigs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rigs', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('location', 150)->nullable();
            $table->string('manager', 150)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rigs');
    }
};
```

### 5.2 Migración: `create_wells_table`

```php
<?php
// database/migrations/xxxx_create_wells_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wells', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rig_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->string('field', 100)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wells');
    }
};
```

### 5.3 Migración: `create_pumps_table`

```php
<?php
// database/migrations/xxxx_create_pumps_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pumps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rig_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('number')->comment('Número de la bomba: 1, 2, 3...');
            $table->string('brand', 100)->nullable();
            $table->string('model', 100)->nullable();
            $table->string('serial', 100)->nullable();
            $table->decimal('liner_diameter', 5, 2)->nullable()->comment('Diámetro del liner en pulgadas');
            $table->decimal('base_accumulated_hours', 10, 2)->default(0.00)
                ->comment('Horas acumuladas iniciales al crear la bomba en el sistema');
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['rig_id', 'number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pumps');
    }
};
```

### 5.4 Migración: `create_pump_assemblies_table`

```php
<?php
// database/migrations/xxxx_create_pump_assemblies_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pump_assemblies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pump_id')->constrained()->cascadeOnDelete();
            $table->enum('position', ['left', 'middle', 'right'])
                ->comment('Posición del conjunto: left=Izquierda, middle=Medio, right=Derecha');
            $table->timestamps();

            $table->unique(['pump_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pump_assemblies');
    }
};
```

### 5.5 Migración: `create_assembly_components_table`

```php
<?php
// database/migrations/xxxx_create_assembly_components_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assembly_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assembly_id')
                ->constrained('pump_assemblies')
                ->cascadeOnDelete();
            $table->string('type', 30)
                ->comment('Tipo: camisa, piston, suction_module, suction_valve, suction_seat, discharge_module, discharge_valve, discharge_seat');
            $table->string('serial', 100)->nullable()->comment('Serial actual del componente instalado');
            $table->decimal('installed_at_hours', 10, 2)->default(0.00)
                ->comment('Horas acumuladas de la bomba cuando se instaló este componente');
            $table->decimal('alert_threshold_warning', 10, 2)->nullable()
                ->comment('Horas de advertencia, NULL = usar config/thresholds.php');
            $table->decimal('alert_threshold_critical', 10, 2)->nullable()
                ->comment('Horas críticas, NULL = usar config/thresholds.php');
            $table->timestamps();

            $table->unique(['assembly_id', 'type']);
            $table->index('assembly_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assembly_components');
    }
};
```

### 5.6 Migración: `create_pump_personnel_table`

```php
<?php
// database/migrations/xxxx_create_pump_personnel_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pump_personnel', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pump_id')->constrained()->cascadeOnDelete();
            $table->date('period_start')->comment('Inicio del período al que corresponde este personal');
            $table->string('rig_manager', 150)->nullable();
            $table->string('supervisor_day', 150)->nullable();
            $table->string('supervisor_night', 150)->nullable();
            $table->string('encuellador_day', 150)->nullable();
            $table->string('encuellador_night', 150)->nullable();
            $table->timestamps();

            $table->index(['pump_id', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pump_personnel');
    }
};
```

### 5.7 Migración: `create_daily_logs_table`

```php
<?php
// database/migrations/xxxx_create_daily_logs_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pump_id')->constrained()->cascadeOnDelete();
            $table->foreignId('well_id')->nullable()->constrained()->nullOnDelete();
            $table->date('log_date');
            $table->unsignedTinyInteger('day_number')
                ->comment('Número de día dentro del mes o del pozo: 1–31');
            $table->decimal('hours_worked', 5, 2)
                ->comment('Horas trabajadas en este día/turno');
            $table->decimal('accumulated_hours', 10, 2)
                ->comment('Horas acumuladas totales de la bomba hasta este registro');
            $table->unsignedInteger('dampener_pressure')->default(0)
                ->comment('Presión del amortiguador en PSI');
            $table->text('comments')->nullable();
            $table->boolean('synced')->default(true)
                ->comment('false = guardado offline pendiente de sincronización');
            $table->timestamps();

            // Índices para consultas frecuentes
            $table->index(['pump_id', 'log_date']);
            $table->unique(['pump_id', 'log_date'], 'unique_pump_log_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_logs');
    }
};
```

### 5.8 Migración: `create_component_hours_table`

```php
<?php
// database/migrations/xxxx_create_component_hours_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('component_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_log_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('component_id')
                ->constrained('assembly_components')
                ->cascadeOnDelete();
            $table->decimal('hours_accumulated', 10, 2)
                ->comment('Horas acumuladas del componente hasta este registro');
            $table->timestamps();

            // Índices para consultas frecuentes
            $table->index('daily_log_id');
            $table->index('component_id');
            $table->unique(['daily_log_id', 'component_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('component_hours');
    }
};
```

### 5.9 Migración: `create_maintenance_events_table`

```php
<?php
// database/migrations/xxxx_create_maintenance_events_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_log_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();
            $table->foreignId('component_id')
                ->constrained('assembly_components')
                ->cascadeOnDelete();
            $table->string('event_type', 50)
                ->comment('Tipo: replacement=cambio de componente, inspection=inspección, repair=reparación');
            $table->decimal('hours_before', 10, 2)
                ->comment('Horas acumuladas del componente antes del evento');
            $table->string('new_serial', 100)->nullable()
                ->comment('Nuevo serial instalado (en caso de reemplazo)');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['component_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_events');
    }
};
```

### 5.10 Migración: Agregar columnas `role` y `rig_id` a `users`

```php
<?php
// database/migrations/xxxx_add_role_and_rig_to_users_table.php

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'rig_manager', 'supervisor', 'encuellador'])
                ->default('supervisor')
                ->after('email');
            $table->foreignId('rig_id')
                ->nullable()
                ->after('role')
                ->constrained()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['rig_id']);
            $table->dropColumn(['role', 'rig_id']);
        });
    }
};
```

---

## 6. Configuración de Umbrales de Alerta

Crea el archivo `config/thresholds.php`:

```php
<?php
// config/thresholds.php

/**
 * Umbrales de horas para alertas de componentes de bombas de lodo.
 * - warning: horas en que el componente entra en estado de advertencia (naranja).
 * - critical: horas en que el componente entra en estado crítico (rojo).
 *
 * Estos valores son los valores globales por defecto.
 * Cada componente puede sobreescribir sus propios umbrales en assembly_components.
 */
return [
    'camisa' => [
        'warning'  => 800,
        'critical' => 1000,
    ],
    'piston' => [
        'warning'  => 800,
        'critical' => 1000,
    ],
    'suction_module' => [
        'warning'  => 1400,
        'critical' => 1800,
    ],
    'suction_valve' => [
        'warning'  => 1400,
        'critical' => 1800,
    ],
    'suction_seat' => [
        'warning'  => 1400,
        'critical' => 1800,
    ],
    'discharge_module' => [
        'warning'  => 1800,
        'critical' => 2000,
    ],
    'discharge_valve' => [
        'warning'  => 1400,
        'critical' => 1800,
    ],
    'discharge_seat' => [
        'warning'  => 700,
        'critical' => 900,
    ],
];
```

También crear el archivo de etiquetas para traducción:

```php
<?php
// config/component_labels.php

return [
    'camisa'           => 'Camisa',
    'piston'           => 'Pistón',
    'suction_module'   => 'Mod. Succión',
    'suction_valve'    => 'Vál. Succión',
    'suction_seat'     => 'Ast. Succión',
    'discharge_module' => 'Mod. Descarga',
    'discharge_valve'  => 'Vál. Descarga',
    'discharge_seat'   => 'Ast. Descarga',
];
```

---

## 7. Modelos Eloquent y Relaciones

### 7.1 Modelo `Rig`

```php
<?php
// app/Models/Rig.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rig extends Model
{
    protected $fillable = ['name', 'location', 'manager', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function wells(): HasMany
    {
        return $this->hasMany(Well::class);
    }

    public function pumps(): HasMany
    {
        return $this->hasMany(Pump::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** Retorna el pozo activo actual (el más recientemente asociado) */
    public function activeWell(): ?Well
    {
        return $this->wells()->where('active', true)->latest()->first();
    }
}
```

### 7.2 Modelo `Well`

```php
<?php
// app/Models/Well.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Well extends Model
{
    protected $fillable = ['rig_id', 'name', 'field', 'active'];

    protected $casts = [
        'active' => 'boolean',
    ];

    public function rig(): BelongsTo
    {
        return $this->belongsTo(Rig::class);
    }

    public function dailyLogs(): HasMany
    {
        return $this->hasMany(DailyLog::class);
    }
}
```

### 7.3 Modelo `Pump`

```php
<?php
// app/Models/Pump.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pump extends Model
{
    protected $fillable = [
        'rig_id', 'number', 'brand', 'model',
        'serial', 'liner_diameter', 'base_accumulated_hours', 'active',
    ];

    protected $casts = [
        'liner_diameter'         => 'decimal:2',
        'base_accumulated_hours' => 'decimal:2',
        'active'                 => 'boolean',
    ];

    public function rig(): BelongsTo
    {
        return $this->belongsTo(Rig::class);
    }

    public function assemblies(): HasMany
    {
        return $this->hasMany(PumpAssembly::class);
    }

    public function dailyLogs(): HasMany
    {
        return $this->hasMany(DailyLog::class)->orderBy('log_date');
    }

    /** Último registro de personal activo */
    public function latestPersonnel(): HasOne
    {
        return $this->hasOne(PumpPersonnel::class)->latestOfMany('period_start');
    }

    public function personnel(): HasMany
    {
        return $this->hasMany(PumpPersonnel::class)->orderByDesc('period_start');
    }

    /** Último registro diario guardado */
    public function latestLog(): HasOne
    {
        return $this->hasOne(DailyLog::class)->latestOfMany('log_date');
    }

    /** Horas acumuladas actuales (último registro o base) */
    public function getCurrentAccumulatedHours(): float
    {
        return (float) ($this->latestLog?->accumulated_hours ?? $this->base_accumulated_hours);
    }

    /** Ensamblaje por posición */
    public function assemblyByPosition(string $position): ?PumpAssembly
    {
        return $this->assemblies->firstWhere('position', $position);
    }
}
```

### 7.4 Modelo `PumpAssembly`

```php
<?php
// app/Models/PumpAssembly.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PumpAssembly extends Model
{
    protected $fillable = ['pump_id', 'position'];

    /** Etiquetas en español por posición */
    public const POSITION_LABELS = [
        'left'   => 'Izquierda (I)',
        'middle' => 'Medio (M)',
        'right'  => 'Derecha (D)',
    ];

    /** Orden canónico de los tipos de componente en la tabla */
    public const COMPONENT_ORDER = [
        'camisa',
        'piston',
        'suction_module',
        'suction_valve',
        'suction_seat',
        'discharge_module',
        'discharge_valve',
        'discharge_seat',
    ];

    public function pump(): BelongsTo
    {
        return $this->belongsTo(Pump::class);
    }

    public function components(): HasMany
    {
        return $this->hasMany(AssemblyComponent::class, 'assembly_id');
    }

    /** Componentes ordenados según el orden canónico de la tabla */
    public function orderedComponents()
    {
        return $this->components()
            ->orderByRaw("FIELD(type, 'camisa','piston','suction_module','suction_valve','suction_seat','discharge_module','discharge_valve','discharge_seat')")
            ->get();
    }

    public function getLabelAttribute(): string
    {
        return self::POSITION_LABELS[$this->position] ?? $this->position;
    }
}
```

### 7.5 Modelo `AssemblyComponent`

```php
<?php
// app/Models/AssemblyComponent.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssemblyComponent extends Model
{
    protected $fillable = [
        'assembly_id', 'type', 'serial',
        'installed_at_hours',
        'alert_threshold_warning',
        'alert_threshold_critical',
    ];

    protected $casts = [
        'installed_at_hours'       => 'decimal:2',
        'alert_threshold_warning'  => 'decimal:2',
        'alert_threshold_critical' => 'decimal:2',
    ];

    public function assembly(): BelongsTo
    {
        return $this->belongsTo(PumpAssembly::class, 'assembly_id');
    }

    public function componentHours(): HasMany
    {
        return $this->hasMany(ComponentHours::class, 'component_id');
    }

    public function maintenanceEvents(): HasMany
    {
        return $this->hasMany(MaintenanceEvent::class, 'component_id');
    }

    // -------------------------------------------------------
    // Helper: umbrales efectivos (personalizados o globales)
    // -------------------------------------------------------

    public function getWarningThreshold(): float
    {
        if (!is_null($this->alert_threshold_warning)) {
            return (float) $this->alert_threshold_warning;
        }
        return (float) config("thresholds.{$this->type}.warning", 1000);
    }

    public function getCriticalThreshold(): float
    {
        if (!is_null($this->alert_threshold_critical)) {
            return (float) $this->alert_threshold_critical;
        }
        return (float) config("thresholds.{$this->type}.critical", 1200);
    }

    // -------------------------------------------------------
    // Helper: estado y horas actuales
    // -------------------------------------------------------

    /**
     * Retorna las horas acumuladas del componente en su último registro.
     * Calcula: horas del último component_hours o 0 si no existe.
     */
    public function getCurrentHours(): float
    {
        $latest = $this->componentHours()
            ->join('daily_logs', 'component_hours.daily_log_id', '=', 'daily_logs.id')
            ->orderByDesc('daily_logs.log_date')
            ->first(['component_hours.hours_accumulated']);

        return (float) ($latest?->hours_accumulated ?? 0.0);
    }

    /**
     * Retorna el estado del componente basado en sus horas actuales.
     * 'ok' | 'warning' | 'critical'
     */
    public function getStatus(): string
    {
        $hours = $this->getCurrentHours();

        if ($hours >= $this->getCriticalThreshold()) {
            return 'critical';
        }

        if ($hours >= $this->getWarningThreshold()) {
            return 'warning';
        }

        return 'ok';
    }

    /**
     * Calcula las horas acumuladas del componente para un día dado,
     * basándose en las horas del día anterior + las horas trabajadas hoy.
     * Si el componente fue cambiado hoy, devuelve solo hoursWorked.
     */
    public function calculateHoursFor(float $hoursWorked, bool $wasChanged = false): float
    {
        if ($wasChanged) {
            return $hoursWorked;
        }
        return $this->getCurrentHours() + $hoursWorked;
    }

    public function getLabelAttribute(): string
    {
        return config("component_labels.{$this->type}", $this->type);
    }
}
```

### 7.6 Modelo `PumpPersonnel`

```php
<?php
// app/Models/PumpPersonnel.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PumpPersonnel extends Model
{
    protected $fillable = [
        'pump_id', 'period_start',
        'rig_manager',
        'supervisor_day', 'supervisor_night',
        'encuellador_day', 'encuellador_night',
    ];

    protected $casts = [
        'period_start' => 'date',
    ];

    public function pump(): BelongsTo
    {
        return $this->belongsTo(Pump::class);
    }
}
```

### 7.7 Modelo `DailyLog`

```php
<?php
// app/Models/DailyLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyLog extends Model
{
    protected $fillable = [
        'pump_id', 'well_id', 'log_date', 'day_number',
        'hours_worked', 'accumulated_hours',
        'dampener_pressure', 'comments', 'synced',
    ];

    protected $casts = [
        'log_date'          => 'date',
        'hours_worked'      => 'decimal:2',
        'accumulated_hours' => 'decimal:2',
        'synced'            => 'boolean',
    ];

    public function pump(): BelongsTo
    {
        return $this->belongsTo(Pump::class);
    }

    public function well(): BelongsTo
    {
        return $this->belongsTo(Well::class);
    }

    public function componentHours(): HasMany
    {
        return $this->hasMany(ComponentHours::class);
    }

    public function maintenanceEvents(): HasMany
    {
        return $this->hasMany(MaintenanceEvent::class);
    }

    /** ¿Tiene algún componente en estado crítico? */
    public function hasCriticalComponents(): bool
    {
        return $this->componentHours()
            ->join('assembly_components', 'component_hours.component_id', '=', 'assembly_components.id')
            ->whereRaw('component_hours.hours_accumulated >= COALESCE(assembly_components.alert_threshold_critical, 1200)')
            ->exists();
    }
}
```

### 7.8 Modelo `ComponentHours`

```php
<?php
// app/Models/ComponentHours.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComponentHours extends Model
{
    protected $fillable = ['daily_log_id', 'component_id', 'hours_accumulated'];

    protected $casts = [
        'hours_accumulated' => 'decimal:2',
    ];

    public function dailyLog(): BelongsTo
    {
        return $this->belongsTo(DailyLog::class);
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(AssemblyComponent::class, 'component_id');
    }
}
```

### 7.9 Modelo `MaintenanceEvent`

```php
<?php
// app/Models/MaintenanceEvent.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceEvent extends Model
{
    protected $fillable = [
        'daily_log_id', 'component_id', 'event_type',
        'hours_before', 'new_serial', 'notes',
    ];

    protected $casts = [
        'hours_before' => 'decimal:2',
    ];

    public function dailyLog(): BelongsTo
    {
        return $this->belongsTo(DailyLog::class);
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(AssemblyComponent::class, 'component_id');
    }
}
```

### 7.10 Actualizar modelo `User`

```php
<?php
// app/Models/User.php  (reemplaza el existente de Breeze)

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role', 'rig_id',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
    ];

    public function rig(): BelongsTo
    {
        return $this->belongsTo(Rig::class);
    }

    // ---- Helpers de roles ----

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isRigManager(): bool
    {
        return $this->role === 'rig_manager';
    }

    public function isSupervisor(): bool
    {
        return $this->role === 'supervisor';
    }

    public function isEncuellador(): bool
    {
        return $this->role === 'encuellador';
    }

    public function canManageRig(Rig $rig): bool
    {
        if ($this->isAdmin()) {
            return true;
        }
        return $this->rig_id === $rig->id;
    }

    public function canCreateLogs(): bool
    {
        return in_array($this->role, ['admin', 'rig_manager', 'supervisor', 'encuellador']);
    }
}
```

---

## 8. Rutas Web

```php
<?php
// routes/web.php

use App\Http\Controllers\AlertController;
use App\Http\Controllers\ComponentController;
use App\Http\Controllers\DailyLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PumpController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RigController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn() => redirect()->route('dashboard'));

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // Taladros
    Route::resource('rigs', RigController::class);

    // Pozos (anidados en taladros)
    Route::resource('rigs.wells', \App\Http\Controllers\WellController::class)
        ->shallow();

    // Bombas (anidadas en taladros, shallow para show/edit/destroy)
    Route::resource('rigs.pumps', PumpController::class)->shallow();

    // Registros diarios
    Route::prefix('pumps/{pump}')->name('pumps.')->group(function () {
        Route::get('/log/create', [DailyLogController::class, 'create'])->name('log.create');
        Route::post('/log', [DailyLogController::class, 'store'])->name('log.store');
        Route::get('/log/{log}/edit', [DailyLogController::class, 'edit'])->name('log.edit');
        Route::put('/log/{log}', [DailyLogController::class, 'update'])->name('log.update');
        Route::get('/history', [PumpController::class, 'history'])->name('history');
        Route::get('/components', [ComponentController::class, 'index'])->name('components.index');
        Route::get('/report/pdf', [ReportController::class, 'pumpPdf'])->name('report.pdf');
    });

    // Alertas globales
    Route::get('/alerts', AlertController::class)->name('alerts');

    // Componentes individuales
    Route::prefix('components/{component}')->name('components.')->group(function () {
        Route::get('/history', [ComponentController::class, 'history'])->name('history');
        Route::post('/replace', [ComponentController::class, 'replace'])->name('replace');
    });
});

require __DIR__.'/auth.php';
```

---

## 9. Componentes Livewire

### 9.1 Generar los componentes

```bash
php artisan make:livewire DailyLogForm
php artisan make:livewire AssemblyTable
php artisan make:livewire ComponentRow
php artisan make:livewire DashboardStats
php artisan make:livewire AlertsPanel
php artisan make:livewire HoursChart
php artisan make:livewire PumpSelector
```

### 9.2 `DailyLogForm` — Componente principal (el más complejo)

```php
<?php
// app/Livewire/DailyLogForm.php

namespace App\Livewire;

use App\Models\AssemblyComponent;
use App\Models\DailyLog;
use App\Models\MaintenanceEvent;
use App\Models\Pump;
use App\Models\ComponentHours;
use Illuminate\Support\Facades\DB;
use Livewire\Component;

class DailyLogForm extends Component
{
    public Pump $pump;

    // Campos del formulario principal
    public string $log_date   = '';
    public int    $day_number = 1;
    public float  $hours_worked      = 0.0;
    public int    $dampener_pressure = 0;
    public string $comments          = '';
    public ?int   $well_id           = null;

    // Horas acumuladas calculadas (solo lectura en el formulario)
    public float $accumulated_hours = 0.0;

    /**
     * Estado de los componentes.
     * Estructura: $componentState[component_id] = [
     *   'hours_accumulated' => float,
     *   'changed'           => bool,
     *   'new_serial'        => string,
     *   'status'            => 'ok'|'warning'|'critical',
     * ]
     */
    public array $componentState = [];

    // Ensamblajes cargados (para la vista)
    public $assemblies;

    public function mount(Pump $pump): void
    {
        $this->pump = $pump;

        // Cargar ensamblajes con componentes
        $this->assemblies = $pump->assemblies()
            ->with(['components' => fn($q) => $q->orderByRaw(
                "FIELD(type,'camisa','piston','suction_module','suction_valve','suction_seat','discharge_module','discharge_valve','discharge_seat')"
            )])
            ->orderByRaw("FIELD(position,'left','middle','right')")
            ->get();

        // Valores iniciales
        $this->log_date           = now()->format('Y-m-d');
        $this->accumulated_hours  = $pump->getCurrentAccumulatedHours();
        $this->day_number         = $this->calculateDayNumber();

        // Inicializar estado de cada componente
        foreach ($this->assemblies as $assembly) {
            foreach ($assembly->components as $component) {
                $this->componentState[$component->id] = [
                    'hours_accumulated' => $component->getCurrentHours(),
                    'changed'           => false,
                    'new_serial'        => '',
                    'status'            => $component->getStatus(),
                ];
            }
        }
    }

    /**
     * Recalcular horas acumuladas cada vez que cambian las horas trabajadas.
     */
    public function updatedHoursWorked(): void
    {
        $hoursWorked = (float) $this->hours_worked;
        $base        = $this->pump->getCurrentAccumulatedHours();

        $this->accumulated_hours = $base + $hoursWorked;

        // Recalcular cada componente
        foreach ($this->assemblies as $assembly) {
            foreach ($assembly->components as $component) {
                $id      = $component->id;
                $changed = $this->componentState[$id]['changed'] ?? false;

                if ($changed) {
                    // Componente cambiado: sus horas son solo las de hoy
                    $newHours = $hoursWorked;
                } else {
                    $prevHours = $component->getCurrentHours();
                    $newHours  = $prevHours + $hoursWorked;
                }

                $this->componentState[$id]['hours_accumulated'] = $newHours;
                $this->componentState[$id]['status']            = $this->resolveStatus(
                    $component, $newHours
                );
            }
        }
    }

    /**
     * Cuando se marca/desmarca "cambio" de un componente.
     */
    public function toggleChanged(int $componentId): void
    {
        $this->componentState[$componentId]['changed'] =
            !($this->componentState[$componentId]['changed'] ?? false);

        // Recalcular horas del componente
        $this->updatedHoursWorked();
    }

    /**
     * Guardar el registro diario completo en una transacción.
     */
    public function save(): void
    {
        $this->validate([
            'hours_worked'      => 'required|numeric|min:0|max:24',
            'dampener_pressure' => 'required|integer|min:0|max:5000',
            'day_number'        => 'required|integer|min:1|max:31',
            'log_date'          => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    $exists = DailyLog::where('pump_id', $this->pump->id)
                        ->where('log_date', $value)
                        ->exists();
                    if ($exists) {
                        $fail('Ya existe un registro para esta bomba en la fecha seleccionada.');
                    }
                },
            ],
            'comments' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () {
            // 1. Crear el registro diario
            $log = DailyLog::create([
                'pump_id'           => $this->pump->id,
                'well_id'           => $this->well_id,
                'log_date'          => $this->log_date,
                'day_number'        => $this->day_number,
                'hours_worked'      => $this->hours_worked,
                'accumulated_hours' => $this->accumulated_hours,
                'dampener_pressure' => $this->dampener_pressure,
                'comments'          => $this->comments ?: null,
                'synced'            => true,
            ]);

            // 2. Guardar horas de cada componente y registrar cambios
            foreach ($this->assemblies as $assembly) {
                foreach ($assembly->components as $component) {
                    $state = $this->componentState[$component->id];

                    ComponentHours::create([
                        'daily_log_id'      => $log->id,
                        'component_id'      => $component->id,
                        'hours_accumulated' => $state['hours_accumulated'],
                    ]);

                    // Si hubo cambio de componente
                    if ($state['changed']) {
                        $hoursBeforeChange = $component->getCurrentHours();

                        // Registrar evento de mantenimiento
                        MaintenanceEvent::create([
                            'daily_log_id' => $log->id,
                            'component_id' => $component->id,
                            'event_type'   => 'replacement',
                            'hours_before' => $hoursBeforeChange,
                            'new_serial'   => $state['new_serial'] ?: null,
                            'notes'        => 'Cambio registrado en formulario diario',
                        ]);

                        // Actualizar el serial y las horas de instalación en el componente
                        $component->update([
                            'serial'             => $state['new_serial'] ?: $component->serial,
                            'installed_at_hours' => $this->accumulated_hours,
                        ]);
                    }
                }
            }
        });

        session()->flash('success', 'Registro diario guardado correctamente.');
        $this->redirect(route('pumps.history', $this->pump));
    }

    // ---- Helpers privados ----

    private function resolveStatus(AssemblyComponent $component, float $hours): string
    {
        if ($hours >= $component->getCriticalThreshold()) {
            return 'critical';
        }
        if ($hours >= $component->getWarningThreshold()) {
            return 'warning';
        }
        return 'ok';
    }

    private function calculateDayNumber(): int
    {
        $lastLog = $this->pump->dailyLogs()->orderByDesc('log_date')->first();
        if (!$lastLog) {
            return 1;
        }
        return min(31, $lastLog->day_number + 1);
    }

    public function render()
    {
        return view('livewire.daily-log-form', [
            'wells' => $this->pump->rig->wells()->where('active', true)->get(),
        ]);
    }
}
```

### 9.3 Vista Blade del `DailyLogForm`

```blade
{{-- resources/views/livewire/daily-log-form.blade.php --}}
<div wire:loading.class="opacity-50" class="space-y-6">

    {{-- Encabezado --}}
    <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
            Registro Diario — Bomba N° {{ $pump->number }}
        </h2>

        {{-- Línea de campos principales --}}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">

            {{-- Fecha --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input type="date"
                       wire:model.live="log_date"
                       class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                @error('log_date') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
            </div>

            {{-- Día N° --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Día N°</label>
                <input type="number" min="1" max="31"
                       wire:model.live="day_number"
                       class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                @error('day_number') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
            </div>

            {{-- Horas trabajadas --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Horas Trabajadas</label>
                <input type="number" min="0" max="24" step="0.5"
                       wire:model.live="hours_worked"
                       class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                @error('hours_worked') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
            </div>

            {{-- Horas acumuladas (solo lectura) --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Horas Acumuladas</label>
                <input type="text" readonly
                       value="{{ number_format($accumulated_hours, 2) }}"
                       class="w-full rounded-lg bg-gray-50 border-gray-300 text-gray-600 text-sm cursor-not-allowed" />
            </div>

            {{-- Presión del amortiguador --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Presión Amortiguador (PSI)</label>
                <input type="number" min="0" max="5000"
                       wire:model="dampener_pressure"
                       class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm" />
                @error('dampener_pressure') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
            </div>

            {{-- Pozo --}}
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Pozo</label>
                <select wire:model="well_id"
                        class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm">
                    <option value="">— Seleccionar —</option>
                    @foreach($wells as $well)
                        <option value="{{ $well->id }}">{{ $well->name }}</option>
                    @endforeach
                </select>
            </div>

            {{-- Comentarios --}}
            <div class="col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Comentarios</label>
                <textarea wire:model="comments" rows="2" maxlength="500"
                          class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Observaciones del turno..."></textarea>
            </div>
        </div>
    </div>

    {{-- Tabla de componentes por posición --}}
    @foreach($assemblies as $assembly)
    <div class="bg-white rounded-xl shadow overflow-hidden">
        <div class="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-3">
            <h3 class="text-white font-bold text-sm uppercase tracking-wide">
                Conjunto {{ $assembly->label }}
            </h3>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Componente</th>
                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Serial</th>
                        <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Hrs. Acum.</th>
                        <th class="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
                        <th class="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase">¿Cambio?</th>
                        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Nuevo Serial</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    @foreach($assembly->components as $component)
                    @php
                        $state  = $componentState[$component->id] ?? [];
                        $status = $state['status'] ?? 'ok';
                        $rowClass = match($status) {
                            'critical' => 'bg-red-50',
                            'warning'  => 'bg-yellow-50',
                            default    => '',
                        };
                    @endphp
                    <tr class="{{ $rowClass }} hover:bg-gray-50 transition-colors">
                        <td class="px-4 py-2 font-medium text-gray-800">
                            {{ $component->label }}
                        </td>
                        <td class="px-4 py-2 text-gray-500 font-mono text-xs">
                            {{ $component->serial ?? '—' }}
                        </td>
                        <td class="px-4 py-2 text-right font-mono font-semibold
                            {{ $status === 'critical' ? 'text-red-600' : ($status === 'warning' ? 'text-yellow-600' : 'text-gray-800') }}">
                            {{ number_format($state['hours_accumulated'] ?? 0, 2) }}
                        </td>
                        <td class="px-4 py-2 text-center">
                            @if($status === 'critical')
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                    <x-heroicon-m-exclamation-triangle class="w-3 h-3 mr-1" />
                                    CRÍTICO
                                </span>
                            @elseif($status === 'warning')
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                                    <x-heroicon-m-exclamation-circle class="w-3 h-3 mr-1" />
                                    ALERTA
                                </span>
                            @else
                                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    <x-heroicon-m-check-circle class="w-3 h-3 mr-1" />
                                    OK
                                </span>
                            @endif
                        </td>
                        <td class="px-4 py-2 text-center">
                            <input type="checkbox"
                                   wire:click="toggleChanged({{ $component->id }})"
                                   {{ ($state['changed'] ?? false) ? 'checked' : '' }}
                                   class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                        </td>
                        <td class="px-4 py-2">
                            @if($state['changed'] ?? false)
                            <input type="text"
                                   wire:model="componentState.{{ $component->id }}.new_serial"
                                   placeholder="Nuevo serial..."
                                   class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs font-mono" />
                            @else
                                <span class="text-gray-300 text-xs">—</span>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
    @endforeach

    {{-- Botones de acción --}}
    <div class="flex items-center justify-between bg-white rounded-xl shadow p-4">
        <a href="{{ route('pumps.history', $pump) }}"
           class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <x-heroicon-m-arrow-left class="w-4 h-4" />
            Cancelar
        </a>
        <button wire:click="save"
                wire:loading.attr="disabled"
                class="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow">
            <span wire:loading.remove>
                <x-heroicon-m-check class="w-4 h-4 inline mr-1" />
                Guardar Registro
            </span>
            <span wire:loading>
                Guardando...
            </span>
        </button>
    </div>

</div>
```

### 9.4 `DashboardStats` — Tarjetas del dashboard

```php
<?php
// app/Livewire/DashboardStats.php

namespace App\Livewire;

use App\Models\AssemblyComponent;
use App\Models\DailyLog;
use App\Models\Pump;
use Livewire\Component;

class DashboardStats extends Component
{
    public function render()
    {
        $user = auth()->user();

        // Filtrar por taladro del usuario si no es admin
        $rigsQuery = fn($q) => $user->isAdmin() ? $q : $q->where('rig_id', $user->rig_id);

        $totalPumps   = Pump::when(!$user->isAdmin(), fn($q) => $q->where('rig_id', $user->rig_id))->active()->count();
        $logsToday    = DailyLog::whereDate('log_date', today())
            ->when(!$user->isAdmin(), fn($q) => $q->whereHas('pump', fn($p) => $p->where('rig_id', $user->rig_id)))
            ->count();

        // Componentes en estado crítico o warning
        $criticalCount = $this->countByStatus('critical', $user);
        $warningCount  = $this->countByStatus('warning', $user);

        return view('livewire.dashboard-stats', compact(
            'totalPumps', 'logsToday', 'criticalCount', 'warningCount'
        ));
    }

    private function countByStatus(string $status, $user): int
    {
        // Simplificado: contar componentes cuyas horas acumuladas superan umbrales
        $threshold = $status === 'critical' ? 'alert_threshold_critical' : 'alert_threshold_warning';

        return AssemblyComponent::whereHas('assembly.pump', function ($q) use ($user) {
            if (!$user->isAdmin()) {
                $q->where('rig_id', $user->rig_id);
            }
        })
        ->whereHas('componentHours', function ($q) use ($threshold) {
            $q->whereRaw("hours_accumulated >= COALESCE(assembly_components.{$threshold}, 1000)")
              ->whereIn('daily_log_id', function ($sub) {
                  // Solo el último registro de cada componente
                  $sub->selectRaw('MAX(daily_log_id)')
                      ->from('component_hours')
                      ->groupBy('component_id');
              });
        })
        ->count();
    }
}
```

### 9.5 `AlertsPanel`

```php
<?php
// app/Livewire/AlertsPanel.php

namespace App\Livewire;

use App\Models\AssemblyComponent;
use Livewire\Component;

class AlertsPanel extends Component
{
    public string $filterStatus = 'all'; // 'all' | 'warning' | 'critical'

    public function render()
    {
        $user = auth()->user();

        $components = AssemblyComponent::with([
            'assembly.pump.rig',
            'componentHours' => fn($q) => $q->orderByDesc('id')->limit(1),
        ])
        ->whereHas('assembly.pump', function ($q) use ($user) {
            $q->where('active', true);
            if (!$user->isAdmin()) {
                $q->where('rig_id', $user->rig_id);
            }
        })
        ->get()
        ->filter(fn($c) => match($this->filterStatus) {
            'warning'  => $c->getStatus() === 'warning',
            'critical' => $c->getStatus() === 'critical',
            default    => in_array($c->getStatus(), ['warning', 'critical']),
        })
        ->sortByDesc(fn($c) => $c->getCurrentHours());

        return view('livewire.alerts-panel', compact('components'));
    }
}
```

---

## 10. Form Requests (Validación)

### 10.1 `StoreDailyLogRequest`

```php
<?php
// app/Http/Requests/StoreDailyLogRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDailyLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->canCreateLogs();
    }

    public function rules(): array
    {
        $pumpId = $this->route('pump')->id;

        return [
            'hours_worked' => [
                'required',
                'numeric',
                'min:0',
                'max:24',
            ],
            'dampener_pressure' => [
                'required',
                'integer',
                'min:0',
                'max:5000',
            ],
            'day_number' => [
                'required',
                'integer',
                'min:1',
                'max:31',
            ],
            'log_date' => [
                'required',
                'date',
                Rule::unique('daily_logs')->where('pump_id', $pumpId),
            ],
            'comments'   => 'nullable|string|max:500',
            'well_id'    => 'nullable|exists:wells,id',
        ];
    }

    public function messages(): array
    {
        return [
            'log_date.unique'           => 'Ya existe un registro para esta bomba en la fecha seleccionada.',
            'hours_worked.max'          => 'Las horas trabajadas no pueden superar 24 horas.',
            'dampener_pressure.max'     => 'La presión del amortiguador no puede superar 5000 PSI.',
        ];
    }
}
```

### 10.2 `StoreRigRequest`

```php
<?php
// app/Http/Requests/StoreRigRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRigRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name'     => 'required|string|max:100|unique:rigs,name',
            'location' => 'nullable|string|max:150',
            'manager'  => 'nullable|string|max:150',
        ];
    }
}
```

### 10.3 `StorePumpRequest`

```php
<?php
// app/Http/Requests/StorePumpRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePumpRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->user()->isAdmin() || auth()->user()->isRigManager();
    }

    public function rules(): array
    {
        $rigId = $this->route('rig')->id ?? null;

        return [
            'number'                  => [
                'required',
                'integer',
                'min:1',
                Rule::unique('pumps')->where('rig_id', $rigId),
            ],
            'brand'                   => 'nullable|string|max:100',
            'model'                   => 'nullable|string|max:100',
            'serial'                  => 'nullable|string|max:100',
            'liner_diameter'          => 'nullable|numeric|min:1|max:20',
            'base_accumulated_hours'  => 'required|numeric|min:0',
        ];
    }
}
```

---

## 11. Estructura de Vistas Blade

```
resources/views/
├── layouts/
│   ├── app.blade.php              # Layout principal con sidebar y topbar
│   └── auth.blade.php             # Layout para login/register
├── components/                    # Blade components reutilizables
│   ├── layouts/
│   ├── status-badge.blade.php     # Badge de estado (ok/warning/critical)
│   ├── stat-card.blade.php        # Tarjeta de estadística
│   ├── pump-card.blade.php        # Tarjeta resumen de bomba
│   └── alert-row.blade.php        # Fila de alerta en la tabla
├── dashboard/
│   └── index.blade.php            # Dashboard principal
├── rigs/
│   ├── index.blade.php            # Lista de taladros
│   ├── create.blade.php           # Formulario crear taladro
│   ├── edit.blade.php             # Formulario editar taladro
│   └── show.blade.php             # Detalle del taladro con sus bombas
├── pumps/
│   ├── create.blade.php           # Crear bomba (con creación de ensamblajes)
│   ├── show.blade.php             # Vista de la bomba con estado actual
│   └── history.blade.php          # Historial de registros diarios (tabla)
├── logs/
│   ├── create.blade.php           # Formulario diario (monta DailyLogForm livewire)
│   └── edit.blade.php             # Editar registro existente
├── components-view/
│   ├── index.blade.php            # Estado de todos los componentes de la bomba
│   └── history.blade.php          # Historial de un componente específico
├── reports/
│   └── pump-pdf.blade.php         # Plantilla PDF landscape (FGOP-XXXX)
├── alerts/
│   └── index.blade.php            # Panel de alertas global
└── auth/                          # Vistas de Breeze (ya generadas)
```

### 11.1 Layout principal `app.blade.php`

```blade
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="es" class="h-full bg-gray-50">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#1d4ed8" />
    <title>{{ config('app.name', 'Pump Tracker') }}</title>

    {{-- PWA manifest --}}
    <link rel="manifest" href="/manifest.json" />

    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles

    {{-- Chart.js CDN --}}
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" defer></script>
</head>
<body class="h-full flex overflow-hidden">

    {{-- Sidebar --}}
    <aside class="hidden md:flex md:flex-col w-64 bg-gray-900 text-white">
        <div class="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
            <x-heroicon-o-beaker class="w-7 h-7 text-blue-400" />
            <span class="text-lg font-bold tracking-tight">Pump Tracker</span>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <x-nav-link href="{{ route('dashboard') }}" :active="request()->routeIs('dashboard')">
                <x-heroicon-o-home class="w-5 h-5" />
                Dashboard
            </x-nav-link>

            <x-nav-link href="{{ route('rigs.index') }}" :active="request()->routeIs('rigs.*')">
                <x-heroicon-o-cog-6-tooth class="w-5 h-5" />
                Taladros
            </x-nav-link>

            <x-nav-link href="{{ route('alerts') }}" :active="request()->routeIs('alerts')">
                <x-heroicon-o-bell-alert class="w-5 h-5" />
                Alertas
                <livewire:alerts-badge />
            </x-nav-link>
        </nav>

        {{-- Info de usuario --}}
        <div class="px-4 py-4 border-t border-gray-700">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                    {{ strtoupper(substr(auth()->user()->name, 0, 2)) }}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">{{ auth()->user()->name }}</p>
                    <p class="text-xs text-gray-400 capitalize">{{ auth()->user()->role }}</p>
                </div>
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="text-gray-400 hover:text-white transition-colors">
                        <x-heroicon-o-arrow-right-on-rectangle class="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    </aside>

    {{-- Contenido principal --}}
    <div class="flex-1 flex flex-col overflow-hidden">
        {{-- Topbar (mobile) --}}
        <header class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
            <span class="font-bold text-blue-700">Pump Tracker</span>
            {{-- Mobile menu trigger con Alpine.js --}}
        </header>

        {{-- Indicador offline --}}
        <div id="offline-banner"
             class="hidden bg-yellow-500 text-yellow-900 text-xs font-medium text-center py-1">
            Sin conexión — los registros se guardarán localmente y se sincronizarán al reconectar.
        </div>

        {{-- Flash messages --}}
        @if(session('success'))
        <div class="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
            <x-heroicon-m-check-circle class="w-4 h-4 flex-shrink-0" />
            {{ session('success') }}
        </div>
        @endif

        @if(session('error'))
        <div class="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
            <x-heroicon-m-x-circle class="w-4 h-4 flex-shrink-0" />
            {{ session('error') }}
        </div>
        @endif

        <main class="flex-1 overflow-y-auto p-6">
            {{ $slot }}
        </main>
    </div>

    @livewireScripts

    <script>
        // Indicador offline/online
        function updateOnlineStatus() {
            const banner = document.getElementById('offline-banner');
            if (banner) {
                banner.classList.toggle('hidden', navigator.onLine);
            }
        }
        window.addEventListener('online',  updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    </script>
</body>
</html>
```

---

## 12. Plantilla PDF (FGOP-XXXX)

El PDF debe generarse en orientación horizontal (landscape) y replicar fielmente el formato del Excel original.

```php
<?php
// app/Http/Controllers/ReportController.php

namespace App\Http\Controllers;

use App\Models\Pump;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function pumpPdf(Request $request, Pump $pump)
    {
        $this->authorize('view', $pump);

        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year', now()->year);

        $logs = $pump->dailyLogs()
            ->with(['componentHours.component.assembly', 'maintenanceEvents'])
            ->whereYear('log_date', $year)
            ->whereMonth('log_date', $month)
            ->orderBy('log_date')
            ->get();

        $assemblies = $pump->assemblies()
            ->with(['components' => fn($q) => $q->orderByRaw(
                "FIELD(type,'camisa','piston','suction_module','suction_valve','suction_seat','discharge_module','discharge_valve','discharge_seat')"
            )])
            ->orderByRaw("FIELD(position,'left','middle','right')")
            ->get();

        $personnel = $pump->latestPersonnel;

        $pdf = Pdf::loadView('reports.pump-pdf', compact(
            'pump', 'logs', 'assemblies', 'personnel', 'month', 'year'
        ))->setPaper('legal', 'landscape');

        $filename = "FGOP-{$pump->rig->name}-Bomba{$pump->number}-{$year}-{$month}.pdf";

        return $pdf->download($filename);
    }
}
```

```blade
{{-- resources/views/reports/pump-pdf.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            font-size: 7px;
            color: #000;
        }
        .page-header {
            text-align: center;
            margin-bottom: 6px;
        }
        .page-header h1 { font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .page-header h2 { font-size: 9px; }
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2px;
            margin-bottom: 6px;
            border: 1px solid #333;
            padding: 4px;
        }
        .meta-item span:first-child { font-weight: bold; }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 6.5px;
        }
        th, td {
            border: 1px solid #555;
            padding: 2px 3px;
            text-align: center;
        }
        th {
            background-color: #1d4ed8;
            color: #fff;
            font-size: 6px;
            text-transform: uppercase;
        }
        th.pos-left   { background-color: #1e40af; }
        th.pos-middle { background-color: #1d4ed8; }
        th.pos-right  { background-color: #2563eb; }

        .row-warning  { background-color: #fef3c7; }
        .row-comment  { background-color: #fefce8; }
        .row-critical { background-color: #fee2e2; }
        .row-change   { background-color: #dcfce7; font-weight: bold; }

        .hours-critical { color: #dc2626; font-weight: bold; }
        .hours-warning  { color: #d97706; font-weight: bold; }
        .text-left      { text-align: left; }
        .footer { margin-top: 8px; font-size: 6px; color: #666; text-align: right; }
    </style>
</head>
<body>

    <div class="page-header">
        <h1>FGOP — Control de Horas de Trabajo de Bombas de Lodo</h1>
        <h2>{{ $pump->rig->name }} — Bomba N° {{ $pump->number }} — {{ \Carbon\Carbon::createFromDate($year, $month, 1)->translatedFormat('F Y') }}</h2>
    </div>

    <div class="meta-grid">
        <div class="meta-item"><span>Taladro:</span> {{ $pump->rig->name }}</div>
        <div class="meta-item"><span>Marca/Modelo:</span> {{ $pump->brand }} {{ $pump->model }}</div>
        <div class="meta-item"><span>Serial:</span> {{ $pump->serial }}</div>
        <div class="meta-item"><span>Jefe de Equipo:</span> {{ $personnel?->rig_manager ?? '—' }}</div>
        <div class="meta-item"><span>Supervisor Día:</span> {{ $personnel?->supervisor_day ?? '—' }}</div>
        <div class="meta-item"><span>Supervisor Noche:</span> {{ $personnel?->supervisor_night ?? '—' }}</div>
        <div class="meta-item"><span>Encuellador Día:</span> {{ $personnel?->encuellador_day ?? '—' }}</div>
        <div class="meta-item"><span>Encuellador Noche:</span> {{ $personnel?->encuellador_night ?? '—' }}</div>
        <div class="meta-item"><span>Liner:</span> {{ $pump->liner_diameter }}"</div>
    </div>

    <table>
        <thead>
            <tr>
                <th rowspan="2">DÍA</th>
                <th rowspan="2">HRS<br>DÍA</th>
                <th rowspan="2">HRS<br>ACUM</th>
                <th rowspan="2">DAMP<br>(PSI)</th>
                {{-- Encabezados de posición --}}
                @foreach($assemblies as $assembly)
                    <th colspan="8" class="pos-{{ $assembly->position }}">
                        {{ \App\Models\PumpAssembly::POSITION_LABELS[$assembly->position] }}
                    </th>
                @endforeach
                <th rowspan="2">COMENTARIOS</th>
            </tr>
            <tr>
                {{-- Sub-encabezados de componentes --}}
                @foreach($assemblies as $assembly)
                    @foreach($assembly->components as $component)
                        <th>{{ strtoupper(config("component_labels.{$component->type}", $component->type)) }}</th>
                    @endforeach
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($logs as $log)
            @php
                // Determinar clase de la fila
                $rowClass = '';
                if ($log->comments) $rowClass = 'row-comment';

                $hasChange = $log->maintenanceEvents->isNotEmpty();
                if ($hasChange) $rowClass = 'row-change';

                // Construir mapa de horas por componente para esta fila
                $hoursMap = $log->componentHours->keyBy('component_id');
            @endphp
            <tr class="{{ $rowClass }}">
                <td>{{ $log->day_number }}</td>
                <td>{{ number_format($log->hours_worked, 2) }}</td>
                <td>{{ number_format($log->accumulated_hours, 2) }}</td>
                <td>{{ $log->dampener_pressure }}</td>

                @foreach($assemblies as $assembly)
                    @foreach($assembly->components as $component)
                    @php
                        $ch     = $hoursMap->get($component->id);
                        $hours  = $ch ? (float) $ch->hours_accumulated : 0;
                        $status = 'ok';
                        if ($hours >= $component->getCriticalThreshold())      $status = 'critical';
                        elseif ($hours >= $component->getWarningThreshold())   $status = 'warning';
                        $cellClass = match($status) {
                            'critical' => 'hours-critical',
                            'warning'  => 'hours-warning',
                            default    => '',
                        };
                    @endphp
                        <td class="{{ $cellClass }}">{{ $hours > 0 ? number_format($hours, 0) : '' }}</td>
                    @endforeach
                @endforeach

                <td class="text-left">{{ $log->comments }}</td>
            </tr>
            @endforeach

            @if($logs->isEmpty())
            <tr>
                <td colspan="{{ 4 + ($assemblies->sum(fn($a) => $a->components->count())) + 1 }}"
                    style="text-align:center; color:#999; padding: 8px;">
                    No hay registros para este período.
                </td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="footer">
        Generado el {{ now()->format('d/m/Y H:i') }} — Pump Tracker v1.0
    </div>

</body>
</html>
```

---

## 13. Seeder con Datos Reales (RIG158)

```php
<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use App\Models\AssemblyComponent;
use App\Models\Pump;
use App\Models\PumpAssembly;
use App\Models\PumpPersonnel;
use App\Models\Rig;
use App\Models\User;
use App\Models\Well;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ================================================================
        // 1. USUARIOS
        // ================================================================
        $admin = User::factory()->create([
            'name'     => 'Administrador Sistema',
            'email'    => 'admin@pumptracker.com',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'rig_id'   => null,
        ]);

        // ================================================================
        // 2. TALADRO RIG158
        // ================================================================
        $rig = Rig::create([
            'name'     => 'RIG158',
            'location' => 'Bloque Ayacucho, Faja Petrolífera del Orinoco',
            'manager'  => 'Carlos Hernández',
            'active'   => true,
        ]);

        // Usuario jefe de equipo para RIG158
        $rigManager = User::factory()->create([
            'name'     => 'Carlos Hernández',
            'email'    => 'rig158.manager@pumptracker.com',
            'password' => Hash::make('password'),
            'role'     => 'rig_manager',
            'rig_id'   => $rig->id,
        ]);

        // Supervisores
        User::factory()->create([
            'name'     => 'Pedro Ramírez',
            'email'    => 'supervisor.dia@pumptracker.com',
            'password' => Hash::make('password'),
            'role'     => 'supervisor',
            'rig_id'   => $rig->id,
        ]);

        User::factory()->create([
            'name'     => 'Luis Mendoza',
            'email'    => 'supervisor.noche@pumptracker.com',
            'password' => Hash::make('password'),
            'role'     => 'supervisor',
            'rig_id'   => $rig->id,
        ]);

        // Encuelladores
        User::factory()->create([
            'name'     => 'José Torres',
            'email'    => 'encuellador.dia@pumptracker.com',
            'password' => Hash::make('password'),
            'role'     => 'encuellador',
            'rig_id'   => $rig->id,
        ]);

        // ================================================================
        // 3. POZO ACTUAL
        // ================================================================
        $well = Well::create([
            'rig_id' => $rig->id,
            'name'   => 'MPEE-4001',
            'field'  => 'Morichal',
            'active' => true,
        ]);

        // ================================================================
        // 4. BOMBA N°1 — RIG158
        // ================================================================
        $pump = Pump::create([
            'rig_id'                 => $rig->id,
            'number'                 => 1,
            'brand'                  => 'National Oilwell Varco',
            'model'                  => 'NOV 14-P-220',
            'serial'                 => 'NOV-2019-00458',
            'liner_diameter'         => 6.50,
            'base_accumulated_hours' => 0.00,
            'active'                 => true,
        ]);

        // ================================================================
        // 5. PERSONAL DE LA BOMBA
        // ================================================================
        PumpPersonnel::create([
            'pump_id'          => $pump->id,
            'period_start'     => '2024-05-01',
            'rig_manager'      => 'Carlos Hernández',
            'supervisor_day'   => 'Pedro Ramírez',
            'supervisor_night' => 'Luis Mendoza',
            'encuellador_day'  => 'José Torres',
            'encuellador_night'=> 'Armando González',
        ]);

        // ================================================================
        // 6. ENSAMBLAJES Y COMPONENTES
        // ================================================================
        $positions = ['left', 'middle', 'right'];
        $componentTypes = [
            'camisa', 'piston',
            'suction_module', 'suction_valve', 'suction_seat',
            'discharge_module', 'discharge_valve', 'discharge_seat',
        ];

        // Seriales de ejemplo por posición
        $serials = [
            'left' => [
                'camisa'           => 'CAM-L-2024-001',
                'piston'           => 'PIS-L-2024-001',
                'suction_module'   => 'MSUC-L-2024-001',
                'suction_valve'    => 'VSUC-L-2024-001',
                'suction_seat'     => 'ASUC-L-2024-001',
                'discharge_module' => 'MDESC-L-2024-001',
                'discharge_valve'  => 'VDESC-L-2024-001',
                'discharge_seat'   => 'ADESC-L-2024-001',
            ],
            'middle' => [
                'camisa'           => 'CAM-M-2024-001',
                'piston'           => 'PIS-M-2024-001',
                'suction_module'   => 'MSUC-M-2024-001',
                'suction_valve'    => 'VSUC-M-2024-001',
                'suction_seat'     => 'ASUC-M-2024-001',
                'discharge_module' => 'MDESC-M-2024-001',
                'discharge_valve'  => 'VDESC-M-2024-001',
                'discharge_seat'   => 'ADESC-M-2024-001',
            ],
            'right' => [
                'camisa'           => 'CAM-R-2024-001',
                'piston'           => 'PIS-R-2024-001',
                'suction_module'   => 'MSUC-R-2024-001',
                'suction_valve'    => 'VSUC-R-2024-001',
                'suction_seat'     => 'ASUC-R-2024-001',
                'discharge_module' => 'MDESC-R-2024-001',
                'discharge_valve'  => 'VDESC-R-2024-001',
                'discharge_seat'   => 'ADESC-R-2024-001',
            ],
        ];

        foreach ($positions as $position) {
            $assembly = PumpAssembly::create([
                'pump_id'  => $pump->id,
                'position' => $position,
            ]);

            foreach ($componentTypes as $type) {
                AssemblyComponent::create([
                    'assembly_id'              => $assembly->id,
                    'type'                     => $type,
                    'serial'                   => $serials[$position][$type],
                    'installed_at_hours'       => 0.00,
                    'alert_threshold_warning'  => null, // usar config/thresholds.php
                    'alert_threshold_critical' => null,
                ]);
            }
        }

        // ================================================================
        // 7. BOMBA N°2 — RIG158 (datos de ejemplo)
        // ================================================================
        $pump2 = Pump::create([
            'rig_id'                 => $rig->id,
            'number'                 => 2,
            'brand'                  => 'Gardner Denver',
            'model'                  => 'PZ-11',
            'serial'                 => 'GD-2021-00732',
            'liner_diameter'         => 7.00,
            'base_accumulated_hours' => 450.00,
            'active'                 => true,
        ]);

        PumpPersonnel::create([
            'pump_id'          => $pump2->id,
            'period_start'     => '2024-05-01',
            'rig_manager'      => 'Carlos Hernández',
            'supervisor_day'   => 'Pedro Ramírez',
            'supervisor_night' => 'Luis Mendoza',
            'encuellador_day'  => 'José Torres',
            'encuellador_night'=> 'Armando González',
        ]);

        foreach ($positions as $position) {
            $assembly = PumpAssembly::create([
                'pump_id'  => $pump2->id,
                'position' => $position,
            ]);

            foreach ($componentTypes as $type) {
                AssemblyComponent::create([
                    'assembly_id'              => $assembly->id,
                    'type'                     => $type,
                    'serial'                   => strtoupper($position[0]) . '-P2-' . $type,
                    'installed_at_hours'       => 450.00,
                    'alert_threshold_warning'  => null,
                    'alert_threshold_critical' => null,
                ]);
            }
        }

        $this->command->info('Seed completado: RIG158 con 2 bombas, personal y componentes creados.');
        $this->command->info('Admin: admin@pumptracker.com / password');
        $this->command->info('Jefe: rig158.manager@pumptracker.com / password');
    }
}
```

---

## 14. PWA / Soporte Offline

### 14.1 Manifest Web App

```json
// public/manifest.json
{
    "name": "Pump Tracker",
    "short_name": "PumpTracker",
    "description": "Control de horas de bombas de lodo en taladros petroleros",
    "start_url": "/dashboard",
    "display": "standalone",
    "background_color": "#111827",
    "theme_color": "#1d4ed8",
    "orientation": "portrait-primary",
    "icons": [
        {
            "src": "/icons/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/icons/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        }
    ]
}
```

### 14.2 Service Worker

```javascript
// public/service-worker.js

const CACHE_NAME      = 'pump-tracker-v1';
const OFFLINE_URL     = '/offline.html';
const ASSETS_TO_CACHE = [
    '/',
    '/dashboard',
    '/manifest.json',
    OFFLINE_URL,
];

// Instalar: cachear recursos estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

// Activar: limpiar caches viejos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch: strategy network-first, fallback a cache
self.addEventListener('fetch', (event) => {
    // Solo interceptar GET
    if (event.request.method !== 'GET') return;

    // No interceptar peticiones de livewire (necesitan red)
    if (event.request.url.includes('/livewire/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cachear respuestas exitosas
                if (response.ok) {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request).then(
                    (cached) => cached ?? caches.match(OFFLINE_URL)
                )
            )
    );
});

// Sincronización en background cuando se recupera la conexión
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-pending-logs') {
        event.waitUntil(syncPendingLogs());
    }
});

async function syncPendingLogs() {
    // Leer logs pendientes del IndexedDB / localStorage
    const pending = JSON.parse(self.localStorage?.getItem('pendingLogs') ?? '[]');
    for (const logData of pending) {
        try {
            await fetch('/pumps/' + logData.pump_id + '/log', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body:    JSON.stringify(logData),
            });
        } catch (e) {
            console.error('Error sincronizando log:', e);
        }
    }
}
```

### 14.3 Registrar el Service Worker en `app.js`

```javascript
// resources/js/app.js  (agregar al final)

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((reg) => console.log('SW registrado:', reg.scope))
            .catch((err) => console.error('SW error:', err));
    });
}

// LocalStorage helper para logs offline pendientes
window.PumpTrackerOffline = {
    savePendingLog(data) {
        const pending = JSON.parse(localStorage.getItem('pendingLogs') ?? '[]');
        pending.push({ ...data, savedAt: new Date().toISOString() });
        localStorage.setItem('pendingLogs', JSON.stringify(pending));
    },
    getPendingCount() {
        return JSON.parse(localStorage.getItem('pendingLogs') ?? '[]').length;
    },
    clearPending() {
        localStorage.removeItem('pendingLogs');
    },
};
```

---

## 15. Roles y Autorización

### 15.1 Gates en `AppServiceProvider`

```php
<?php
// app/Providers/AppServiceProvider.php

namespace App\Providers;

use App\Models\DailyLog;
use App\Models\Pump;
use App\Models\Rig;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // --- Taladros ---
        Gate::define('manage-rigs', fn(User $user) => $user->isAdmin());

        Gate::define('view-rig', function (User $user, Rig $rig) {
            return $user->isAdmin() || $user->rig_id === $rig->id;
        });

        // --- Bombas ---
        Gate::define('view-pump', function (User $user, Pump $pump) {
            return $user->isAdmin() || $user->rig_id === $pump->rig_id;
        });

        Gate::define('manage-pump', function (User $user, Pump $pump) {
            return $user->isAdmin() ||
                   ($user->isRigManager() && $user->rig_id === $pump->rig_id);
        });

        // --- Registros diarios ---
        Gate::define('create-log', function (User $user, Pump $pump) {
            return $user->isAdmin() ||
                   in_array($user->role, ['rig_manager', 'supervisor', 'encuellador'])
                   && $user->rig_id === $pump->rig_id;
        });

        Gate::define('edit-log', function (User $user, DailyLog $log) {
            return $user->isAdmin() ||
                   ($user->isRigManager() && $user->rig_id === $log->pump->rig_id);
        });

        // --- Admin only ---
        Gate::define('manage-users', fn(User $user) => $user->isAdmin());
    }
}
```

### 15.2 Middleware de rol

```php
<?php
// app/Http/Middleware/EnsureUserHasRole.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user() || !in_array($request->user()->role, $roles)) {
            abort(403, 'No tienes permisos para acceder a esta sección.');
        }

        return $next($request);
    }
}
```

Registrar en `bootstrap/app.php` (Laravel 11):

```php
// bootstrap/app.php

use App\Http\Middleware\EnsureUserHasRole;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(...)
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(...)
    ->create();
```

Uso en rutas:

```php
// Solo admin puede crear taladros
Route::post('/rigs', [RigController::class, 'store'])->middleware('role:admin');

// Admin y rig_manager pueden gestionar bombas
Route::post('/rigs/{rig}/pumps', [PumpController::class, 'store'])
    ->middleware('role:admin,rig_manager');
```

---

## 16. Comandos Artisan Esenciales

```bash
# Inicializar base de datos con datos de prueba
php artisan migrate:fresh --seed

# Generar componentes Livewire
php artisan make:livewire DailyLogForm
php artisan make:livewire AssemblyTable
php artisan make:livewire ComponentRow
php artisan make:livewire DashboardStats
php artisan make:livewire AlertsPanel
php artisan make:livewire HoursChart
php artisan make:livewire AlertsBadge

# Generar Form Requests
php artisan make:request StoreDailyLogRequest
php artisan make:request StoreRigRequest
php artisan make:request StorePumpRequest
php artisan make:request UpdatePumpPersonnelRequest

# Generar controladores
php artisan make:controller DashboardController --invokable
php artisan make:controller RigController --resource
php artisan make:controller PumpController --resource
php artisan make:controller DailyLogController
php artisan make:controller ReportController
php artisan make:controller AlertController --invokable
php artisan make:controller ComponentController

# Generar políticas (opcional, alternativo a Gates)
php artisan make:policy PumpPolicy --model=Pump
php artisan make:policy DailyLogPolicy --model=DailyLog

# Generar config
php artisan config:clear
php artisan cache:clear

# Instalar heroicons para Blade
composer require blade-ui-kit/blade-heroicons

# Servidor de desarrollo
php artisan serve
npm run dev   # En otra terminal para HMR de Vite
```

---

## 17. Reglas de Negocio Críticas

Estas reglas DEBEN implementarse con exactitud. Son el corazón de la aplicación.

### Regla 1: Un solo registro por bomba por día
```php
// En DailyLogForm::save() y StoreDailyLogRequest
// No puede existir más de un daily_log con el mismo pump_id y log_date.
// Usar constraint UNIQUE en la migración + validación en Form Request.
Rule::unique('daily_logs')->where('pump_id', $pumpId)
```

### Regla 2: Horas acumuladas de la bomba son siempre crecientes
```php
// accumulated_hours = horas acumuladas del día anterior + hours_worked
// NUNCA puede ser menor que el registro anterior.
// Validar en DailyLogForm::save():
$previous = $this->pump->dailyLogs()
    ->where('log_date', '<', $this->log_date)
    ->orderByDesc('log_date')
    ->value('accumulated_hours') ?? $this->pump->base_accumulated_hours;

if ($this->accumulated_hours < $previous) {
    $this->addError('hours_worked', 'Las horas acumuladas no pueden ser menores al registro anterior.');
    return;
}
```

### Regla 3: Horas del componente se resetean al cambiarlo
```php
// Si $state['changed'] === true:
//   horas del componente = hours_worked (solo las de hoy, como si fuera nuevo)
// Si $state['changed'] === false:
//   horas del componente = horas_ayer + hours_worked

$newHours = $state['changed']
    ? (float) $this->hours_worked
    : ($component->getCurrentHours() + (float) $this->hours_worked);
```

### Regla 4: Alertas se evalúan DESPUÉS de guardar cada registro
```php
// En DailyLogForm::save(), luego de la transacción principal:
// Disparar un Job o evaluar inline si algún componente supera umbrales.
// Los umbrales se toman de: assembly_components.alert_threshold_* ?? config('thresholds.*')
```

### Regla 5: El PDF replica el Excel exactamente
```
- Orientación landscape (legal paper recomendado para más columnas)
- 37 columnas totales: DÍA + HRS DÍA + HRS ACUM + DAMPENER + 8*3 componentes + COMENTARIOS
- Colores según estado: amarillo (comentarios), verde (cambio), naranja (warning), rojo (critical)
- Encabezado con todos los metadatos del taladro, pozo y personal
```

### Regla 6: Solo usuarios del mismo taladro pueden registrar datos
```php
// Verificar en Gates/Policies que user->rig_id === pump->rig_id
// El admin puede acceder a todo sin restricción de rig_id
Gate::define('create-log', function (User $user, Pump $pump) {
    return $user->isAdmin() || $user->rig_id === $pump->rig_id;
});
```

### Regla 7: El modo offline guarda en localStorage y sincroniza al reconectar
```javascript
// Si navigator.onLine === false al intentar guardar:
// 1. Serializar el formulario a JSON
// 2. Guardar en localStorage con window.PumpTrackerOffline.savePendingLog(data)
// 3. Mostrar indicador "pendiente de sincronización"
// 4. Al reconectar (evento 'online'), intentar enviar todos los pendientes

window.addEventListener('online', async () => {
    const pending = JSON.parse(localStorage.getItem('pendingLogs') ?? '[]');
    if (pending.length === 0) return;
    // Enviar cada registro pendiente vía fetch POST
    // ...
    window.PumpTrackerOffline.clearPending();
});
```

### Regla 8: Los 24 componentes de la bomba SIEMPRE tienen registro en cada daily_log
```php
// Al guardar un DailyLog, crear ComponentHours para TODOS los componentes
// de los 3 ensamblajes de la bomba, independientemente de si hubo cambio o no.
// Esto garantiza que el historial esté completo y el PDF no tenga celdas vacías.

foreach ($this->assemblies as $assembly) {
    foreach ($assembly->components as $component) {
        ComponentHours::create([...]);  // SIEMPRE, sin excepción
    }
}
// Total: 3 posiciones × 8 componentes = 24 registros por daily_log
```

---

## 18. Componentes Blade Reutilizables

### `status-badge.blade.php`

```blade
{{-- resources/views/components/status-badge.blade.php --}}
@props(['status' => 'ok'])

@php
$classes = match($status) {
    'critical' => 'bg-red-100 text-red-700 border-red-200',
    'warning'  => 'bg-yellow-100 text-yellow-700 border-yellow-200',
    default    => 'bg-green-100 text-green-700 border-green-200',
};
$label = match($status) {
    'critical' => 'CRÍTICO',
    'warning'  => 'ALERTA',
    default    => 'OK',
};
$icon = match($status) {
    'critical' => 'heroicon-m-exclamation-triangle',
    'warning'  => 'heroicon-m-exclamation-circle',
    default    => 'heroicon-m-check-circle',
};
@endphp

<span {{ $attributes->merge(['class' => "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border $classes"]) }}>
    <x-dynamic-component :component="$icon" class="w-3 h-3" />
    {{ $label }}
</span>
```

### `stat-card.blade.php`

```blade
{{-- resources/views/components/stat-card.blade.php --}}
@props(['title', 'value', 'icon', 'color' => 'blue', 'trend' => null])

@php
$colorMap = [
    'blue'   => 'bg-blue-50 text-blue-600 border-blue-100',
    'green'  => 'bg-green-50 text-green-600 border-green-100',
    'yellow' => 'bg-yellow-50 text-yellow-600 border-yellow-100',
    'red'    => 'bg-red-50 text-red-600 border-red-100',
];
$colorClass = $colorMap[$color] ?? $colorMap['blue'];
@endphp

<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
    <div class="rounded-lg p-3 {{ $colorClass }}">
        <x-dynamic-component :component="$icon" class="w-6 h-6" />
    </div>
    <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-500 truncate">{{ $title }}</p>
        <p class="text-2xl font-bold text-gray-900">{{ $value }}</p>
        @if($trend)
            <p class="text-xs text-gray-400 mt-0.5">{{ $trend }}</p>
        @endif
    </div>
</div>
```

---

## 19. Dashboard Principal

```blade
{{-- resources/views/dashboard/index.blade.php --}}
<x-app-layout>
    <div class="space-y-6">

        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
            <span class="text-sm text-gray-500">{{ now()->translatedFormat('l, d \\d\\e F \\d\\e Y') }}</span>
        </div>

        {{-- Estadísticas --}}
        <livewire:dashboard-stats />

        {{-- Taladros y bombas activas --}}
        @foreach($rigs as $rig)
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <x-heroicon-o-cog-6-tooth class="w-5 h-5 text-blue-600" />
                    <h2 class="font-bold text-gray-900">{{ $rig->name }}</h2>
                    <span class="text-sm text-gray-400">{{ $rig->location }}</span>
                </div>
                <a href="{{ route('rigs.show', $rig) }}"
                   class="text-sm text-blue-600 hover:underline">Ver detalle →</a>
            </div>

            <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @foreach($rig->pumps()->where('active', true)->get() as $pump)
                <x-pump-card :pump="$pump" />
                @endforeach
            </div>
        </div>
        @endforeach

        {{-- Panel de alertas recientes --}}
        <livewire:alerts-panel />

    </div>
</x-app-layout>
```

---

## 20. Instrucciones finales de instalación y verificación

Una vez implementado todo, ejecutar en este orden:

```bash
# 1. Instalar todas las dependencias
composer install
npm install

# 2. Configurar environment
cp .env.example .env
php artisan key:generate
# Editar .env con los datos de MySQL correctos

# 3. Ejecutar migraciones y seeders
php artisan migrate:fresh --seed

# 4. Compilar assets
npm run build

# 5. Iniciar servidor
php artisan serve

# 6. Verificar en el navegador
# → http://localhost:8000
# Login: admin@pumptracker.com / password
```

### Checklist de verificación post-instalación

- [ ] Login con admin funciona correctamente
- [ ] Dashboard muestra estadísticas de RIG158
- [ ] Se puede navegar a RIG158 → Bomba 1
- [ ] Formulario de registro diario carga los 24 componentes (3 posiciones × 8)
- [ ] Al ingresar horas trabajadas, las horas de los componentes se actualizan en tiempo real
- [ ] Marcar checkbox "cambio" muestra el campo de nuevo serial y resetea las horas a las del día
- [ ] Guardar un registro crea daily_log + 24 component_hours en la BD
- [ ] El PDF se genera correctamente en formato landscape con todas las columnas
- [ ] Las alertas aparecen cuando un componente supera los umbrales
- [ ] El indicador offline/online funciona en la navbar
- [ ] Usuarios con rol `encuellador` NO pueden gestionar taladros

---

*Documento generado para Claude Code — Pump Tracker v1.0 — Laravel 11 + Livewire 3*
