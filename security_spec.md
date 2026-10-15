# Security Specification & Threat Model

## 1. Data Invariants
1. **Inventory Integrity**:
   - `quantity` and `minThreshold` must be numeric and non-negative.
   - `sku`, `name`, `category`, and `unit` cannot be empty strings and must respect boundary limits.
   - Updates to stock levels must record valid status ('in_stock', 'low_stock', 'out_of_stock').
2. **Team Task Management**:
   - Every task must possess a valid title (max 160 chars), priority ('urgent' | 'high' | 'medium' | 'low'), and status ('pending' | 'in_progress' | 'review' | 'completed').
   - Task assignment to team members must either be empty string (unassigned) or reference a valid member ID string.
3. **Team Member Allocation**:
   - Maximum capacity must be greater than 0.
   - Role and department must be non-empty strings.
4. **Audit Immutability**:
   - `inventory_logs` entries represent historical financial and stock audit trails. Once created, they cannot be updated or deleted.
5. **Path Variable Hardening**:
   - All document IDs ({itemId}, {taskId}, {memberId}, {logId}) must strictly conform to alphanumeric and hyphen/underscore characters (`isValidId`) up to 128 characters.

## 2. The "Dirty Dozen" Threat Payloads (Must Be Rejected)

1. **Payload 1: Inventory Shadow Injection**
   - Attempt: Inserting unknown field `isAdmin: true` into an `/inventory` item.
   - Expected Result: Rejected (keys must strictly conform).
2. **Payload 2: Negative Quantity Exploit**
   - Attempt: `{ "quantity": -500, "sku": "A1", ... }`.
   - Expected Result: Rejected (quantity must be >= 0).
3. **Payload 3: Giant String Denial of Wallet**
   - Attempt: Setting `name` to a 5MB unicode payload.
   - Expected Result: Rejected (size bounded by schema).
4. **Payload 4: Task Status Bypass**
   - Attempt: Updating `status` to an invalid state like `"hacked_done"`.
   - Expected Result: Rejected (status must be within enum).
5. **Payload 5: Audit Log Tampering**
   - Attempt: Calling `update` or `delete` on an `/inventory_logs/{logId}` document.
   - Expected Result: Rejected (audit logs are strictly create/read only, no updates or deletes permitted).
6. **Payload 6: Document ID Path Poisoning**
   - Attempt: Using `../../admin` or arbitrary unicode control characters as `itemId`.
   - Expected Result: Rejected by `isValidId`.
7. **Payload 7: Unbounded Member Skills List**
   - Attempt: Injecting 10,000 array elements into `skills` list.
   - Expected Result: Rejected (bounded array length <= 20).
8. **Payload 8: Task Priority Poisoning**
   - Attempt: Creating task with `priority: "godmode"`.
   - Expected Result: Rejected (must be urgent, high, medium, or low).
9. **Payload 9: Capacity Zero or Negative**
   - Attempt: Setting team member `maxCapacity` to -5.
   - Expected Result: Rejected (capacity must be > 0).
10. **Payload 10: Blank SKU Exploit**
    - Attempt: Creating inventory item with empty `sku: ""`.
    - Expected Result: Rejected (sku size >= 1).
11. **Payload 11: Team Member Name Omission**
    - Attempt: Creating team member missing required `name` field.
    - Expected Result: Rejected by `hasAll` requirement.
12. **Payload 12: Arbitrary Root Collection Write**
    - Attempt: Writing to an undefined collection `/secrets/credentials`.
    - Expected Result: Rejected by default-deny catch-all rule.
