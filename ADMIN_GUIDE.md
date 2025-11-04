# Guía de Administración - Aprobación de Depósitos y Retiros

## Funciones Disponibles

He creado funciones SQL para facilitar la aprobación y rechazo de depósitos y retiros directamente desde la base de datos.

---

## 1. Ver Transacciones Pendientes

### Ver Depósitos Pendientes
```sql
SELECT * FROM list_pending_deposits();
```

Muestra:
- ID de la transacción
- ID del usuario
- Email del usuario
- Monto
- Hash de transacción (si se proporcionó)
- Fecha de creación

### Ver Retiros Pendientes
```sql
SELECT * FROM list_pending_withdrawals();
```

Muestra:
- ID del retiro
- ID del usuario
- Email del usuario
- Monto
- Dirección USDT
- Fecha de solicitud

---

## 2. Aprobar Depósitos

Para aprobar un depósito y agregar los fondos al balance del usuario:

```sql
SELECT approve_deposit(
  'TRANSACTION_ID_AQUI',
  'Nota opcional del admin'
);
```

**Ejemplo real con uno de tus depósitos:**
```sql
-- Aprobar el depósito de $1000 de deivimarte050@gmail.com
SELECT approve_deposit('f3c75f6e-f98d-4a11-9b51-354dfe22ef62', 'Depósito verificado');
```

**Qué hace:**
- ✅ Cambia el estado de la transacción a "completed"
- ✅ Agrega el monto al balance del usuario
- ✅ Actualiza la fecha de modificación del perfil

---

## 3. Rechazar Depósitos

Para rechazar un depósito (no se agregan fondos):

```sql
SELECT reject_deposit(
  'TRANSACTION_ID_AQUI',
  'Razón del rechazo'
);
```

**Ejemplo:**
```sql
-- Rechazar un depósito
SELECT reject_deposit(
  '729ca096-7e71-495d-8c53-7f2455e3e8ed',
  'Hash de transacción inválido'
);
```

**Qué hace:**
- ❌ Cambia el estado de la transacción a "rejected"
- ❌ NO agrega fondos al usuario
- 📝 Guarda la razón del rechazo

---

## 4. Aprobar Retiros

Para aprobar un retiro (los fondos ya fueron deducidos cuando el usuario hizo la solicitud):

```sql
SELECT approve_withdrawal(
  'WITHDRAWAL_ID_AQUI',
  'Nota opcional - ej: Hash de transacción de envío'
);
```

**Ejemplo real con uno de tus retiros:**
```sql
-- Aprobar el retiro de $90 de deivimarte050@gmail.com
SELECT approve_withdrawal(
  '5f8586f3-fdb2-4ea4-80ed-1966622f76a9',
  'TX Hash: 0x123456789abcdef'
);
```

**Qué hace:**
- ✅ Cambia el estado del retiro a "completed"
- ✅ Crea un registro en transacciones como completado
- 📝 Guarda las notas del admin

---

## 5. Rechazar Retiros

Para rechazar un retiro y devolver los fondos al usuario:

```sql
SELECT reject_withdrawal(
  'WITHDRAWAL_ID_AQUI',
  'Razón del rechazo'
);
```

**Ejemplo:**
```sql
-- Rechazar un retiro
SELECT reject_withdrawal(
  'ee549662-abf6-428d-b674-b3f9893cc4d0',
  'Dirección de wallet inválida'
);
```

**Qué hace:**
- ❌ Cambia el estado del retiro a "rejected"
- 💰 DEVUELVE los fondos al balance del usuario
- 📝 Guarda la razón del rechazo
- 📝 Crea un registro en transacciones como rechazado

---

## 6. Comandos Rápidos para Procesar Todo

### Aprobar TODOS los depósitos pendientes de un usuario específico
```sql
DO $$
DECLARE
  deposit_record RECORD;
BEGIN
  FOR deposit_record IN
    SELECT id FROM list_pending_deposits()
    WHERE user_email = 'deivimarte050@gmail.com'
  LOOP
    PERFORM approve_deposit(deposit_record.id, 'Aprobado en lote');
  END LOOP;
END $$;
```

### Ver balance actual de un usuario
```sql
SELECT email, balance, total_invested, total_earnings
FROM profiles
WHERE email = 'deivimarte050@gmail.com';
```

---

## 7. Verificar Resultados

Después de aprobar/rechazar, verifica:

```sql
-- Ver balance actualizado del usuario
SELECT email, balance FROM profiles WHERE email = 'EMAIL_AQUI';

-- Ver historial de transacciones del usuario
SELECT type, amount, status, description, created_at
FROM transactions
WHERE user_id = (SELECT id FROM profiles WHERE email = 'EMAIL_AQUI')
ORDER BY created_at DESC
LIMIT 10;

-- Ver estado de retiros
SELECT amount, usdt_address, status, admin_notes, processed_at
FROM withdrawal_requests
WHERE user_id = (SELECT id FROM profiles WHERE email = 'EMAIL_AQUI')
ORDER BY requested_at DESC;
```

---

## Flujo de Trabajo Recomendado

1. **Revisar pendientes:**
   ```sql
   SELECT * FROM list_pending_deposits();
   SELECT * FROM list_pending_withdrawals();
   ```

2. **Verificar el depósito/retiro** (revisar hash de transacción, validar monto, etc.)

3. **Aprobar o rechazar:**
   ```sql
   -- Si es válido:
   SELECT approve_deposit('ID_AQUI', 'Verificado');

   -- Si no es válido:
   SELECT reject_deposit('ID_AQUI', 'Razón específica');
   ```

4. **Confirmar que se procesó correctamente:**
   ```sql
   SELECT * FROM list_pending_deposits(); -- Debe haber uno menos
   ```

---

## Notas Importantes

- ⚠️ **Depósitos:** Solo se agregan fondos cuando APRUEBAS, no cuando el usuario lo envía
- ⚠️ **Retiros:** Los fondos se deducen INMEDIATAMENTE cuando el usuario solicita, si rechazas se DEVUELVEN
- 💡 **Tip:** Siempre agrega notas descriptivas para mantener un registro claro
- 🔒 **Seguridad:** Estas funciones están protegidas con SECURITY DEFINER

---

## Ejemplos de Uso Rápido

```sql
-- 1. Ver todos los pendientes
SELECT * FROM list_pending_deposits();

-- 2. Aprobar un depósito específico
SELECT approve_deposit('f3c75f6e-f98d-4a11-9b51-354dfe22ef62', 'Verificado en blockchain');

-- 3. Ver el balance actualizado
SELECT email, balance FROM profiles WHERE email = 'deivimarte050@gmail.com';
```
