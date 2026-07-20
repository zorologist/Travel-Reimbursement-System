# Salary Rules

- Full nights use the employee's daily rate multiplied by the accommodation factor.
- Same-day travel with at least seven verified hours receives 50% of the daily rate.
- Overnight travel with at least seven verified return-day hours receives an additional 30% of the daily rate.
- Same-day and overnight allowances cannot both apply.
- Transportation cost is separate from allowance.
- Salary may add a fixed bonus or penalty with an audit note.
- The backend calculates and stores the official result; browser totals are never trusted.
- Monetary outputs are rounded to two decimal places.

The tested implementation lives in `shared/salary/calculateSalary.ts` and is used by both applications.
