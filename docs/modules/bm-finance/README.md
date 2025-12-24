# BM-Finance - Finance & Accounting

> **Status:** Planning | **Priority:** P3

## Overview

BM-Finance provides comprehensive financial management capabilities including transaction categorization, accounts receivable/invoicing, cash flow strategy, and expense auditing. It helps businesses maintain financial health with AI-assisted bookkeeping and strategic financial guidance.

## Agent Team (4)

| Handle | Name | Role | Status |
|--------|------|------|--------|
| `@bm-finance.bookkeeper` | Bookkeeper | Transaction Categorization - classifies expenses | Planned |
| `@bm-finance.controller` | Controller | AR/Invoicing - manages receivables and billing | Planned |
| `@bm-finance.cfo` | CFO | Cash Flow Strategy - financial planning and forecasting | Planned |
| `@bm-finance.compliance` | Compliance | Expense Auditing - ensures policy compliance | Planned |

## Key Integrations

**Requires:**
- Core-PM (financial project tracking)

**Consumed By:**
- BM-CRM (deal financial data, customer payment status)
- BM-Sales (order invoicing, commission calculations)
- BM-HR (payroll, compensation)
- BM-Ads (ad spend tracking, ROI)
- BM-Marketing (budget tracking)

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

*Module Status: Awaiting prioritization after core modules*
