import { AlertOutlined, AuditOutlined, BankOutlined, DashboardOutlined, FileSearchOutlined, InboxOutlined, NodeIndexOutlined, ShoppingCartOutlined, SwapOutlined, TeamOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import { demoContext } from '../../domain/types'
import type { Language, CompanyContext, ProcurementDashboardScopeValue, DashboardMetric, SpendTrendPoint, DocumentFunnelStage, StatusDistributionBucket, SupplierDistributionItem, ExceptionHighlight, ProcurementDashboard } from '../../domain/types'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { formatCurrency, formatMatchSeverity, severityToneOf, formatDashboardExceptionReason, hasAmountVariance, formatDateTime } from '../../shared/utils/procurement'
import { TruncatedText, PanelTitle } from '../../shared/ui/common'

export function ProcurementDashboardView({
  canChangeScope,
  companies,
  dashboard,
  errorMessage,
  isError,
  isLoading,
  language,
  messages,
  onCompanyChange,
  onScopeChange,
  scopeValue,
}: {
  canChangeScope: boolean
  companies: CompanyContext[]
  dashboard: ProcurementDashboard | null
  errorMessage: string | null
  isError: boolean
  isLoading: boolean
  language: Language
  messages: LocalizedMessages
  onCompanyChange: (companyId: string) => void
  onScopeChange: (scopeValue: ProcurementDashboardScopeValue) => void
  scopeValue: ProcurementDashboardScopeValue
}) {
  const navigate = useNavigate()
  const metrics = dashboardMetricsInOrder(dashboard?.summary ?? [])
  const openMetricTarget = (metric: DashboardMetric) => {
    const targetPath = dashboardMetricTargetPath(metric.key)
    if (!targetPath) {
      return
    }

    if (dashboard?.companyId) {
      onCompanyChange(dashboard.companyId)
    }

    navigate(targetPath)
  }
  const openExceptionDetail = (exception: ExceptionHighlight) => {
    onCompanyChange(exception.companyId)
    navigate(`/three-way-matching?companyId=${encodeURIComponent(exception.companyId)}&matchId=${encodeURIComponent(exception.matchId)}`)
  }

  return (
    <div className="dashboard-page">
      {canChangeScope && (
        <section className="panel dashboard-scope-panel">
          <PanelTitle
            icon={<DashboardOutlined />}
            title={messages.dashboard.scope}
            aside={dashboard ? `${messages.dashboard.generatedAt}: ${formatDateTime(dashboard.generatedAt, language)}` : messages.dashboard.dataState}
          />
          <div className="dashboard-scope-switch">
            <button
              className={scopeValue === 'GROUP' ? 'company-option active' : 'company-option'}
              onClick={() => onScopeChange('GROUP')}
              type="button"
            >
              <BankOutlined />
              <span>
                <strong title={messages.dashboard.groupScope}>{messages.dashboard.groupScope}</strong>
                <small title={dashboard?.groupName ?? demoContext.groupName}>{dashboard?.groupName ?? demoContext.groupName}</small>
              </span>
              <em>{messages.boundary.groupShared}</em>
            </button>
            {companies.map((company) => (
              <button
                className={scopeValue === company.companyId ? 'company-option active' : 'company-option'}
                key={company.companyId}
                onClick={() => onScopeChange(company.companyId)}
                type="button"
              >
              <BankOutlined />
              <span>
                  <strong title={company.companyName}>{company.companyName}</strong>
                  <small title={company.businessScope}>{company.businessScope}</small>
                </span>
                <em>{messages.boundary.companyIsolated}</em>
              </button>
            ))}
          </div>
        </section>
      )}

      {isError && <div className="data-alert">{errorMessage ?? messages.dashboard.unavailable}</div>}

      {isLoading && !dashboard ? (
        <section className="panel">
          <div className="empty-state">{messages.dashboard.loading}</div>
        </section>
      ) : dashboard ? (
        <>
          <section className="kpi-grid" aria-label={messages.aria.procurementMetrics}>
            {metrics.map((metric) => {
              const targetPath = dashboardMetricTargetPath(metric.key)
              const metricContent = (
                <>
                  <div>
                    <span>{dashboardMetricLabel(metric, messages)}</span>
                    {dashboardMetricIcon(metric.key)}
                  </div>
                  <strong>{formatDashboardMetric(metric, language)}</strong>
                  <small className={dashboardMetricTone(metric.key, metric.value)}>
                    {dashboardMetricNote(metric, messages, language)}
                  </small>
                </>
              )

              return targetPath ? (
                <button
                  aria-label={dashboardMetricAriaLabel(metric, messages, language)}
                  className="panel kpi dashboard-kpi-link"
                  key={metric.key}
                  onClick={() => openMetricTarget(metric)}
                  type="button"
                >
                  {metricContent}
                </button>
              ) : (
                <article className="panel kpi" key={metric.key}>
                  {metricContent}
                </article>
              )
            })}
          </section>

          <section className="dashboard-grid">
            <div className="left-column">
              <section className="panel chart-panel">
                <PanelTitle
                  icon={<DashboardOutlined />}
                  title={messages.dashboard.spendTrend}
                  aside={canChangeScope ? (dashboard.scope === 'GROUP' ? messages.dashboard.groupScope : dashboard.companyName ?? '') : undefined}
                />
                {dashboard.spendTrend.length === 0 ? (
                  <div className="empty-state compact">{messages.dashboard.noTrend}</div>
                ) : (
                  <ReactECharts option={getDashboardSpendTrendOption(dashboard.spendTrend, language)} style={{ height: 256 }} />
                )}
              </section>

              <section className="panel chart-panel">
                <PanelTitle icon={<NodeIndexOutlined />} title={messages.dashboard.documentFunnel} />
                {dashboard.documentFunnel.length === 0 ? (
                  <div className="empty-state compact">{messages.dashboard.noFunnel}</div>
                ) : (
                  <ReactECharts option={getDashboardFunnelOption(dashboard.documentFunnel)} style={{ height: 286 }} />
                )}
              </section>

              <section className="panel chart-panel">
                <PanelTitle icon={<AuditOutlined />} title={messages.dashboard.statusDistribution} />
                {dashboard.statusDistributions.length === 0 ? (
                  <div className="empty-state compact">{messages.dashboard.noStatus}</div>
                ) : (
                  <ReactECharts option={getDashboardStatusOption(dashboard.statusDistributions)} style={{ height: 302 }} />
                )}
              </section>
            </div>

            <aside className="right-column">
              <section className="panel chart-panel">
                <PanelTitle icon={<TeamOutlined />} title={messages.dashboard.supplierDistribution} />
                {dashboard.supplierDistribution.length === 0 ? (
                  <div className="empty-state compact">{messages.dashboard.noSuppliers}</div>
                ) : (
                  <ReactECharts option={getDashboardSupplierOption(dashboard.supplierDistribution, language)} style={{ height: 292 }} />
                )}
              </section>

              <section className="panel">
                <PanelTitle icon={<AlertOutlined />} title={messages.dashboard.exceptionHighlights} aside={String(dashboard.exceptionHighlights.length)} />
                {dashboard.exceptionHighlights.length === 0 ? (
                  <div className="empty-state compact">{messages.dashboard.noExceptions}</div>
                ) : (
                  <div className="risk-list dashboard-exception-list">
                    {dashboard.exceptionHighlights.map((exception) => (
                      <button
                        aria-label={`${messages.dashboard.viewMatching}: ${exception.poTitle || exception.poId}`}
                        className="risk-item dashboard-exception dashboard-exception-link"
                        key={exception.matchId}
                        onClick={() => openExceptionDetail(exception)}
                        type="button"
                      >
                        <span className="risk-icon">
                          <AlertOutlined />
                        </span>
                        <div>
                          <TruncatedText className="text-strong" text={exception.poTitle || exception.poId} />
                          <TruncatedText
                            className="text-small"
                            text={`${exception.companyName} · ${exception.supplierName}`}
                          />
                          <span className="exception-meta">
                            {messages.dashboard.exceptionReason}: {formatDashboardExceptionReason(exception, messages)}
                          </span>
                          {hasAmountVariance(exception.invoiceVarianceAmount) && (
                            <span className="exception-meta">
                              {messages.dashboard.invoiceVariance}: {formatCurrency(exception.invoiceVarianceAmount, exception.currency, language)}
                            </span>
                          )}
                          <span className="exception-meta">{messages.dashboard.lastCalculated}: {formatDateTime(exception.lastCalculatedAt, language)}</span>
                        </div>
                        <span className={`tag ${exception.severity ? severityToneOf(exception.severity) : 'neutral'}`}>
                          {exception.severity ? formatMatchSeverity(exception.severity, messages) : messages.dashboard.empty}
                        </span>
                      </button>
                    ))}
                    <button className="primary-button dashboard-link-button" onClick={() => navigate('/three-way-matching?tab=exceptions')} type="button">
                      <SwapOutlined />
                      <span>{messages.dashboard.viewMatching}</span>
                    </button>
                  </div>
                )}
              </section>
            </aside>
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="empty-state">{messages.dashboard.empty}</div>
        </section>
      )}
    </div>
  )
}


function dashboardMetricsInOrder(metrics: DashboardMetric[]) {
  const order = [
    'issuedPoAmount',
    'pendingApprovals',
    'activeRfqs',
    'issuedPurchaseOrders',
    'receiptInvoiceFollowUp',
    'matchingExceptions',
  ]
  const byKey = new Map(metrics.map((metric) => [metric.key, metric]))

  return order
    .map((key) => byKey.get(key))
    .filter((metric): metric is DashboardMetric => Boolean(metric))
}

function dashboardMetricLabel(metric: DashboardMetric, messages: LocalizedMessages) {
  const labels = messages.dashboard as Record<string, string>
  return labels[metric.key] ?? metric.label
}

function dashboardMetricIcon(key: string) {
  if (key === 'pendingApprovals') {
    return <AuditOutlined />
  }
  if (key === 'activeRfqs') {
    return <FileSearchOutlined />
  }
  if (key === 'matchingExceptions') {
    return <AlertOutlined />
  }
  if (key === 'receiptInvoiceFollowUp') {
    return <InboxOutlined />
  }

  return <ShoppingCartOutlined />
}

function dashboardMetricTargetPath(key: string) {
  const targets: Record<string, string> = {
    activeRfqs: '/rfqs',
    issuedPoAmount: '/purchase-orders',
    issuedPurchaseOrders: '/purchase-orders',
    matchingExceptions: '/three-way-matching?tab=exceptions',
    pendingApprovals: '/approvals',
    receiptInvoiceFollowUp: '/receipts-invoices',
  }

  return targets[key]
}

function dashboardMetricTargetName(key: string, messages: LocalizedMessages) {
  if (key === 'pendingApprovals') {
    return messages.header.approvalsTitle
  }
  if (key === 'activeRfqs') {
    return messages.header.rfqTitle
  }
  if (key === 'receiptInvoiceFollowUp') {
    return messages.header.receiptInvoiceTitle
  }
  if (key === 'matchingExceptions') {
    return messages.header.matchingTitle
  }

  return messages.header.purchaseOrdersTitle
}

function dashboardMetricAriaLabel(metric: DashboardMetric, messages: LocalizedMessages, language: Language) {
  const metricLabel = dashboardMetricLabel(metric, messages)
  const targetName = dashboardMetricTargetName(metric.key, messages)

  return language === 'zh'
    ? `${metricLabel}，打开${targetName}`
    : `Open ${targetName} from ${metricLabel}`
}


function dashboardMetricTone(key: string, value: number) {
  if (key === 'matchingExceptions' && value > 0) {
    return 'danger'
  }
  if ((key === 'pendingApprovals' || key === 'receiptInvoiceFollowUp' || key === 'activeRfqs') && value > 0) {
    return 'warn'
  }
  return 'success'
}

function dashboardMetricNote(metric: DashboardMetric, messages: LocalizedMessages, language: Language) {
  if (metric.currency) {
    return metric.currency
  }

  return `${messages.dashboard.generatedAt}: ${formatDateTime(metric.generatedAt, language)}`
}

function formatDashboardMetric(metric: DashboardMetric, language: Language) {
  if (metric.currency) {
    return formatCurrency(metric.value, metric.currency, language)
  }

  return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(metric.value)
}

function getDashboardSpendTrendOption(points: SpendTrendPoint[], language: Language) {
  const periodLabels = points.map((point) => formatDashboardTrendPeriod(point.period))

  return {
    color: ['#2f7a4d'],
    grid: { bottom: 30, left: 58, right: 20, top: 24 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) => formatCurrency(value, points[0]?.currency ?? 'CNY', language),
    },
    xAxis: {
      axisLabel: { color: '#707771' },
      axisLine: { lineStyle: { color: '#dde2dc' } },
      axisTick: { show: false },
      data: periodLabels,
      type: 'category',
    },
    yAxis: {
      axisLabel: { color: '#707771' },
      splitLine: { lineStyle: { color: '#edf0ec' } },
      type: 'value',
    },
    series: [
      {
        barWidth: 34,
        data: points.map((point) => point.amount),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        type: 'bar',
      },
    ],
  }
}

function formatDashboardTrendPeriod(period: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return period.slice(5).replace('-', '/')
  }

  return period
}

function getDashboardFunnelOption(stages: DocumentFunnelStage[]) {
  return {
    color: ['#2f7a4d'],
    grid: { bottom: 22, left: 98, right: 24, top: 22 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      axisLabel: { color: '#707771' },
      splitLine: { lineStyle: { color: '#edf0ec' } },
      type: 'value',
    },
    yAxis: {
      axisLabel: { color: '#707771' },
      axisLine: { show: false },
      axisTick: { show: false },
      data: stages.map((stage) => stage.label).reverse(),
      type: 'category',
    },
    series: [
      {
        data: stages.map((stage) => stage.count).reverse(),
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        type: 'bar',
      },
    ],
  }
}

function getDashboardStatusOption(buckets: StatusDistributionBucket[]) {
  const visibleBuckets = buckets.slice(0, 14)
  return {
    color: ['#2f7a4d'],
    grid: { bottom: 86, left: 42, right: 16, top: 20 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      axisLabel: {
        color: '#707771',
        interval: 0,
        rotate: 34,
      },
      axisLine: { lineStyle: { color: '#dde2dc' } },
      axisTick: { show: false },
      data: visibleBuckets.map((bucket) => `${bucket.documentLabel}-${bucket.label}`),
      type: 'category',
    },
    yAxis: {
      axisLabel: { color: '#707771' },
      splitLine: { lineStyle: { color: '#edf0ec' } },
      type: 'value',
    },
    series: [
      {
        barWidth: 24,
        data: visibleBuckets.map((bucket) => bucket.count),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        type: 'bar',
      },
    ],
  }
}

function getDashboardSupplierOption(suppliers: SupplierDistributionItem[], language: Language) {
  return {
    color: ['#2f7a4d', '#8f7a45'],
    grid: { bottom: 74, left: 58, right: 18, top: 24 },
    legend: { bottom: 0, textStyle: { color: '#707771' } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      axisLabel: {
        color: '#707771',
        interval: 0,
        overflow: 'truncate',
        rotate: 28,
        width: 78,
      },
      axisLine: { lineStyle: { color: '#dde2dc' } },
      axisTick: { show: false },
      data: suppliers.map((supplier) => supplier.supplierName),
      type: 'category',
    },
    yAxis: [
      {
        axisLabel: { color: '#707771' },
        splitLine: { lineStyle: { color: '#edf0ec' } },
        type: 'value',
      },
    ],
    series: [
      {
        data: suppliers.map((supplier) => supplier.issuedPoAmount),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        name: language === 'zh' ? 'PO 金额' : 'PO Amount',
        type: 'bar',
      },
      {
        data: suppliers.map((supplier) => supplier.quoteCount),
        name: language === 'zh' ? '报价数' : 'Quotes',
        type: 'line',
      },
    ],
  }
}
