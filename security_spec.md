# Security Specification for Metamatrix Sanctuary

## 1. Data Invariants
- A **Trade** must reference a valid **TradingAgent**.
- A **TradingAgent** can only be created by an authenticated user (in this case, the system node).
- **RiskStatus** is system-generated and immutable once written.
- **NotebookContext** belongs to the system/user who ingested it.

## 2. The "Dirty Dozen" Payloads (Denial Tests)
1. Creating a agent with a negative budget.
2. Updating an agent's `status` to 'active' without a budget.
3. Injecting a 1MB string into the `asset` field.
4. Overwriting the `created_at` timestamp.
5. Deleting historical `trades` (immutability rule).
6. Modifying another user's `notebooks`.
7. Creating a trade with `confidence > 1.0`.
8. Updating `total_profit_loss` manually via client (system-only).
9. Path poisoning: Accessing `notebooks/../../secrets`.
10. Spoofing `request.auth.uid`.
11. Reading PII (if any) without permission.
12. Bulk reading collections without filter.

## 3. Test Runner Strategy
We will use `@firebase/rules-unit-testing` patterns to ensure all invalid writes are rejected.
