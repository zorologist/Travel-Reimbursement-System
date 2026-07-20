# Workflow

```text
Employee submits
  → Manager approves or rejects
  → PR verifies accommodation and may add a comment
  → Transportation verifies destination, method, cost, and attachments
  → Timing verifies dates and identifies same-day (0 nights) or overnight travel
  → Salary adjusts and finalizes
  → Completed and locked
```

Only Manager may reject, and a reason is required. PR, Transportation, and Timing may edit only their assigned fields before approving. Salary may edit bonus/penalty and finalize, but cannot reject. Completed and cancelled requests cannot be changed. Every material edit and transition creates an audit event; every calculation change creates an append-only price revision.
