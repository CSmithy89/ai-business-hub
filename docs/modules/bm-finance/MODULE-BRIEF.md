# BM-Finance Module Brief

**Module Code:** `bm-finance`
**Version:** 0.1.0
**Layer:** Operations (OPERATE Phase)
**Status:** Brief
**Dependencies:** `bm-crm` (for customer billing data), `bmp` (for budget targets)

---

## Executive Summary

The Finance Module (`bm-finance`) acts as an AI-powered "Fractional CFO" and Bookkeeping team. It automates the tedious work of transaction categorization, invoice chasing, and financial reporting.

It effectively replaces the manual work often outsourced to Pilot or Bench, while integrating real-time with the Business Plan from `bmp`.

### Core Value Proposition
- **Automated Bookkeeping:** AI that learns to categorize transactions from bank feeds.
- **Conversational CFO:** "What is my burn rate?" or "Can we afford to hire?" answered instantly.
- **Smart Invoicing:** Automated chasing of unpaid invoices (Accounts Receivable).
- **Cash Flow Forecasting:** Predictive models based on `bm-crm` pipeline and `bm-finance` actuals.

---

## Module Architecture

### Agent Team (4 Agents)

| Agent | Code Name | Role | Key Capabilities |
|-------|-----------|------|------------------|
| **Bookkeeper** | `ledger-keeper` | Data Entry | Transaction categorization, receipt matching, reconciliation. |
| **Controller** | `ar-manager` | Operations | Invoicing, collections, payroll coordination. |
| **CFO** | `finance-strategist`| Strategy | Cash flow forecasting, burn rate analysis, budget vs actuals. |
| **Auditor** | `compliance-officer`| Risk | Expense policy enforcement, tax deadline tracking, anomaly detection. |

### Core Workflows

1.  **`reconcile-books`**
    *   Input: Bank feed transaction.
    *   Process: `Bookkeeper` matches to receipt -> Assigns Category -> Flags unknown for human review.

2.  **`manage-invoices`**
    *   Input: `bm-crm` Deal Won.
    *   Process: `Controller` generates Invoice -> Sends to Client -> Monitors payment -> Sends reminders.

3.  **`forecast-cashflow`**
    *   Input: Current Cash + `bm-crm` Probability Weighted Pipeline - Burn Rate.
    *   Process: `CFO` generates 12-week runway forecast.

4.  **`audit-expenses`**
    *   Input: Expense report.
    *   Process: `Auditor` checks against policy (e.g., "Dinner < $50") -> Approves/Rejects.

---

## Integration Points

| Module | Integration |
|--------|-------------|
| **BMP** | Actuals from `bm-finance` update the "Plan vs Actual" dashboards in `bmp`. |
| **BM-CRM** | Closed deals trigger invoices; Client payment status updates CRM. |
| **BM-HR** | Payroll data flows into expenses. |

## Data Models (Draft)

- **Transaction:** Date, Amount, Merchant, Category, Status.
- **Invoice:** Client, Items, Due Date, Status (Sent/Paid/Overdue).
- **Budget:** Category, Monthly Limit.
- **FinancialReport:** P&L, Balance Sheet, Cash Flow Statement.

---

## Recommendation
This module completes the "Back Office" automation suite. Together with `bm-hr` (People) and `bm-pr` (Reputation), it allows the Hub to run the *business* of the business.
