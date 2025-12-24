# BM-Finance - Finance & Accounting

> **Status:** Planning | **Type:** Standalone Module | **Priority:** P3

## Overview

BM-Finance is a **standalone module** providing comprehensive financial management capabilities including transaction categorization, accounts receivable/invoicing, cash flow strategy, and expense auditing.

**Standalone with Built-in Analytics:** Includes its own financial analytics dashboard (cash flow, P&L, budgets). Works independently with full functionality.

## Agent Team (4)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-finance.bookkeeper` | Bookkeeper | Transaction Categorization - classifies expenses | Planned |
| `@bm-finance.controller` | Controller | AR/Invoicing - manages receivables and billing | Planned |
| `@bm-finance.cfo` | CFO | Cash Flow Strategy - financial planning and forecasting | Planned |
| `@bm-finance.compliance` | Compliance | Expense Auditing - ensures policy compliance | Planned |

## Key Integrations

**Standalone Module** - Works independently with full functionality.

**Enhanced When Installed With:**
- Core-PM (financial project tracking)
- BM-CRM (deal financial data, customer payment status)
- BM-Sales (order invoicing, commission calculations)
- BM-HR (payroll, compensation)
- BM-Ads (ad spend tracking, ROI)
- BM-Marketing (budget tracking)
- BM-Analytics (AI-powered financial recommendations)

**Event Patterns:**
- `finance.invoice.created` - New invoice generated
- `finance.invoice.sent` - Invoice delivered to customer
- `finance.invoice.paid` - Payment received
- `finance.invoice.overdue` - Payment past due
- `finance.expense.recorded` - Expense logged
- `finance.expense.flagged` - Compliance issue detected
- `finance.budget.alert` - Budget threshold reached

## Data Model (Planned)

- **Invoice** - Customer billing records
- **Payment** - Received payments
- **Expense** - Business expenses
- **Transaction** - All financial transactions
- **Budget** - Department/project budgets
- **FinancialReport** - Generated financial statements

## Documentation

- **Module Brief:** See [BM-FINANCE-MODULE-BRIEF.md](./BM-FINANCE-MODULE-BRIEF.md)
- **Research:** See [research/](./research/) directory
- **Architecture:** See [Cross-Module Architecture](/docs/architecture/cross-module-architecture.md)
- **Agent Registry:** `@bm-finance.*` handles defined in architecture doc

---

*Module Status: Standalone module - works independently, enhanced with other modules*
