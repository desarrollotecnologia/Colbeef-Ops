# Modulo Verificacion PCC

**Proyecto:** Liberacion de Canales  
**Modulo:** Verificacion PCC  
**Tipo:** Modulo operativo Livewire con lectura de BD externa SIRT/trazabilidad  
**Documento:** Descripcion tecnica y funcional del modulo  

---

## 1. Objetivo del modulo

El modulo de Verificacion PCC permite registrar el cumplimiento o no cumplimiento de dos medias canales asociadas a un producto proveniente de la base de datos externa de trazabilidad/SIRT.

La pantalla trabaja como una cola de verificacion:

1. Consulta productos del dia operativo actual en la BD externa.
2. Descarta los productos que ya fueron verificados en esta aplicacion durante el mismo turno.
3. Muestra el primer producto pendiente.
4. Permite marcar si la media canal 1 cumple o no cumple.
5. Permite marcar si la media canal 2 cumple o no cumple.
6. Permite guardar observacion y accion correctiva.
7. Persiste el registro local con snapshot del dato externo.
8. Avanza automaticamente al siguiente producto pendiente.

---

## 2. Archivos principales

| Archivo | Responsabilidad |
| --- | --- |
| `routes/web.php` | Define rutas del modulo, historial y exportacion Excel. |
| `app/Livewire/VerificacionPcc.php` | Componente principal de registro PCC. |
| `resources/views/livewire/verificacion-pcc.blade.php` | Vista del formulario operativo. |
| `app/Livewire/VerificacionPccHistorial.php` | Componente de historial con filtro por dia operativo. |
| `resources/views/livewire/verificacion-pcc-historial.blade.php` | Vista del historial en tabla/tarjetas y boton Excel. |
| `app/Services/TrazabilidadInsensibilizacionReader.php` | Servicio que consulta la BD externa de SIRT/trazabilidad. |
| `app/Support/TurnoVerificacionPcc.php` | Utilidad que calcula fecha operativa y ventana del turno PCC. |
| `app/Models/VerificacionPccRegistro.php` | Modelo Eloquent de registros guardados localmente. |
| `app/Http/Controllers/VerificacionPccHistorialExcelController.php` | Controlador de descarga Excel del historial. |
| `app/Exports/VerificacionPccRegistrosExport.php` | Exportador Excel. |
| `config/verificacion_pcc.php` | Configuracion de hora de cierre del turno PCC. |
| `config/database.php` | Conexion `pgsql_trazabilidad` hacia la BD externa. |

---

## 3. Rutas del modulo

Las rutas estan dentro del grupo autenticado en `routes/web.php`.

```php
Route::get('/verificacion-pcc', VerificacionPcc::class)
    ->name('verificacion-pcc');

Route::get('/verificacion-pcc/historial', VerificacionPccHistorial::class)
    ->name('verificacion-pcc.historial');

Route::get('/verificacion-pcc/historial/excel', VerificacionPccHistorialExcelController::class)
    ->name('verificacion-pcc.historial.excel');
```

Rutas funcionales:

- `/verificacion-pcc`: pantalla principal de registro.
- `/verificacion-pcc/historial`: historial de verificaciones guardadas.
- `/verificacion-pcc/historial/excel`: descarga Excel del historial, filtrado o completo.

---

## 4. Permisos y acceso

El modulo usa autorizacion por menu, no una regla hardcodeada dentro de la ruta.

En `VerificacionPcc` y `VerificacionPccHistorial` se llama:

```php
$this->autorizarVistaMenu('verificacion-pcc');
```

Esa validacion viene del trait:

```php
App\Livewire\Concerns\AuthorizaPorMenuModulo
```

La autorizacion compara el rol normalizado del usuario contra la fila de `menu_modulos` cuyo campo `vista` es `verificacion-pcc`.

Roles configurados para el modulo:

- `OPERACIONES`
- `CALIDAD`
- `ADMINISTRADOR`
- `GERENCIA`

La exportacion Excel tambien valida permisos en el controlador `VerificacionPccHistorialExcelController`, consultando `MenuModulo::where('vista', 'verificacion-pcc')`.

---

## 5. Conexion con BD externa SIRT/trazabilidad

La conexion externa se llama:

```php
pgsql_trazabilidad
```

Esta definida en `config/database.php`.

Variables admitidas:

```env
DB_TRAZABILIDAD_URL=
DB_TRAZABILIDAD_HOST=
DB_TRAZABILIDAD_PORT=
DB_TRAZABILIDAD_DATABASE=
DB_TRAZABILIDAD_USERNAME=
DB_TRAZABILIDAD_PASSWORD=
DB_TRAZABILIDAD_SEARCH_PATH=trazabilidad_proceso,organizaciones,public
```

Tambien puede tomar variables con prefijo `POSTGRES_*`:

```env
POSTGRES_HOST=
POSTGRES_PORT=
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
```

Si la conexion no tiene base de datos configurada, el servicio devuelve coleccion vacia y la vista muestra un mensaje indicando que la BD externa no esta configurada.

---

## 6. Consulta SQL usada contra SIRT/trazabilidad

La consulta esta en:

```text
app/Services/TrazabilidadInsensibilizacionReader.php
```

Metodo:

```php
sqlInsensibilizacionParaDiaOperativo()
```

Consulta:

```sql
SELECT DISTINCT ON (ins.id)
    ins.id,
    ins.id_proceso,
    ins.id_parte_producto,
    ins.id_producto,
    ins.fecha_registro,
    ins.hora_registro,
    pfp.id_plan_faena,
    pft.id_registro_turno,
    pft.user_name AS usuario_turno,
    e.nombre AS nombre_empresa,
    pe.fecha_registro AS fecha_asociacion,
    pe.hora_registro AS hora_asociacion
FROM trazabilidad_proceso.insensibilizacion ins
LEFT JOIN trazabilidad_proceso.plan_faena_producto pfp
    ON ins.id_producto = pfp.id_producto
LEFT JOIN trazabilidad_proceso.plan_faena_turno pft
    ON pfp.id_plan_faena = pft.id_plan_faena
LEFT JOIN trazabilidad_proceso.producto_empresa pe
    ON ins.id_producto = pe.id_producto
LEFT JOIN organizaciones.empresa e
    ON pe.id_empresa = e.id
WHERE ins.fecha_registro IS NOT NULL
    AND (
        (
            (ins.fecha_registro)::date = CAST(? AS date)
            AND (
                ins.hora_registro IS NULL
                OR EXTRACT(HOUR FROM ins.hora_registro)::int >= ?
            )
        )
        OR (
            (ins.fecha_registro)::date = (CAST(? AS date) + INTERVAL '1 day')::date
            AND ins.hora_registro IS NOT NULL
            AND EXTRACT(HOUR FROM ins.hora_registro)::int < ?
        )
    )
ORDER BY ins.id ASC, pe.fecha_registro DESC NULLS LAST, pe.hora_registro DESC NULLS LAST
LIMIT 5000
```

Parametros enviados:

```php
[$fechaYmd, $horaLimite, $fechaYmd, $horaLimite]
```

Donde:

- `$fechaYmd`: fecha operativa en formato `Y-m-d`.
- `$horaLimite`: hora de cierre del turno, por defecto `7`.

La consulta usa `DISTINCT ON (ins.id)` para evitar duplicados por insensibilizacion y ordena por `ins.id ASC`, tomando la asociacion de propietario mas reciente por `fecha_asociacion` y `hora_asociacion`.

---

## 7. Dia operativo PCC

El modulo no trabaja solamente con fecha calendario. Trabaja con dia operativo PCC.

La regla esta centralizada en:

```text
app/Support/TurnoVerificacionPcc.php
```

Con la configuracion por defecto:

```php
'turno_hora_fin' => (int) env('VERIFICACION_PCC_TURNO_HORA_FIN', 7)
```

Regla:

- Si la hora actual es menor a `7`, la fecha operativa es el dia calendario anterior.
- Si la hora actual es igual o mayor a `7`, la fecha operativa es el dia calendario actual.

Ventana del turno:

```text
Dia D 07:00:00 hasta Dia D+1 06:59:59
```

Esto aplica para:

- Consultar insensibilizaciones externas.
- Evitar duplicados de verificacion durante el mismo turno.
- Filtrar historial por dia operativo.
- Exportar Excel por dia operativo.

---

## 8. Flujo tecnico del registro

Archivo principal:

```text
app/Livewire/VerificacionPcc.php
```

Flujo:

1. `mount()` valida acceso al modulo con `autorizarVistaMenu('verificacion-pcc')`.
2. `fechaOperativaYmd()` calcula la fecha operativa del turno actual.
3. `coleccionExternaDelDia()` instancia `TrazabilidadInsensibilizacionReader`.
4. Si la conexion externa no esta lista, retorna coleccion vacia.
5. Si la conexion esta lista, llama `filasParaDiaOperativo($fechaYmd)`.
6. La respuesta externa se convierte a array para usarla en Livewire.
7. `idsInsVerificadosHoy()` consulta IDs externos ya registrados localmente en la ventana del turno.
8. `pendientesParaVerificar()` filtra los externos que todavia no existen en la app local.
9. `render()` toma el primer pendiente como `$filaActual`.
10. La vista muestra `id_producto`, propietario y controles de cumplimiento.
11. Al guardar, `guardar()` vuelve a calcular pendientes y toma el primer registro actual.
12. Valida cumplimiento de media canal 1 y 2, observacion y accion correctiva.
13. Resuelve responsable del puesto Desinfeccion para la fecha operativa.
14. Crea un registro en `verificacion_pcc_registros`.
15. Limpia el formulario y muestra mensaje de exito.

---

## 9. Datos guardados localmente

Tabla:

```text
verificacion_pcc_registros
```

Modelo:

```text
App\Models\VerificacionPccRegistro
```

Campos principales:

| Campo | Proposito |
| --- | --- |
| `id` | ID local autoincremental. |
| `user_id` | Usuario que hizo la verificacion. |
| `external_ins_id` | ID de insensibilizacion externo (`ins.id`). |
| `id_producto` | Codigo de producto proveniente de trazabilidad/SIRT. |
| `snapshot_externo` | Copia JSON del registro externo al momento de guardar. |
| `cumple_media_canal_1` | Booleano de cumplimiento para media canal 1. |
| `cumple_media_canal_2` | Booleano de cumplimiento para media canal 2. |
| `responsable_puesto_trabajo` | Operario asignado al puesto Desinfeccion para la fecha operativa. |
| `observacion` | Observacion opcional. |
| `accion_correctiva` | Accion correctiva opcional. |
| `created_at` / `updated_at` | Timestamps Laravel. |

El campo `id_producto` fue migrado a texto (`VARCHAR(96)`) para soportar codigos con guion u otros caracteres, por ejemplo `2604-00666`.

---

## 10. Snapshot externo

El campo `snapshot_externo` guarda una copia completa del registro consultado en la BD externa.

Ejemplo de datos que pueden quedar dentro del snapshot:

- `id`
- `id_proceso`
- `id_parte_producto`
- `id_producto`
- `fecha_registro`
- `hora_registro`
- `id_plan_faena`
- `id_registro_turno`
- `usuario_turno`
- `nombre_empresa`
- `fecha_asociacion`
- `hora_asociacion`

Este snapshot permite conservar trazabilidad aunque despues cambie la informacion en la BD externa.

---

## 11. Responsable del puesto de trabajo

El responsable se calcula en:

```php
VerificacionPccRegistro::operarioDesinfeccionParaFecha($fecha)
```

La logica:

1. Busca el puesto de trabajo llamado `Desinfeccion` o `Desinfección`.
2. Busca en `operarios_por_dia` la asignacion para la fecha operativa.
3. Carga el operario relacionado.
4. Guarda el nombre en `responsable_puesto_trabajo`.

Si no encuentra puesto u operario, guarda `null`.

Para mostrar el historial se usa:

```php
responsablePuestoResuelto()
```

Ese metodo devuelve:

- El responsable guardado, si existe.
- Si no existe, intenta resolverlo nuevamente segun la fecha del registro.
- Si no puede resolverlo, muestra `—`.

---

## 12. Vista principal

Vista:

```text
resources/views/livewire/verificacion-pcc.blade.php
```

Elementos principales:

- Encabezado `Verificacion PCC`.
- Boton para ir a `Historial PCC`.
- Contadores:
  - Total del dia operativo.
  - Verificados.
  - Pendientes.
- Mensaje si la BD externa no esta configurada.
- Mensaje si no hay insensibilizaciones externas.
- Tarjeta con `ID producto`.
- Propietario tomado desde `nombre_empresa`.
- Radio buttons:
  - Media canal 1: Cumple / No cumple.
  - Media canal 2: Cumple / No cumple.
- Textarea de observacion.
- Textarea de accion correctiva.
- Boton `Guardar y pasar al siguiente`.

El boton se deshabilita si no hay fila pendiente.

---

## 13. Historial PCC

Componente:

```text
app/Livewire/VerificacionPccHistorial.php
```

Vista:

```text
resources/views/livewire/verificacion-pcc-historial.blade.php
```

Funciones:

- Muestra registros guardados.
- Permite filtrar por dia operativo.
- Pagina resultados de 20 en 20.
- Muestra vista movil en tarjetas.
- Muestra vista escritorio en tabla.
- Permite descargar Excel.

Filtro por fecha:

```php
[$desde, $hasta] = TurnoVerificacionPcc::ventanaCreacionParaFechaOperativa($this->fecha_filtro);

$query->whereBetween('created_at', [$desde, $hasta]);
```

Columnas visibles:

- Fecha.
- ID producto.
- Media canal 1.
- Media canal 2.
- Responsable.
- Observacion.
- Accion correctiva.
- Usuario.

---

## 14. Exportacion Excel

Ruta:

```text
/verificacion-pcc/historial/excel
```

Controlador:

```text
app/Http/Controllers/VerificacionPccHistorialExcelController.php
```

Exportador:

```text
app/Exports/VerificacionPccRegistrosExport.php
```

Nombre del archivo:

```text
verificacion-pcc_historial_{fecha|todos}.xlsx
```

Ejemplos:

```text
verificacion-pcc_historial_20260923.xlsx
verificacion-pcc_historial_todos.xlsx
```

Columnas del Excel:

- Fecha y hora.
- ID producto.
- Propietario (snapshot).
- Media canal 1.
- Media canal 2.
- Responsable puesto.
- Observacion.
- Accion correctiva.
- Usuario registro.
- ID ins. externo.

Si se envia parametro `fecha`, el exportador filtra por la ventana del dia operativo usando `TurnoVerificacionPcc`.

---

## 15. Estructura final de base de datos

La tabla fue creada inicialmente con columnas numericas de media canal y luego se refactorizo para guardar cumplimiento booleano por media.

Estado funcional final:

```text
verificacion_pcc_registros
  id
  user_id
  external_ins_id
  id_producto
  snapshot_externo
  cumple_media_canal_1
  cumple_media_canal_2
  responsable_puesto_trabajo
  observacion
  accion_correctiva
  created_at
  updated_at
```

Migraciones relacionadas:

- `2026_04_29_200000_create_verificacion_pcc_registros_table.php`
- `2026_04_29_220000_refactor_verificacion_pcc_medias_cumple_boolean.php`
- `2026_04_29_230000_change_verificacion_pcc_id_producto_to_string.php`
- `2026_04_30_120000_add_observacion_accion_correctiva_to_verificacion_pcc_registros.php`
- `2026_04_29_201000_ensure_menu_modulo_verificacion_pcc.php`
- `2026_04_30_140000_menu_verificacion_pcc_after_indicador_diario.php`

---

## 16. Validaciones principales

En `guardar()`:

```php
$this->validate([
    'cumple_media_canal_1' => ['required', 'in:0,1'],
    'cumple_media_canal_2' => ['required', 'in:0,1'],
    'observacion' => ['nullable', 'string', 'max:5000'],
    'accion_correctiva' => ['nullable', 'string', 'max:5000'],
]);
```

Validaciones adicionales:

- Si no hay pendiente actual, no guarda.
- Si el registro externo no tiene `id_producto`, no guarda.
- Si la conexion externa no esta configurada, no hay cola para verificar.
- Si el `external_ins_id` ya fue guardado en el turno, se excluye de pendientes.

---

## 17. Prevencion de duplicados

La prevencion de duplicados se hace por turno operativo usando `external_ins_id`.

Metodo:

```php
idsInsVerificadosHoy()
```

Consulta local:

```php
VerificacionPccRegistro::query()
    ->whereBetween('created_at', [$desde, $hasta])
    ->whereNotNull('external_ins_id')
    ->pluck('external_ins_id')
```

Luego `pendientesParaVerificar()` excluye cualquier fila externa cuyo `ins.id` ya este en esa lista.

---

## 18. Diagrama de flujo

```text
Usuario abre /verificacion-pcc
        |
        v
AutorizaPorMenuModulo valida acceso
        |
        v
TurnoVerificacionPcc calcula fecha operativa
        |
        v
TrazabilidadInsensibilizacionReader consulta BD SIRT/trazabilidad
        |
        v
VerificacionPcc obtiene IDs ya guardados en el turno
        |
        v
Filtra pendientes
        |
        v
Muestra primer producto pendiente
        |
        v
Usuario marca MC1 / MC2, observacion y accion correctiva
        |
        v
guardar()
        |
        v
Crea VerificacionPccRegistro con snapshot_externo
        |
        v
Pantalla se refresca y muestra el siguiente pendiente
```

---

## 19. Puntos de mantenimiento

- La consulta externa depende de los esquemas `trazabilidad_proceso` y `organizaciones`.
- Si SIRT cambia nombres de tablas o columnas, se debe actualizar `TrazabilidadInsensibilizacionReader`.
- Si cambia la hora de cierre del turno, ajustar `VERIFICACION_PCC_TURNO_HORA_FIN`.
- El filtro de historial y la consulta externa deben permanecer alineados con `TurnoVerificacionPcc`.
- Antes de cambiar la logica de duplicados, revisar impacto de `external_ins_id`.
- El campo `snapshot_externo` es clave para auditoria; no debe eliminarse sin reemplazo.
- Si se necesita mas privacidad, revisar permisos de `MenuModulo` y acceso al Excel.

---

## 20. Resumen tecnico

El modulo Verificacion PCC esta construido como un componente Livewire conectado a una BD externa de trazabilidad/SIRT. La aplicacion no copia toda la informacion externa de forma masiva; consulta la cola del dia operativo, muestra el primer pendiente, registra el resultado localmente y conserva un snapshot del dato externo.

La pieza mas importante del modulo es la coherencia entre:

- Fecha operativa.
- Consulta externa.
- Ventana local de registros ya verificados.
- Historial.
- Exportacion Excel.

Mientras todos esos puntos usen `TurnoVerificacionPcc`, el modulo mantiene una sola regla de turno y evita duplicar verificaciones dentro del mismo dia operativo.
