import { CheckCircleOutlined, DeleteOutlined, InboxOutlined, NodeIndexOutlined, ProfileOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Drawer, Modal } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { PROCUREMENT_ROLE_ID, demoUserHasRoleCapability } from '../../demoRoleCapabilities'
import type { Language, CompanyContext, UserSummary, CategorySummary, RfqQuote, RfqListItem, PurchaseOrderListItem, PurchaseOrderActionPayload, CancelPurchaseOrderPayload, PurchaseOrderCreateFormState } from '../../domain/types'
import { fetchRfqDetail, fetchRfqComparison, fetchPurchaseOrderDetail, createPurchaseOrder, publishPurchaseOrder, cancelPurchaseOrder } from '../../api/client'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { useListPagination } from '../../shared/hooks/useListPagination'
import { routeParam } from '../../shared/utils/route'
import { formatCurrency, formatRiskLevel, riskToneOf, getViewportCenter, categoryNameOf, userNameOf, buildPurchaseOrderCreateFormDefaults, nextDate, formatPurchaseOrderStatus, purchaseOrderStatusToneOf, formatPurchaseOrderAction, formatDate, formatDateTime } from '../../shared/utils/procurement'
import { ListPagination, TruncatedText, DisabledActionTooltip, PanelTitle } from '../../shared/ui/common'

export function PurchaseOrderView({
  activeDemoUser,
  categories,
  isCreateOpen,
  isError,
  isLoading,
  language,
  messages,
  onCreateClose,
  onRefresh,
  purchaseOrders,
  rfqs,
  selectedCompany,
  selectedCompanyId,
  users,
}: {
  activeDemoUser?: UserSummary
  categories: CategorySummary[]
  isCreateOpen: boolean
  isError: boolean
  isLoading: boolean
  language: Language
  messages: LocalizedMessages
  onCreateClose: () => void
  onRefresh: () => void
  purchaseOrders: PurchaseOrderListItem[]
  rfqs: RfqListItem[]
  selectedCompany: CompanyContext
  selectedCompanyId: string
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const [modal, modalContextHolder] = Modal.useModal()
  const wasCreateOpen = useRef(false)
  const handledRoutePoKey = useRef('')
  const routePoId = routeParam(location.search, 'poId')
  const [selectedPoId, setSelectedPoId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [isCreateDirty, setCreateDirty] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const buyers = users.filter(
    (user) => user.active && demoUserHasRoleCapability(user, [PROCUREMENT_ROLE_ID]),
  )
  const activeBuyer =
    activeDemoUser?.companyId === selectedCompanyId &&
    demoUserHasRoleCapability(activeDemoUser, [PROCUREMENT_ROLE_ID])
      ? activeDemoUser
      : undefined
  const orderedRfqIds = new Set(purchaseOrders.map((purchaseOrder) => purchaseOrder.rfqId))
  const eligibleRfqs = rfqs.filter((rfq) => rfq.status === 'COMPARISON_READY' && !orderedRfqIds.has(rfq.rfqId))
  const [createForm, setCreateForm] = useState<PurchaseOrderCreateFormState>(() =>
    buildPurchaseOrderCreateFormDefaults(selectedCompanyId, eligibleRfqs, buyers, activeBuyer),
  )
  const purchaseOrderPagination = useListPagination(purchaseOrders, selectedCompanyId)

  useEffect(() => {
    if (purchaseOrders.length === 0) {
      setSelectedPoId(undefined)
      setDetailDrawerOpen(false)
      return
    }

    if (selectedPoId && !purchaseOrders.some((purchaseOrder) => purchaseOrder.poId === selectedPoId)) {
      setSelectedPoId(undefined)
      setDetailDrawerOpen(false)
    }
  }, [purchaseOrders, selectedPoId])

  useEffect(() => {
    const didOpenCreateDrawer = isCreateOpen && !wasCreateOpen.current
    wasCreateOpen.current = isCreateOpen
    if (!didOpenCreateDrawer) {
      return
    }

    setCreateDirty(false)
    setFeedback(null)
    setDetailDrawerOpen(false)
    setCreateForm(buildPurchaseOrderCreateFormDefaults(selectedCompanyId, eligibleRfqs, buyers, activeBuyer))
  }, [activeBuyer, buyers, eligibleRfqs, isCreateOpen, selectedCompanyId])

  useEffect(() => {
    setCreateForm((current) => {
      const selectedRfq = eligibleRfqs.find((rfq) => rfq.rfqId === current.rfqId) ?? eligibleRfqs[0]
      const buyer =
        buyers.find((item) => item.userId === current.procurementUserId) ??
        activeBuyer ??
        buyers.find((item) => item.companyId === selectedCompanyId) ??
        buyers[0]
      const next = {
        ...current,
        procurementUserId: buyer?.userId ?? '',
        rfqId: selectedRfq?.rfqId ?? '',
      }
      if (next.procurementUserId === current.procurementUserId && next.rfqId === current.rfqId) {
        return current
      }
      return next
    })
  }, [activeBuyer, buyers, eligibleRfqs, selectedCompanyId])

  const detailQuery = useQuery({
    queryKey: ['purchase-order-detail', selectedPoId, selectedCompanyId],
    queryFn: () => fetchPurchaseOrderDetail(selectedPoId ?? '', selectedCompanyId),
    enabled: Boolean(selectedPoId),
    placeholderData: keepPreviousData,
    retry: 1,
  })
  const detail = detailQuery.data?.data

  const createRfqDetailQuery = useQuery({
    queryKey: ['rfq-detail-for-po', createForm.rfqId, selectedCompanyId],
    queryFn: () => fetchRfqDetail(createForm.rfqId, selectedCompanyId),
    enabled: isCreateOpen && createForm.rfqId.length > 0,
    placeholderData: keepPreviousData,
    retry: 1,
  })
  const createRfqDetail = createRfqDetailQuery.data?.data
  const createRfqComparisonQuery = useQuery({
    queryKey: ['rfq-comparison-for-po', createForm.rfqId, selectedCompanyId],
    queryFn: () => fetchRfqComparison(createForm.rfqId, selectedCompanyId),
    enabled: isCreateOpen && createForm.rfqId.length > 0,
    placeholderData: keepPreviousData,
    retry: 1,
  })
  const createRfqComparisonRows = useMemo(
    () => createRfqComparisonQuery.data?.data ?? [],
    [createRfqComparisonQuery.data?.data],
  )
  const createQuoteBySupplier = useMemo(
    () => new Map(createRfqDetail?.quotes.map((quote) => [quote.supplierId, quote]) ?? []),
    [createRfqDetail?.quotes],
  )
  const createSupplierById = useMemo(
    () => new Map(createRfqDetail?.suppliers.map((supplier) => [supplier.supplierId, supplier]) ?? []),
    [createRfqDetail?.suppliers],
  )
  const quoteOptions = useMemo(
    () =>
      createRfqComparisonRows.length > 0
        ? createRfqComparisonRows
            .map((row) => createQuoteBySupplier.get(row.supplierId))
            .filter((quote): quote is RfqQuote => Boolean(quote))
        : createRfqDetail?.quotes ?? [],
    [createQuoteBySupplier, createRfqComparisonRows, createRfqDetail?.quotes],
  )

  useEffect(() => {
    if (!createRfqDetail) {
      return
    }

    setCreateForm((current) => {
      if (quoteOptions.some((quote) => quote.quoteId === current.quoteId)) {
        return current
      }
      return {
        ...current,
        quoteId: quoteOptions[0]?.quoteId ?? '',
        plannedDeliveryDate: quoteOptions[0]?.deliveryDate ?? current.plannedDeliveryDate,
      }
    })
  }, [createRfqDetail, quoteOptions])

  const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onError: (error) => {
      setFeedback({
        message: `${messages.purchaseOrder.createFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response) => {
      setCreateDirty(false)
      setFeedback({ message: messages.purchaseOrder.createSuccess, tone: 'success' })
      setSelectedPoId(response.data.poId)
      setDetailDrawerOpen(true)
      onCreateClose()
      onRefresh()
      void queryClient.invalidateQueries({ queryKey: ['purchase-order-detail', response.data.poId] })
      void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: ({ poId, payload }: { poId: string; payload: PurchaseOrderActionPayload }) =>
      publishPurchaseOrder(poId, payload),
    onError: (error) => {
      setFeedback({
        message: `${messages.purchaseOrder.actionFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (_response, variables) => {
      setFeedback({ message: messages.purchaseOrder.publishSuccess, tone: 'success' })
      void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      void queryClient.invalidateQueries({ queryKey: ['receipts-invoices'] })
      void queryClient.invalidateQueries({ queryKey: ['three-way-matching'] })
      void queryClient.invalidateQueries({ queryKey: ['purchase-order-detail', variables.poId] })
    },
  })

  const cancelMutation = useMutation({
    mutationFn: ({ poId, payload }: { poId: string; payload: CancelPurchaseOrderPayload }) =>
      cancelPurchaseOrder(poId, payload),
    onError: (error) => {
      setFeedback({
        message: `${messages.purchaseOrder.actionFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (_response, variables) => {
      setCancelReason('')
      setFeedback({ message: messages.purchaseOrder.cancelSuccess, tone: 'success' })
      void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      void queryClient.invalidateQueries({ queryKey: ['receipts-invoices'] })
      void queryClient.invalidateQueries({ queryKey: ['three-way-matching'] })
      void queryClient.invalidateQueries({ queryKey: ['purchase-order-detail', variables.poId] })
    },
  })

  const selectedCreateRfq = eligibleRfqs.find((rfq) => rfq.rfqId === createForm.rfqId)
  const selectedCreateQuote = quoteOptions.find((quote) => quote.quoteId === createForm.quoteId)
  const drawerMode = isCreateOpen ? 'create' : isDetailDrawerOpen ? 'detail' : null
  const drawerTitle = drawerMode === 'create' ? messages.purchaseOrder.create : messages.purchaseOrder.detail
  const publishDisabledReason = detail
    ? publishMutation.isPending
      ? messages.purchaseOrder.publishPendingReason
      : detail.status === 'ISSUED'
        ? messages.purchaseOrder.publishDisabledIssuedReason
        : detail.status === 'CANCELLED'
          ? messages.purchaseOrder.publishDisabledCancelledReason
          : undefined
    : undefined
  const cancelDisabledReason = detail
    ? cancelMutation.isPending
      ? messages.purchaseOrder.cancelPendingReason
      : detail.status === 'CANCELLED'
        ? messages.purchaseOrder.cancelDisabledCancelledReason
        : !cancelReason.trim()
          ? messages.purchaseOrder.cancelRequiresReason
          : undefined
    : undefined

  const updateCreateForm = <Key extends keyof PurchaseOrderCreateFormState>(
    key: Key,
    value: PurchaseOrderCreateFormState[Key],
  ) => {
    setCreateDirty(true)
    setCreateForm((current) => ({ ...current, [key]: value }))
  }

  const handleCreateRfqChange = (rfqId: string) => {
    setCreateDirty(true)
    setCreateForm((current) => ({
      ...current,
      plannedDeliveryDate: nextDate(14),
      quoteId: '',
      rfqId,
    }))
  }

  const handleCreatePurchaseOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.rfqId || !createForm.quoteId || !createForm.procurementUserId) {
      setFeedback({ message: messages.purchaseOrder.noQuote, tone: 'danger' })
      return
    }

    createMutation.mutate({
      companyId: selectedCompanyId,
      deliveryLocation: createForm.deliveryLocation,
      deliveryNote: createForm.deliveryNote,
      contactPerson: createForm.contactPerson,
      contactPhone: createForm.contactPhone,
      plannedDeliveryDate: createForm.plannedDeliveryDate,
      procurementUserId: createForm.procurementUserId,
      quoteId: createForm.quoteId,
      rfqId: createForm.rfqId,
    })
  }

  const handlePublish = () => {
    if (!detail) {
      return
    }

    publishMutation.mutate({
      poId: detail.poId,
      payload: {
        actorId: detail.procurementUserId,
        comment: messages.purchaseOrder.publish,
        companyId: selectedCompanyId,
      },
    })
  }

  const handleCancel = () => {
    if (!detail || !cancelReason.trim()) {
      return
    }

    cancelMutation.mutate({
      poId: detail.poId,
      payload: {
        actorId: detail.procurementUserId,
        companyId: selectedCompanyId,
        reason: cancelReason,
      },
    })
  }

  const closeCreateDrawer = () => {
    setCreateDirty(false)
    onCreateClose()
  }

  const closeDetailDrawer = () => {
    setDetailDrawerOpen(false)
    setFeedback(null)
    setCancelReason('')
  }

  const confirmDiscardDetailInput = useCallback((onOk: () => void) => {
    modal.confirm({
      mousePosition: getViewportCenter(),
      centered: true,
      cancelText: messages.purchaseRequest.continueEdit,
      content: messages.purchaseOrder.discardDetailContent,
      focusable: { autoFocusButton: 'cancel' },
      okType: 'danger',
      okText: messages.purchaseOrder.discardDetailConfirm,
      onOk,
      rootClassName: 'procure-confirm-modal',
      title: messages.purchaseOrder.discardDetailTitle,
    })
  }, [messages, modal])

  const handleDrawerClose = () => {
    if (drawerMode === 'create' && isCreateDirty) {
      modal.confirm({
        mousePosition: getViewportCenter(),
        centered: true,
        cancelText: messages.purchaseRequest.continueEdit,
        content: messages.purchaseOrder.discardContent,
        focusable: { autoFocusButton: 'cancel' },
        okType: 'danger',
        okText: messages.purchaseOrder.discardConfirm,
        onOk: closeCreateDrawer,
        rootClassName: 'procure-confirm-modal',
        title: messages.purchaseOrder.discardTitle,
      })
      return
    }

    if (drawerMode === 'create') {
      closeCreateDrawer()
      return
    }

    if (drawerMode === 'detail' && cancelReason.trim()) {
      confirmDiscardDetailInput(closeDetailDrawer)
      return
    }

    closeDetailDrawer()
  }

  const handlePurchaseOrderDetailOpen = (poId: string) => {
    const openDetail = () => {
      if (poId !== selectedPoId) {
        setCancelReason('')
      }
      setSelectedPoId(poId)
      setDetailDrawerOpen(true)
      setFeedback(null)
    }

    if (isDetailDrawerOpen && cancelReason.trim() && poId !== selectedPoId) {
      confirmDiscardDetailInput(openDetail)
      return
    }

    openDetail()
  }

  useEffect(() => {
    if (!routePoId) {
      return
    }

    const routeKey = `${location.key}:${routePoId}`
    if (handledRoutePoKey.current === routeKey) {
      return
    }

    if (routePoId === selectedPoId && isDetailDrawerOpen) {
      handledRoutePoKey.current = routeKey
      return
    }

    if (!purchaseOrders.some((purchaseOrder) => purchaseOrder.poId === routePoId)) {
      return
    }

    handledRoutePoKey.current = routeKey
    const openDetail = () => {
      if (routePoId !== selectedPoId) {
        setCancelReason('')
      }
      setSelectedPoId(routePoId)
      setDetailDrawerOpen(true)
      setFeedback(null)
    }

    if (isDetailDrawerOpen && cancelReason.trim() && routePoId !== selectedPoId) {
      confirmDiscardDetailInput(openDetail)
      return
    }

    openDetail()
  }, [
    cancelReason,
    confirmDiscardDetailInput,
    isDetailDrawerOpen,
    location.key,
    purchaseOrders,
    routePoId,
    selectedPoId,
  ])

  return (
    <>
      {modalContextHolder}
      <section className="request-grid rfq-grid">
        <section className="panel request-list-panel">
          <PanelTitle icon={<ShoppingCartOutlined />} title={messages.purchaseOrder.list} aside={selectedCompany.companyName} />
          {isError && <div className="data-alert">{messages.purchaseOrder.unavailable}</div>}
          <div className="table-wrap">
            <table className="request-table">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>{messages.purchaseOrder.sourceRfq}</th>
                  <th>{messages.purchaseOrder.supplier}</th>
                  <th>{messages.rfq.totalAmount}</th>
                  <th>{messages.purchaseOrder.plannedDeliveryDate}</th>
                  <th>{messages.purchaseRequest.status}</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{isLoading ? messages.purchaseOrder.loading : messages.purchaseOrder.empty}</td>
                  </tr>
                ) : (
                  purchaseOrderPagination.pageItems.map((purchaseOrder) => (
                    <tr key={purchaseOrder.poId}>
                      <td>
                        <button
                          className={purchaseOrder.poId === selectedPoId ? 'row-link active' : 'row-link'}
                          onClick={() => handlePurchaseOrderDetailOpen(purchaseOrder.poId)}
                          type="button"
                        >
                          <TruncatedText text={purchaseOrder.poId} />
                        </button>
                      </td>
                      <td>
                        <TruncatedText text={purchaseOrder.rfqId} />
                      </td>
                      <td>
                        <TruncatedText text={purchaseOrder.supplierName} />
                      </td>
                      <td>{formatCurrency(purchaseOrder.totalAmount, purchaseOrder.currency, language)}</td>
                      <td>{formatDate(purchaseOrder.plannedDeliveryDate, language)}</td>
                      <td>
                        <span className={`tag ${purchaseOrderStatusToneOf(purchaseOrder.status)}`}>
                          {formatPurchaseOrderStatus(purchaseOrder.status, messages)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ListPagination
            currentPage={purchaseOrderPagination.currentPage}
            messages={messages}
            onPageChange={purchaseOrderPagination.setPage}
            onPageSizeChange={purchaseOrderPagination.setPageSize}
            pageSize={purchaseOrderPagination.pageSize}
            totalItems={purchaseOrderPagination.totalItems}
            totalPages={purchaseOrderPagination.totalPages}
          />
        </section>
      </section>

      <Drawer
        className="request-drawer rfq-drawer"
        destroyOnClose={false}
        keyboard
        maskClosable
        onClose={handleDrawerClose}
        open={drawerMode !== null}
        title={drawerTitle}
        size={900}
      >
        {drawerMode === 'create' ? (
          <form className="request-form rfq-form" onSubmit={handleCreatePurchaseOrder}>
            <label className="form-wide">
              <span>{messages.purchaseOrder.eligibleRfq}</span>
              <select
                disabled={eligibleRfqs.length === 0}
                required
                value={createForm.rfqId}
                onChange={(event) => handleCreateRfqChange(event.target.value)}
              >
                {eligibleRfqs.length === 0 ? (
                  <option value="">{messages.purchaseOrder.noEligibleRfq}</option>
                ) : (
                  eligibleRfqs.map((rfq) => (
                    <option key={rfq.rfqId} value={rfq.rfqId}>
                      {rfq.rfqId} · {rfq.title}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="form-wide">
              <span>{messages.purchaseOrder.selectedQuote}</span>
              <select
                disabled={quoteOptions.length === 0}
                required
                value={createForm.quoteId}
                onChange={(event) => updateCreateForm('quoteId', event.target.value)}
              >
                {quoteOptions.length === 0 ? (
                  <option value="">{messages.purchaseOrder.noQuote}</option>
                ) : (
                  quoteOptions.map((quote) => {
                    const supplier = createSupplierById.get(quote.supplierId)
                    return (
                      <option key={quote.quoteId} value={quote.quoteId}>
                        {supplier?.supplierName ?? quote.supplierId} · {formatCurrency(quote.totalAmount, selectedCreateRfq?.currency ?? 'CNY', language)}
                      </option>
                    )
                  })
                )}
              </select>
            </label>
            <label>
              <span>{messages.purchaseOrder.buyer}</span>
              <select
                required
                value={createForm.procurementUserId}
                onChange={(event) => updateCreateForm('procurementUserId', event.target.value)}
              >
                {buyers.map((buyer) => (
                  <option key={buyer.userId} value={buyer.userId}>
                    {buyer.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{messages.purchaseOrder.plannedDeliveryDate}</span>
              <input
                required
                type="date"
                value={createForm.plannedDeliveryDate}
                onChange={(event) => updateCreateForm('plannedDeliveryDate', event.target.value)}
              />
            </label>
            <label className="form-wide">
              <span>{messages.purchaseOrder.deliveryLocation}</span>
              <input
                required
                value={createForm.deliveryLocation}
                onChange={(event) => updateCreateForm('deliveryLocation', event.target.value)}
              />
            </label>
            <label>
              <span>{messages.purchaseOrder.contactPerson}</span>
              <input
                required
                value={createForm.contactPerson}
                onChange={(event) => updateCreateForm('contactPerson', event.target.value)}
              />
            </label>
            <label>
              <span>{messages.purchaseOrder.contactPhone}</span>
              <input
                required
                value={createForm.contactPhone}
                onChange={(event) => updateCreateForm('contactPhone', event.target.value)}
              />
            </label>
            <label className="form-wide">
              <span>{messages.purchaseOrder.deliveryNote}</span>
              <textarea
                value={createForm.deliveryNote}
                onChange={(event) => updateCreateForm('deliveryNote', event.target.value)}
              />
            </label>
            {selectedCreateRfq && selectedCreateQuote && (
              <dl className="detail-grid form-wide">
                <div>
                  <dt>{messages.purchaseOrder.sourceRfq}</dt>
                  <dd>{selectedCreateRfq.rfqId}</dd>
                </div>
                <div>
                  <dt>{messages.purchaseRequest.category}</dt>
                  <dd>{categoryNameOf(selectedCreateRfq.categoryId, categories)}</dd>
                </div>
                <div>
                  <dt>{messages.rfq.totalAmount}</dt>
                  <dd>{formatCurrency(selectedCreateQuote.totalAmount, selectedCreateRfq.currency, language)}</dd>
                </div>
                <div>
                  <dt>{messages.rfq.deliveryDate}</dt>
                  <dd>{formatDate(selectedCreateQuote.deliveryDate, language)}</dd>
                </div>
              </dl>
            )}
            {createRfqDetail && (
              <section className="approval-section form-wide">
                <PanelTitle icon={<NodeIndexOutlined />} title={messages.rfq.comparison} aside={messages.purchaseOrder.downstreamBoundary} />
                <div className="table-wrap">
                  <table className="request-table">
                    <thead>
                      <tr>
                        <th>{messages.rfq.rank}</th>
                        <th>{messages.purchaseOrder.supplier}</th>
                        <th>{messages.rfq.totalAmount}</th>
                        <th>{messages.rfq.deliveryDate}</th>
                        <th>{messages.foundation.risk}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createRfqComparisonRows.map((row) => (
                        <tr key={row.supplierId}>
                          <td>
                            <span className={row.rank === 1 ? 'tag success' : 'tag'}>{row.rank}</span>
                          </td>
                          <td>{row.supplierName}</td>
                          <td>{formatCurrency(row.totalAmount, createRfqDetail.currency, language)}</td>
                          <td>{formatDate(row.deliveryDate, language)}</td>
                          <td>
                            <span className={`tag ${riskToneOf(row.riskLevel)}`}>
                              {formatRiskLevel(row.riskLevel, language)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            <button className="primary-button form-wide" disabled={createMutation.isPending} type="submit">
              <ShoppingCartOutlined />
              <span>{messages.purchaseOrder.create}</span>
            </button>
            {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
          </form>
        ) : detail ? (
          <div className="request-detail rfq-detail">
            <div className="detail-heading">
              <div>
                <TruncatedText className="text-strong" text={detail.title} />
                <TruncatedText className="text-small" text={`${detail.poId} · ${detail.rfqId} · ${detail.quoteId}`} />
              </div>
              <span className={`tag ${purchaseOrderStatusToneOf(detail.status)}`}>
                {formatPurchaseOrderStatus(detail.status, messages)}
              </span>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>{messages.purchaseOrder.supplier}</dt>
                <dd>{detail.supplierName}</dd>
              </div>
              <div>
                <dt>{messages.purchaseOrder.buyer}</dt>
                <dd>{userNameOf(detail.procurementUserId, users)}</dd>
              </div>
              <div>
                <dt>{messages.purchaseRequest.category}</dt>
                <dd>{categoryNameOf(detail.categoryId, categories)}</dd>
              </div>
              <div>
                <dt>{messages.rfq.totalAmount}</dt>
                <dd>{formatCurrency(detail.totalAmount, detail.currency, language)}</dd>
              </div>
              <div>
                <dt>{messages.rfq.taxAmount}</dt>
                <dd>{formatCurrency(detail.taxAmount, detail.currency, language)}</dd>
              </div>
              <div>
                <dt>{messages.purchaseOrder.plannedDeliveryDate}</dt>
                <dd>{formatDate(detail.deliverySchedule.plannedDeliveryDate, language)}</dd>
              </div>
            </dl>

            <section className="approval-section">
              <PanelTitle icon={<ShoppingCartOutlined />} title={messages.purchaseOrder.quoteSnapshot} aside={messages.purchaseOrder.downstreamBoundary} />
              <dl className="detail-grid">
                <div>
                  <dt>{messages.purchaseOrder.sourceRfq}</dt>
                  <dd>{detail.rfqId}</dd>
                </div>
                <div>
                  <dt>{messages.purchaseOrder.selectedQuote}</dt>
                  <dd>{detail.quoteId}</dd>
                </div>
                <div>
                  <dt>{messages.rfq.quoteAmount}</dt>
                  <dd>{formatCurrency(detail.quoteAmount, detail.currency, language)}</dd>
                </div>
                <div>
                  <dt>{messages.rfq.taxRate}</dt>
                  <dd>{`${(detail.taxRate * 100).toFixed(2)}%`}</dd>
                </div>
              </dl>
            </section>

            <section className="approval-section">
              <PanelTitle icon={<InboxOutlined />} title={messages.purchaseOrder.deliverySchedule} />
              <dl className="detail-grid">
                <div>
                  <dt>{messages.purchaseOrder.deliveryLocation}</dt>
                  <dd>{detail.deliverySchedule.deliveryLocation}</dd>
                </div>
                <div>
                  <dt>{messages.purchaseOrder.contactPerson}</dt>
                  <dd>{detail.deliverySchedule.contactPerson}</dd>
                </div>
                <div>
                  <dt>{messages.purchaseOrder.contactPhone}</dt>
                  <dd>{detail.deliverySchedule.contactPhone}</dd>
                </div>
                <div>
                  <dt>{messages.purchaseOrder.deliveryNote}</dt>
                  <dd>{detail.deliverySchedule.deliveryNote ?? '-'}</dd>
                </div>
              </dl>
            </section>

            <section className="approval-section">
              <PanelTitle icon={<ProfileOutlined />} title={messages.purchaseOrder.lineSnapshot} />
              <div className="table-wrap">
                <table className="request-table">
                  <thead>
                    <tr>
                      <th>{messages.purchaseRequest.itemName}</th>
                      <th>{messages.purchaseRequest.quantity}</th>
                      <th>{messages.purchaseRequest.unit}</th>
                      <th>{messages.purchaseRequest.estimatedUnitPrice}</th>
                      <th>{messages.purchaseRequest.totalAmount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map((line) => (
                      <tr key={line.lineId}>
                        <td>
                          <TruncatedText className="text-strong" text={line.itemName} />
                          {line.specification && <TruncatedText className="text-small" text={line.specification} />}
                        </td>
                        <td>{line.quantity}</td>
                        <td>{line.unit}</td>
                        <td>{formatCurrency(line.confirmedUnitPrice, detail.currency, language)}</td>
                        <td>{formatCurrency(line.confirmedAmount, detail.currency, language)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="approval-section">
              <PanelTitle icon={<NodeIndexOutlined />} title={messages.purchaseOrder.statusRecords} />
              <div className="timeline">
                {detail.statusRecords.length === 0 ? (
                  <div className="empty-state">{messages.purchaseOrder.noRecords}</div>
                ) : (
                  detail.statusRecords.map((record) => (
                    <article className="timeline-item" key={record.recordId}>
                      <span className={`tag ${purchaseOrderStatusToneOf(record.toStatus)}`}>
                        {formatPurchaseOrderAction(record.action, messages)}
                      </span>
                      <div>
                        <strong>{userNameOf(record.actorId, users)}</strong>
                        <small>{formatDateTime(record.createdAt, language)}</small>
                        {record.comment && <p>{record.comment}</p>}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="approval-section">
              <PanelTitle icon={<CheckCircleOutlined />} title={messages.purchaseRequest.status} />
              <div className="action-row">
                <DisabledActionTooltip title={publishDisabledReason}>
                  <button
                    className="primary-button"
                    disabled={Boolean(publishDisabledReason)}
                    onClick={handlePublish}
                    type="button"
                  >
                    <CheckCircleOutlined />
                    <span>{messages.purchaseOrder.publish}</span>
                  </button>
                </DisabledActionTooltip>
                <input
                  className="inline-input"
                  disabled={detail.status === 'CANCELLED'}
                  placeholder={messages.purchaseOrder.cancelPlaceholder}
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                />
                <DisabledActionTooltip title={cancelDisabledReason}>
                  <button
                    className="secondary-button danger"
                    disabled={Boolean(cancelDisabledReason)}
                    onClick={handleCancel}
                    type="button"
                  >
                    <DeleteOutlined />
                    <span>{messages.purchaseOrder.cancel}</span>
                  </button>
                </DisabledActionTooltip>
              </div>
            </section>
            {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
          </div>
        ) : (
          <div className="empty-state">{detailQuery.isLoading ? messages.purchaseOrder.loading : messages.purchaseOrder.empty}</div>
        )}
      </Drawer>
    </>
  )
}
