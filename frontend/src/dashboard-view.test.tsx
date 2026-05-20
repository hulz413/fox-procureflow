import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProcurementDashboardView } from './features/dashboard/ProcurementDashboardView'
import { localizedContent } from './i18n/localizedContent'
import type { CompanyContext, ProcurementDashboard } from './domain/types'

const messages = localizedContent.zh
const companies: CompanyContext[] = [
  {
    active: true,
    businessScope: '信息技术设备、软件订阅、办公采购',
    companyId: 'company-digital',
    companyName: '星河数字科技有限公司',
  },
  {
    active: true,
    businessScope: '生产耗材、设备备件、物流服务',
    companyId: 'company-manufacturing',
    companyName: '星河智能制造有限公司',
  },
]
const generatedAt = '2026-05-20T15:36:00Z'
const dashboard: ProcurementDashboard = {
  companyId: null,
  companyIds: ['company-digital', 'company-manufacturing'],
  companyName: null,
  documentFunnel: [],
  exceptionHighlights: [],
  generatedAt,
  groupId: 'group-galaxy',
  groupName: '星河控股集团',
  scope: 'GROUP',
  spendTrend: [],
  statusDistributions: [],
  summary: [
    { currency: 'CNY', generatedAt, key: 'issuedPoAmount', label: messages.dashboard.issuedPoAmount, value: 670994 },
    { currency: null, generatedAt, key: 'pendingApprovals', label: messages.dashboard.pendingApprovals, value: 8 },
    { currency: null, generatedAt, key: 'activeRfqs', label: messages.dashboard.activeRfqs, value: 3 },
    { currency: null, generatedAt, key: 'issuedPurchaseOrders', label: messages.dashboard.issuedPurchaseOrders, value: 14 },
    { currency: null, generatedAt, key: 'receiptInvoiceFollowUp', label: messages.dashboard.receiptInvoiceFollowUp, value: 3 },
    { currency: null, generatedAt, key: 'matchingExceptions', label: messages.dashboard.matchingExceptions, value: 4 },
  ],
  supplierDistribution: [],
}

afterEach(() => {
  cleanup()
})

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="route">{`${location.pathname}${location.search}`}</output>
}

function renderDashboard(
  canChangeScope: boolean,
  options: {
    dashboard?: ProcurementDashboard | null
    onCompanyChange?: (companyId: string) => void
    onScopeChange?: (scopeValue: string) => void
  } = {},
) {
  const onCompanyChange = options.onCompanyChange ?? vi.fn()
  const onScopeChange = options.onScopeChange ?? vi.fn()
  const view = render(
    <MemoryRouter>
      <ProcurementDashboardView
        canChangeScope={canChangeScope}
        companies={companies}
        dashboard={options.dashboard ?? null}
        errorMessage={null}
        isError={false}
        isLoading={false}
        language="zh"
        messages={messages}
        onCompanyChange={onCompanyChange}
        onScopeChange={onScopeChange}
        scopeValue={canChangeScope ? 'GROUP' : 'company-digital'}
      />
      <LocationProbe />
    </MemoryRouter>,
  )

  return { ...view, onCompanyChange, onScopeChange }
}

describe('procurement dashboard scope visibility', () => {
  it('shows group and company scope choices for administrators', () => {
    renderDashboard(true)

    expect(screen.getByText(messages.dashboard.scope)).toBeInTheDocument()
    expect(screen.getByText(messages.dashboard.groupScope)).toBeInTheDocument()
    expect(screen.getByText('星河数字科技有限公司')).toBeInTheDocument()
    expect(screen.getByText('星河智能制造有限公司')).toBeInTheDocument()
  })

  it('hides dashboard scope choices for company-scoped roles', () => {
    renderDashboard(false)

    expect(screen.queryByText(messages.dashboard.scope)).not.toBeInTheDocument()
    expect(screen.queryByText(messages.dashboard.groupScope)).not.toBeInTheDocument()
    expect(screen.queryByText('星河智能制造有限公司')).not.toBeInTheDocument()
  })

  it('opens the corresponding workbench from each dashboard KPI card', () => {
    const onCompanyChange = vi.fn()
    renderDashboard(true, {
      dashboard: {
        ...dashboard,
        companyId: 'company-manufacturing',
        companyName: '星河智能制造有限公司',
        scope: 'COMPANY',
      },
      onCompanyChange,
    })

    const expectedRoutes = [
      [messages.dashboard.issuedPoAmount, messages.header.purchaseOrdersTitle, '/purchase-orders'],
      [messages.dashboard.pendingApprovals, messages.header.approvalsTitle, '/approvals'],
      [messages.dashboard.activeRfqs, messages.header.rfqTitle, '/rfqs'],
      [messages.dashboard.issuedPurchaseOrders, messages.header.purchaseOrdersTitle, '/purchase-orders'],
      [messages.dashboard.receiptInvoiceFollowUp, messages.header.receiptInvoiceTitle, '/receipts-invoices'],
      [messages.dashboard.matchingExceptions, messages.header.matchingTitle, '/three-way-matching?tab=exceptions'],
    ] as const

    for (const [metricLabel, targetName, route] of expectedRoutes) {
      fireEvent.click(screen.getByRole('button', { name: `${metricLabel}，打开${targetName}` }))

      expect(screen.getByTestId('route')).toHaveTextContent(route)
    }
    expect(onCompanyChange).toHaveBeenCalledTimes(expectedRoutes.length)
    expect(onCompanyChange).toHaveBeenCalledWith('company-manufacturing')
  })
})
