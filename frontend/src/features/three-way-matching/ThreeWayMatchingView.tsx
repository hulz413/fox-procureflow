import { AlertOutlined, ApiOutlined, AuditOutlined, CheckCircleOutlined, InboxOutlined, LoadingOutlined, NodeIndexOutlined, SwapOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Drawer, Modal } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FINANCE_ROLE_ID, demoUserHasRoleCapability } from '../../demoRoleCapabilities'
import type { Language, UserSummary, ThreeWayMatchActionType, ThreeWayMatchTab, HandleMatchActionPayload, AiAssistantResponse } from '../../domain/types'
import { fetchThreeWayMatches, fetchThreeWayMatchExceptions, fetchThreeWayMatchDetail, recalculateThreeWayMatch, handleThreeWayMatchAction, explainAiMatchingException } from '../../api/client'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { useListPagination } from '../../shared/hooks/useListPagination'
import { routeParam } from '../../shared/utils/route'
import { formatCurrency, getViewportCenter, userNameOf, formatMatchStatus, matchStatusToneOf, formatMatchSeverity, severityToneOf, formatDifferenceType, formatMatchAction, formatDateTime } from '../../shared/utils/procurement'
import { ListPagination, TruncatedText, DisabledActionTooltip, AiResultPanel, PanelTitle } from '../../shared/ui/common'

export function ThreeWayMatchingView({
  activeDemoUser,
  language,
  messages,
  selectedCompanyId,
  users,
}: {
  activeDemoUser?: UserSummary
  language: Language
  messages: LocalizedMessages
  selectedCompanyId: string
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const [modal, modalContextHolder] = Modal.useModal()
  const handledRouteMatchKey = useRef('')
  const handledRouteTabKey = useRef('')
  const routeMatchId = routeParam(location.search, 'matchId')
  const routeTab = matchingTabParam(location.search)
  const [activeTab, setActiveTab] = useState<ThreeWayMatchTab>(() => routeTab || 'all')
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [actionNote, setActionNote] = useState('')
  const [isActionDirty, setActionDirty] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const [aiMatchingResponse, setAiMatchingResponse] = useState<AiAssistantResponse | null>(null)
  const activeUsers = users.filter((user) => user.active)
  const financeUsers = activeUsers.filter((user) => demoUserHasRoleCapability(user, [FINANCE_ROLE_ID]))
  const actionActor =
    activeDemoUser?.companyId === selectedCompanyId &&
    demoUserHasRoleCapability(activeDemoUser, [FINANCE_ROLE_ID])
      ? activeDemoUser
      : financeUsers[0] ?? activeUsers[0]
  const matchesQuery = useQuery({
    queryKey: ['three-way-matching', selectedCompanyId],
    queryFn: () => fetchThreeWayMatches(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const exceptionsQuery = useQuery({
    queryKey: ['three-way-matching', 'exceptions', selectedCompanyId],
    queryFn: () => fetchThreeWayMatchExceptions(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const detailQuery = useQuery({
    queryKey: ['three-way-matching', 'detail', selectedCompanyId, selectedMatchId],
    queryFn: () => fetchThreeWayMatchDetail(selectedMatchId ?? '', selectedCompanyId),
    enabled: Boolean(selectedMatchId) && selectedCompanyId.length > 0,
    retry: 1,
  })
  const matchingRows = useMemo(() => matchesQuery.data?.data ?? [], [matchesQuery.data?.data])
  const exceptionRows = useMemo(() => exceptionsQuery.data?.data ?? [], [exceptionsQuery.data?.data])
  const resolvedRows = useMemo(
    () => matchingRows.filter((row) => row.status === 'RESOLVED'),
    [matchingRows],
  )
  const tabRows =
    activeTab === 'exceptions'
      ? exceptionRows
      : activeTab === 'resolved'
        ? resolvedRows
        : matchingRows
  const matchingPagination = useListPagination(tabRows, `${selectedCompanyId}:${activeTab}`)
  const detail = detailQuery.data?.data
  const detailQuantityUnit = commonFulfillmentUnit(detail?.lines ?? [])
  const isError = matchesQuery.isError || exceptionsQuery.isError || detailQuery.isError
  const isLoading = matchesQuery.isLoading || exceptionsQuery.isLoading
  const totals = {
    exception: matchingRows.filter((row) => row.status === 'EXCEPTION').length,
    matched: matchingRows.filter((row) => row.status === 'MATCHED').length,
    pending: matchingRows.filter((row) => row.status === 'PENDING_INPUT').length,
    resolved: matchingRows.filter((row) => row.status === 'RESOLVED').length,
  }

  useEffect(() => {
    if (!routeTab) {
      return
    }

    const routeKey = `${location.key}:${routeTab}`
    if (handledRouteTabKey.current === routeKey) {
      return
    }

    handledRouteTabKey.current = routeKey
    setActiveTab(routeTab)
  }, [location.key, routeTab])

  useEffect(() => {
    if (selectedMatchId && !matchingRows.some((row) => row.matchId === selectedMatchId)) {
      setSelectedMatchId(undefined)
      setDetailDrawerOpen(false)
      setActionDirty(false)
      setActionNote('')
    }
  }, [matchingRows, selectedMatchId])

  const refreshMatchingQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ['three-way-matching'] })
  }

  const actionMutation = useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: HandleMatchActionPayload }) =>
      handleThreeWayMatchAction(matchId, payload),
    onError: (error) => {
      setFeedback({
        message: `${messages.matching.actionFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: () => {
      setActionDirty(false)
      setActionNote('')
      setFeedback({ message: messages.matching.actionSuccess, tone: 'success' })
      refreshMatchingQueries()
    },
  })

  const recalculateMutation = useMutation({
    mutationFn: recalculateThreeWayMatch,
    onError: (error) => {
      setFeedback({
        message: `${messages.matching.actionFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: () => {
      setFeedback({ message: messages.matching.recalculateSuccess, tone: 'success' })
      refreshMatchingQueries()
    },
  })

  const aiMatchingMutation = useMutation({
    mutationFn: explainAiMatchingException,
    onError: (error) => {
      setFeedback({
        message: `${messages.ai.unavailable}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response) => {
      setAiMatchingResponse(response.data)
    },
  })

  const discardActionInput = useCallback((next: () => void) => {
    if (!isActionDirty) {
      next()
      return
    }

    modal.confirm({
      mousePosition: getViewportCenter(),
      centered: true,
      cancelText: messages.purchaseRequest.continueEdit,
      content: messages.matching.discardContent,
      focusable: { autoFocusButton: 'cancel' },
      okType: 'danger',
      okText: messages.matching.discardConfirm,
      onOk: () => {
        setActionDirty(false)
        setActionNote('')
        next()
      },
      rootClassName: 'procure-confirm-modal',
      title: messages.matching.discardTitle,
    })
  }, [isActionDirty, messages, modal])

  const openMatchDetail = (matchId: string) => {
    discardActionInput(() => {
      if (matchId !== selectedMatchId) {
        setAiMatchingResponse(null)
      }
      setSelectedMatchId(matchId)
      setDetailDrawerOpen(true)
      setFeedback(null)
    })
  }

  useEffect(() => {
    if (!routeMatchId) {
      return
    }

    const routeKey = `${location.key}:${routeMatchId}`
    if (handledRouteMatchKey.current === routeKey) {
      return
    }

    if (routeMatchId === selectedMatchId && isDetailDrawerOpen) {
      handledRouteMatchKey.current = routeKey
      return
    }

    if (!matchingRows.some((row) => row.matchId === routeMatchId)) {
      return
    }

    handledRouteMatchKey.current = routeKey
    discardActionInput(() => {
      if (routeMatchId !== selectedMatchId) {
        setAiMatchingResponse(null)
      }
      setSelectedMatchId(routeMatchId)
      setDetailDrawerOpen(true)
      setFeedback(null)
    })
  }, [
    discardActionInput,
    isDetailDrawerOpen,
    location.key,
    matchingRows,
    routeMatchId,
    selectedMatchId,
  ])

  const handleDrawerClose = () => {
    discardActionInput(() => {
      setDetailDrawerOpen(false)
      setFeedback(null)
      setAiMatchingResponse(null)
    })
  }

  const disabledActionReason = (actionType: ThreeWayMatchActionType) => {
    if (!actionActor) {
      return messages.matching.noActor
    }
    if (actionMutation.isPending) {
      return messages.matching.pendingAction
    }
    if (!actionNote.trim()) {
      return messages.matching.noteRequired
    }
    if (actionType === 'REOPEN') {
      return detail?.status === 'RESOLVED' ? undefined : messages.matching.resolvedOnly
    }
    return detail?.status === 'EXCEPTION' ? undefined : messages.matching.exceptionOnly
  }

  const submitAction = (actionType: ThreeWayMatchActionType) => {
    if (!selectedMatchId || !actionActor || disabledActionReason(actionType)) {
      return
    }
    actionMutation.mutate({
      matchId: selectedMatchId,
      payload: {
        actionType,
        actorId: actionActor.userId,
        companyId: selectedCompanyId,
        note: actionNote,
      },
    })
  }

  const recalculateSelected = () => {
    if (!detail || !actionActor || recalculateMutation.isPending) {
      return
    }
    recalculateMutation.mutate({
      actorId: actionActor.userId,
      companyId: selectedCompanyId,
      poId: detail.sourcePo.poId,
    })
  }

  const aiMatchingDisabledReason = aiMatchingMutation.isPending
    ? messages.ai.generating
    : !actionActor
      ? messages.matching.noActor
      : detail?.status !== 'EXCEPTION'
        ? messages.ai.disabledExceptionOnly
        : undefined

  const requestAiMatchingExplanation = () => {
    if (!detail || !actionActor || aiMatchingDisabledReason) {
      return
    }
    setAiMatchingResponse(null)
    aiMatchingMutation.mutate({
      actorId: actionActor.userId,
      companyId: selectedCompanyId,
      matchId: detail.matchId,
    })
  }

  return (
    <>
      {modalContextHolder}
      <section className="kpi-grid matching-kpis" aria-label={messages.matching.dataState}>
        <article className="panel kpi">
          <div>
            <span>{messages.matching.matched}</span>
            <CheckCircleOutlined />
          </div>
          <strong>{totals.matched}</strong>
          <small>{messages.matching.dataState}</small>
        </article>
        <article className="panel kpi">
          <div>
            <span>{messages.matching.pendingInput}</span>
            <InboxOutlined />
          </div>
          <strong>{totals.pending}</strong>
          <small className="warn">{messages.matching.receiptSummary}</small>
        </article>
        <article className="panel kpi">
          <div>
            <span>{messages.matching.exception}</span>
            <AlertOutlined />
          </div>
          <strong>{totals.exception}</strong>
          <small className="danger">{messages.matching.exceptions}</small>
        </article>
        <article className="panel kpi">
          <div>
            <span>{messages.matching.resolved}</span>
            <AuditOutlined />
          </div>
          <strong>{totals.resolved}</strong>
          <small>{messages.matching.handlingRecords}</small>
        </article>
      </section>

      <section className="request-grid rfq-grid">
        <section className="panel request-list-panel">
          <PanelTitle icon={<SwapOutlined />} title={messages.matching.list} />
          {isError && <div className="data-alert">{messages.matching.unavailable}</div>}
          {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
          <div className="matching-tabs">
            {([
              ['all', messages.matching.allTab],
              ['exceptions', messages.matching.exceptionsTab],
              ['resolved', messages.matching.resolvedTab],
            ] as const).map(([key, label]) => (
              <button
                className={activeTab === key ? 'secondary-button active' : 'secondary-button'}
                key={key}
                onClick={() => setActiveTab(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="table-wrap">
            <table className="request-table matching-table">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>{messages.purchaseOrder.supplier}</th>
                  <th>{messages.matching.status}</th>
                  <th>{messages.matching.severity}</th>
                  <th>{messages.matching.poAmount}</th>
                  <th>{messages.matching.invoiceVariance}</th>
                  <th>{messages.matching.lastCalculated}</th>
                </tr>
              </thead>
              <tbody>
                {tabRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>{isLoading ? messages.matching.loading : messages.matching.empty}</td>
                  </tr>
                ) : (
                  matchingPagination.pageItems.map((row) => (
                    <tr key={row.matchId}>
                      <td>
                        <button
                          className={row.matchId === selectedMatchId ? 'row-link active' : 'row-link'}
                          onClick={() => openMatchDetail(row.matchId)}
                          type="button"
                        >
                          <TruncatedText text={row.poId} />
                        </button>
                      </td>
                      <td><TruncatedText text={row.supplierName} /></td>
                      <td><span className={`tag ${matchStatusToneOf(row.status)}`}>{formatMatchStatus(row.status, messages)}</span></td>
                      <td>
                        {row.highestSeverity ? (
                          <span className={`tag ${severityToneOf(row.highestSeverity)}`}>
                            {formatMatchSeverity(row.highestSeverity, messages)}
                          </span>
                        ) : (
                          <span className="tag neutral">-</span>
                        )}
                      </td>
                      <td>{formatCurrency(row.poTotalAmount, row.currency, language)}</td>
                      <td className={row.invoiceVarianceAmount !== 0 ? 'amount-danger' : undefined}>
                        {formatCurrency(row.invoiceVarianceAmount, row.currency, language)}
                      </td>
                      <td>{formatDateTime(row.lastCalculatedAt, language)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ListPagination
            currentPage={matchingPagination.currentPage}
            messages={messages}
            onPageChange={matchingPagination.setPage}
            onPageSizeChange={matchingPagination.setPageSize}
            pageSize={matchingPagination.pageSize}
            totalItems={matchingPagination.totalItems}
            totalPages={matchingPagination.totalPages}
          />
        </section>
      </section>

      <Drawer
        className="request-drawer rfq-drawer"
        destroyOnClose={false}
        keyboard
        maskClosable
        onClose={handleDrawerClose}
        open={isDetailDrawerOpen}
        title={messages.matching.detail}
        size={980}
      >
        {detail ? (
          <section className="request-detail matching-detail">
            <div className="detail-heading">
              <div>
                <TruncatedText className="text-strong" text={detail.sourcePo.poId} />
                <TruncatedText className="text-small" text={detail.sourcePo.title} />
              </div>
              <span className={`tag ${matchStatusToneOf(detail.status)}`}>{formatMatchStatus(detail.status, messages)}</span>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>{messages.purchaseOrder.supplier}</dt>
                <dd>
                  <TruncatedText text={detail.sourcePo.supplierName} />
                </dd>
              </div>
              <div>
                <dt>{messages.matching.poAmount}</dt>
                <dd>{formatCurrency(detail.poTotalAmount, detail.currency, language)}</dd>
              </div>
              <div>
                <dt>{messages.matching.invoiceAmount}</dt>
                <dd>{formatCurrency(detail.invoiceTotalAmount, detail.currency, language)}</dd>
              </div>
              <div>
                <dt>{messages.matching.invoiceVariance}</dt>
                <dd className={detail.invoiceVarianceAmount !== 0 ? 'amount-danger' : undefined}>
                  {formatCurrency(detail.invoiceVarianceAmount, detail.currency, language)}
                </dd>
              </div>
              <div>
                <dt>{messages.matching.receiptSummary}</dt>
                <dd>
                  {formatMatchingSummaryValue({
                    count: detail.receiptSummary.receiptCount,
                    language,
                    pluralLabel: messages.matching.receiptDocumentPlural,
                    quantity: detail.receiptSummary.receivedQuantity,
                    quantityLabel: messages.matching.receivedQuantityLabel,
                    singularLabel: messages.matching.receiptDocumentSingular,
                    unit: detailQuantityUnit,
                  })}
                </dd>
              </div>
              <div>
                <dt>{messages.matching.invoiceSummary}</dt>
                <dd>
                  {formatMatchingSummaryValue({
                    count: detail.invoiceSummary.invoiceCount,
                    language,
                    pluralLabel: messages.matching.invoiceDocumentPlural,
                    quantity: detail.invoiceSummary.invoicedQuantity,
                    quantityLabel: messages.matching.invoicedQuantityLabel,
                    singularLabel: messages.matching.invoiceDocumentSingular,
                    unit: detailQuantityUnit,
                  })}
                </dd>
              </div>
            </dl>

            <section className="ai-card">
              <div className="ai-action-row">
                <PanelTitle icon={<ApiOutlined />} title={messages.ai.title} aside={messages.ai.dataState} />
                <DisabledActionTooltip title={aiMatchingDisabledReason}>
                  <button
                    aria-busy={aiMatchingMutation.isPending}
                    className="line-add-button"
                    disabled={Boolean(aiMatchingDisabledReason)}
                    onClick={requestAiMatchingExplanation}
                    type="button"
                  >
                    {aiMatchingMutation.isPending ? <LoadingOutlined /> : <ApiOutlined />}
                    <span>{aiMatchingMutation.isPending ? messages.ai.generating : messages.ai.explainMatching}</span>
                  </button>
                </DisabledActionTooltip>
              </div>
              <AiResultPanel
                isLoading={aiMatchingMutation.isPending}
                language={language}
                messages={messages}
                response={aiMatchingResponse}
                title={messages.ai.explainMatching}
              />
            </section>

            <section className="matching-detail-section">
              <PanelTitle icon={<NodeIndexOutlined />} title={messages.receiptInvoice.lineFulfillment} aside={messages.matching.dataState} />
              <div className="table-wrap compact-detail-table">
                <table className="request-table">
                  <thead>
                    <tr>
                      <th>{messages.receiptInvoice.lineFulfillment}</th>
                      <th>{messages.matching.ordered}</th>
                      <th>{messages.matching.received}</th>
                      <th>{messages.matching.invoiced}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map((line) => (
                      <tr key={line.poLineId}>
                        <td><TruncatedText text={`${line.lineNo}. ${line.itemName}`} /></td>
                        <td>{`${line.orderedQuantity} ${line.unit}`}</td>
                        <td>{`${line.receivedQuantity} ${line.unit}`}</td>
                        <td>{`${line.invoicedQuantity} ${line.unit}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="matching-detail-section">
              <PanelTitle icon={<AlertOutlined />} title={messages.matching.differences} />
              <div className="table-wrap compact-detail-table">
                <table className="request-table">
                  <thead>
                    <tr>
                      <th>{messages.matching.differences}</th>
                      <th>{messages.matching.severity}</th>
                      <th>{messages.matching.received}</th>
                      <th>{messages.matching.invoiced}</th>
                      <th>{messages.matching.invoiceVariance}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.differences.length === 0 ? (
                      <tr><td colSpan={5}>{messages.matching.noDifferences}</td></tr>
                    ) : (
                      detail.differences.map((difference) => (
                        <tr key={difference.differenceId}>
                          <td><TruncatedText text={`${formatDifferenceType(difference.differenceType, messages)} · ${difference.description}`} /></td>
                          <td><span className={`tag ${severityToneOf(difference.severity)}`}>{formatMatchSeverity(difference.severity, messages)}</span></td>
                          <td>{difference.receivedQuantity ?? '-'}</td>
                          <td>{difference.invoicedQuantity ?? '-'}</td>
                          <td>{difference.differenceAmount === null ? '-' : formatCurrency(difference.differenceAmount, difference.currency, language)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="matching-detail-section">
              <PanelTitle icon={<AuditOutlined />} title={messages.matching.handlingRecords} />
              <div className="timeline-list matching-actions-list">
                {detail.actions.length === 0 ? (
                  <div className="empty-state">{messages.matching.noActions}</div>
                ) : (
                  detail.actions.map((action) => (
                    <article className="timeline-item" key={action.actionId}>
                      <strong title={formatMatchAction(action.actionType, messages)}>{formatMatchAction(action.actionType, messages)}</strong>
                      <span title={`${userNameOf(action.actorId, users)} · ${formatDateTime(action.createdAt, language)}`}>
                        {userNameOf(action.actorId, users)} · {formatDateTime(action.createdAt, language)}
                      </span>
                      <p>{action.note}</p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <label className="form-wide matching-note">
              <span>{messages.matching.actionNote}</span>
              <textarea
                value={actionNote}
                onChange={(event) => {
                  setActionDirty(true)
                  setActionNote(event.target.value)
                }}
              />
            </label>
            <div className="matching-action-bar">
              {([
                ['ACKNOWLEDGE', messages.matching.acknowledge],
                ['MARK_IN_PROGRESS', messages.matching.markInProgress],
                ['RESOLVE', messages.matching.resolve],
                ['REOPEN', messages.matching.reopen],
              ] as const).map(([actionType, label]) => {
                const disabledReason = disabledActionReason(actionType)
                return (
                  <DisabledActionTooltip key={actionType} title={disabledReason}>
                    <button
                      className={actionType === 'RESOLVE' ? 'secondary-button danger' : 'secondary-button'}
                      disabled={Boolean(disabledReason)}
                      onClick={() => submitAction(actionType)}
                      type="button"
                    >
                      {label}
                    </button>
                  </DisabledActionTooltip>
                )
              })}
              <DisabledActionTooltip title={!actionActor ? messages.matching.noActor : undefined}>
                <button
                  className="primary-button"
                  disabled={!actionActor || recalculateMutation.isPending}
                  onClick={recalculateSelected}
                  type="button"
                >
                  <SwapOutlined />
                  <span>{messages.matching.recalculate}</span>
                </button>
              </DisabledActionTooltip>
            </div>
          </section>
        ) : (
          <div className="empty-state">{detailQuery.isLoading ? messages.matching.loading : messages.matching.empty}</div>
        )}
      </Drawer>
    </>
  )
}

function commonFulfillmentUnit(lines: Array<{ unit: string }>) {
  if (lines.length === 0) {
    return ''
  }

  const firstUnit = lines[0]?.unit ?? ''
  return firstUnit && lines.every((line) => line.unit === firstUnit) ? firstUnit : ''
}

function formatMatchingSummaryValue({
  count,
  language,
  pluralLabel,
  quantity,
  quantityLabel,
  singularLabel,
  unit,
}: {
  count: number
  language: Language
  pluralLabel: string
  quantity: number
  quantityLabel: string
  singularLabel: string
  unit: string
}) {
  const separator = language === 'zh' ? '，' : ', '
  const documentLabel = count === 1 ? singularLabel : pluralLabel
  return `${formatQuantityNumber(count, language)} ${documentLabel}${separator}${quantityLabel} ${formatQuantityWithUnit(quantity, unit, language)}`
}

function formatQuantityWithUnit(quantity: number, unit: string, language: Language) {
  const formattedQuantity = formatQuantityNumber(quantity, language)
  return unit ? `${formattedQuantity} ${unit}` : formattedQuantity
}

function formatQuantityNumber(quantity: number, language: Language) {
  return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: 2,
  }).format(quantity)
}

function matchingTabParam(search: string): ThreeWayMatchTab | '' {
  const tab = routeParam(search, 'tab')

  if (tab === 'all' || tab === 'exceptions' || tab === 'resolved') {
    return tab
  }

  return ''
}
