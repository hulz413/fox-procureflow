import { ApiOutlined, CheckCircleOutlined, FileSearchOutlined, LoadingOutlined, NodeIndexOutlined, TeamOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Drawer, Modal, Select } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { PROCUREMENT_ROLE_ID, demoUserHasRoleCapability } from '../../demoRoleCapabilities'
import type { Language, UserSummary, CategorySummary, SupplierSummary, PurchaseRequestListItem, RfqListItem, UpsertRfqQuotePayload, RfqCreateFormState, RfqQuoteFormState, AiAssistantResponse } from '../../domain/types'
import { fetchRfqDetail, createRfq, upsertRfqQuote, uploadAttachment, fetchRfqComparison, explainAiRfqQuotes } from '../../api/client'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { useListPagination } from '../../shared/hooks/useListPagination'
import { routeParam } from '../../shared/utils/route'
import { formatCurrency, formatRiskLevel, riskToneOf, getViewportCenter, formatApprovalStatus, categoryNameOf, userNameOf, suppliersForCategory, buildRfqCreateFormDefaults, defaultRfqTitle, buildRfqQuoteFormDefaults, formatRfqStatus, rfqStatusToneOf, formatDate } from '../../shared/utils/procurement'
import { ListPagination, TruncatedText, DisabledActionTooltip, AiResultPanel, PanelTitle } from '../../shared/ui/common'
import { AttachmentList, AttachmentInlineAction, FilePicker } from '../../shared/ui/procurementWidgets'

export function RfqView({
  activeDemoUser,
  categories,
  isCreateOpen,
  isError,
  isLoading,
  language,
  messages,
  onCreateClose,
  onRefresh,
  purchaseRequests,
  rfqs,
  selectedCompanyId,
  suppliers,
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
  purchaseRequests: PurchaseRequestListItem[]
  rfqs: RfqListItem[]
  selectedCompanyId: string
  suppliers: SupplierSummary[]
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const [modal, modalContextHolder] = Modal.useModal()
  const wasCreateOpen = useRef(false)
  const handledRouteRfqKey = useRef('')
  const routeRfqId = routeParam(location.search, 'rfqId')
  const [selectedRfqId, setSelectedRfqId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [isCreateDirty, setCreateDirty] = useState(false)
  const [isQuoteDirty, setQuoteDirty] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const [aiRfqResponse, setAiRfqResponse] = useState<AiAssistantResponse | null>(null)
  const rfqRequestIds = new Set(rfqs.map((rfq) => rfq.requestId))
  const approvedRequests = purchaseRequests.filter(
    (request) => request.approval?.status === 'APPROVED' && !rfqRequestIds.has(request.requestId),
  )
  const buyers = users.filter(
    (user) => user.active && demoUserHasRoleCapability(user, [PROCUREMENT_ROLE_ID]),
  )
  const activeBuyer =
    activeDemoUser?.companyId === selectedCompanyId &&
    demoUserHasRoleCapability(activeDemoUser, [PROCUREMENT_ROLE_ID])
      ? activeDemoUser
      : undefined
  const [createForm, setCreateForm] = useState<RfqCreateFormState>(() =>
    buildRfqCreateFormDefaults(selectedCompanyId, approvedRequests, suppliers, buyers, activeBuyer),
  )
  const [quoteForm, setQuoteForm] = useState<RfqQuoteFormState>(() => buildRfqQuoteFormDefaults())
  const [isQuoteUploading, setQuoteUploading] = useState(false)
  const rfqPagination = useListPagination(rfqs, selectedCompanyId)

  useEffect(() => {
    if (rfqs.length === 0) {
      setSelectedRfqId(undefined)
      setDetailDrawerOpen(false)
      return
    }

    if (selectedRfqId && !rfqs.some((rfq) => rfq.rfqId === selectedRfqId)) {
      setSelectedRfqId(undefined)
      setDetailDrawerOpen(false)
    }
  }, [rfqs, selectedRfqId])

  useEffect(() => {
    const didOpenCreateDrawer = isCreateOpen && !wasCreateOpen.current
    wasCreateOpen.current = isCreateOpen
    if (!didOpenCreateDrawer) {
      return
    }

    setCreateDirty(false)
    setFeedback(null)
    setDetailDrawerOpen(false)
    setCreateForm(buildRfqCreateFormDefaults(selectedCompanyId, approvedRequests, suppliers, buyers, activeBuyer))
  }, [activeBuyer, approvedRequests, buyers, isCreateOpen, selectedCompanyId, suppliers])

  useEffect(() => {
    setCreateForm((current) => {
      const currentRequest = approvedRequests.find((request) => request.requestId === current.requestId)
      const request = currentRequest ?? approvedRequests[0]
      const procurementUser = activeBuyer ?? buyers.find((buyer) => buyer.companyId === selectedCompanyId) ?? buyers[0]
      const validSupplierIds = suppliersForCategory(request?.categoryId ?? '', suppliers).map((supplier) => supplier.supplierId)
      const supplierIds = current.supplierIds.filter((supplierId) => validSupplierIds.includes(supplierId))
      const next = {
        ...current,
        procurementUserId: procurementUser?.userId ?? '',
        requestId: request?.requestId ?? '',
        supplierIds: supplierIds.length > 0 ? supplierIds : validSupplierIds.slice(0, 3),
        title: current.title || (request ? defaultRfqTitle(request.title) : ''),
      }
      if (
        next.procurementUserId === current.procurementUserId &&
        next.requestId === current.requestId &&
        next.title === current.title &&
        next.supplierIds.join('|') === current.supplierIds.join('|')
      ) {
        return current
      }
      return next
    })
  }, [activeBuyer, approvedRequests, buyers, selectedCompanyId, suppliers])

  const detailQuery = useQuery({
    queryKey: ['rfq-detail', selectedRfqId, selectedCompanyId],
    queryFn: () => fetchRfqDetail(selectedRfqId ?? '', selectedCompanyId),
    enabled: Boolean(selectedRfqId),
    placeholderData: keepPreviousData,
    retry: 1,
  })
  const detail = detailQuery.data?.data
  const comparisonQuery = useQuery({
    queryKey: ['rfq-comparison', selectedRfqId, selectedCompanyId],
    queryFn: () => fetchRfqComparison(selectedRfqId ?? '', selectedCompanyId),
    enabled: Boolean(selectedRfqId),
    placeholderData: keepPreviousData,
    retry: 1,
  })
  const comparisonRows = comparisonQuery.data?.data ?? []

  useEffect(() => {
    if (!detail) {
      setQuoteForm(buildRfqQuoteFormDefaults())
      setQuoteDirty(false)
      return
    }

    setQuoteForm((current) => buildRfqQuoteFormDefaults(detail, current.supplierId))
    setQuoteDirty(false)
  }, [detail])

  const createMutation = useMutation({
    mutationFn: createRfq,
    onError: (error) => {
      setFeedback({
        message: `${messages.rfq.createFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response) => {
      setCreateDirty(false)
      setFeedback({ message: messages.rfq.createSuccess, tone: 'success' })
      setSelectedRfqId(response.data.rfqId)
      setDetailDrawerOpen(true)
      onCreateClose()
      onRefresh()
      void queryClient.invalidateQueries({ queryKey: ['rfq-detail', response.data.rfqId] })
    },
  })

  const quoteMutation = useMutation({
    mutationFn: ({
      rfqId,
      supplierId,
      payload,
    }: {
      rfqId: string
      supplierId: string
      payload: UpsertRfqQuotePayload
    }) => upsertRfqQuote(rfqId, supplierId, payload),
    onError: (error) => {
      setFeedback({
        message: `${messages.rfq.quoteFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (_response, variables) => {
      setQuoteDirty(false)
      setFeedback({ message: messages.rfq.quoteSuccess, tone: 'success' })
      void queryClient.invalidateQueries({ queryKey: ['rfqs'] })
      void queryClient.invalidateQueries({ queryKey: ['rfq-detail', variables.rfqId] })
      void queryClient.invalidateQueries({ queryKey: ['rfq-comparison', variables.rfqId] })
    },
  })

  const aiRfqMutation = useMutation({
    mutationFn: explainAiRfqQuotes,
    onError: (error) => {
      setFeedback({
        message: `${messages.ai.unavailable}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response) => {
      setAiRfqResponse(response.data)
    },
  })

  const selectedCreateRequest = approvedRequests.find((request) => request.requestId === createForm.requestId)
  const selectableSuppliers = suppliersForCategory(selectedCreateRequest?.categoryId ?? '', suppliers)
  const quoteSupplier = detail?.suppliers.find((supplier) => supplier.supplierId === quoteForm.supplierId)
  const quoteBySupplier = new Map(detail?.quotes.map((quote) => [quote.supplierId, quote]) ?? [])
  const drawerMode = isCreateOpen ? 'create' : isDetailDrawerOpen ? 'detail' : null
  const drawerTitle = drawerMode === 'create' ? messages.rfq.create : messages.rfq.detail
  const saveQuoteDisabledReason = quoteMutation.isPending
    ? messages.rfq.saveQuotePendingReason
    : isQuoteUploading
      ? messages.rfq.uploadingAttachment
      : !isQuoteDirty
        ? messages.rfq.noQuoteChanges
        : undefined
  const createRfqDisabledReason = createMutation.isPending
    ? messages.rfq.createPendingReason
    : approvedRequests.length === 0
      ? messages.rfq.noAvailableApprovedRequest
      : undefined
  const aiRfqDisabledReason = aiRfqMutation.isPending
    ? messages.ai.generating
    : comparisonRows.length < 2
      ? messages.ai.disabledNeedQuotes
      : !detail?.procurementUserId
        ? messages.ai.disabledNoActor
        : undefined

  const updateCreateForm = <Key extends keyof RfqCreateFormState>(key: Key, value: RfqCreateFormState[Key]) => {
    setCreateDirty(true)
    setCreateForm((current) => ({ ...current, [key]: value }))
  }

  const handleCreateRequestChange = (requestId: string) => {
    const request = approvedRequests.find((item) => item.requestId === requestId)
    const nextSuppliers = suppliersForCategory(request?.categoryId ?? '', suppliers).slice(0, 3)
    setCreateDirty(true)
    setCreateForm((current) => ({
      ...current,
      requestId,
      supplierIds: nextSuppliers.map((supplier) => supplier.supplierId),
      title: request ? defaultRfqTitle(request.title) : current.title,
    }))
  }

  const handleCreateRfq = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.requestId || !createForm.procurementUserId || createForm.supplierIds.length === 0) {
      setFeedback({
        message: approvedRequests.length === 0 ? messages.rfq.noAvailableApprovedRequest : messages.rfq.noApprovedRequest,
        tone: 'danger',
      })
      return
    }

    createMutation.mutate({
      companyId: selectedCompanyId,
      procurementUserId: createForm.procurementUserId,
      requestId: createForm.requestId,
      supplierIds: createForm.supplierIds,
      title: createForm.title,
    })
  }

  const handleQuoteSupplierChange = (supplierId: string) => {
    setQuoteForm(buildRfqQuoteFormDefaults(detail, supplierId))
    setQuoteDirty(false)
  }

  const updateQuoteForm = <Key extends keyof RfqQuoteFormState>(key: Key, value: RfqQuoteFormState[Key]) => {
    setQuoteDirty(true)
    setQuoteForm((current) => ({ ...current, [key]: value }))
  }

  const handleQuoteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detail || !quoteForm.supplierId) {
      return
    }

    void (async () => {
      setQuoteUploading(true)
      try {
        let uploadedAttachments = quoteForm.uploadedAttachments
        if (quoteForm.file) {
          const uploadResponse = await uploadAttachment({
            companyId: selectedCompanyId,
            description: quoteForm.fileDescription,
            file: quoteForm.file,
            supplierId: quoteForm.supplierId,
            targetId: detail.rfqId,
            targetType: 'RFQ_QUOTE',
            uploadedBy: detail.procurementUserId,
          })
          uploadedAttachments = [uploadResponse.data]
          setQuoteForm((current) => ({
            ...current,
            file: null,
            fileName: uploadResponse.data.originalFileName,
            uploadedAttachments,
          }))
        }

        quoteMutation.mutate({
          rfqId: detail.rfqId,
          supplierId: quoteForm.supplierId,
          payload: {
            attachmentIds: uploadedAttachments.map((attachment) => attachment.attachmentId),
            attachments: uploadedAttachments.length === 0 && quoteForm.fileName
              ? [
                  {
                    contentType: 'application/pdf',
                    description: quoteForm.fileDescription,
                    fileName: quoteForm.fileName,
                    sizeBytes: 0,
                  },
                ]
              : [],
            companyId: selectedCompanyId,
            deliveryDate: quoteForm.deliveryDate,
            procurementUserId: detail.procurementUserId,
            quoteAmount: quoteForm.quoteAmount,
            riskNote: quoteForm.riskNote,
            supplierScore: quoteForm.supplierScore,
            taxRate: quoteForm.taxRate,
          },
        })
      } catch (error) {
        setFeedback({
          message: `${messages.rfq.quoteFailed}: ${error instanceof Error ? error.message : ''}`,
          tone: 'danger',
        })
      } finally {
        setQuoteUploading(false)
      }
    })()
  }

  const requestAiRfqExplanation = () => {
    if (!detail || aiRfqDisabledReason) {
      return
    }
    setAiRfqResponse(null)
    aiRfqMutation.mutate({
      actorId: detail.procurementUserId,
      companyId: selectedCompanyId,
      rfqId: detail.rfqId,
    })
  }

  const closeCreateDrawer = () => {
    setCreateDirty(false)
    onCreateClose()
  }

  const closeDetailDrawer = () => {
    setDetailDrawerOpen(false)
    setFeedback(null)
    setQuoteDirty(false)
    setAiRfqResponse(null)
  }

  const confirmDiscardQuote = useCallback((onOk: () => void) => {
    modal.confirm({
      mousePosition: getViewportCenter(),
      centered: true,
      cancelText: messages.purchaseRequest.continueEdit,
      content: messages.rfq.discardDetailContent,
      focusable: { autoFocusButton: 'cancel' },
      okType: 'danger',
      okText: messages.rfq.discardDetailConfirm,
      onOk,
      rootClassName: 'procure-confirm-modal',
      title: messages.rfq.discardDetailTitle,
    })
  }, [messages, modal])

  const handleDrawerClose = () => {
    if (drawerMode === 'create' && isCreateDirty) {
      modal.confirm({
        mousePosition: getViewportCenter(),
        centered: true,
        cancelText: messages.purchaseRequest.continueEdit,
        content: messages.rfq.discardContent,
        focusable: { autoFocusButton: 'cancel' },
        okType: 'danger',
        okText: messages.rfq.discardConfirm,
        onOk: closeCreateDrawer,
        rootClassName: 'procure-confirm-modal',
        title: messages.rfq.discardTitle,
      })
      return
    }

    if (drawerMode === 'create') {
      closeCreateDrawer()
      return
    }

    if (drawerMode === 'detail' && isQuoteDirty) {
      confirmDiscardQuote(closeDetailDrawer)
      return
    }

    closeDetailDrawer()
  }

  const handleRfqDetailOpen = (rfqId: string) => {
    const openDetail = () => {
      if (rfqId !== selectedRfqId) {
        setQuoteDirty(false)
        setAiRfqResponse(null)
      }
      setSelectedRfqId(rfqId)
      setDetailDrawerOpen(true)
      setFeedback(null)
    }

    if (isDetailDrawerOpen && isQuoteDirty && rfqId !== selectedRfqId) {
      confirmDiscardQuote(openDetail)
      return
    }

    openDetail()
  }

  useEffect(() => {
    if (!routeRfqId) {
      return
    }

    const routeKey = `${location.key}:${routeRfqId}`
    if (handledRouteRfqKey.current === routeKey) {
      return
    }

    if (routeRfqId === selectedRfqId && isDetailDrawerOpen) {
      handledRouteRfqKey.current = routeKey
      return
    }

    if (!rfqs.some((rfq) => rfq.rfqId === routeRfqId)) {
      return
    }

    handledRouteRfqKey.current = routeKey
    const openDetail = () => {
      if (routeRfqId !== selectedRfqId) {
        setQuoteDirty(false)
        setAiRfqResponse(null)
      }
      setSelectedRfqId(routeRfqId)
      setDetailDrawerOpen(true)
      setFeedback(null)
    }

    if (isDetailDrawerOpen && isQuoteDirty && routeRfqId !== selectedRfqId) {
      confirmDiscardQuote(openDetail)
      return
    }

    openDetail()
  }, [
    confirmDiscardQuote,
    isDetailDrawerOpen,
    isQuoteDirty,
    location.key,
    rfqs,
    routeRfqId,
    selectedRfqId,
  ])

  return (
    <>
      {modalContextHolder}
      <section className="request-grid rfq-grid">
        <section className="panel request-list-panel">
          <PanelTitle icon={<FileSearchOutlined />} title={messages.rfq.list} />
          {isError && <div className="data-alert">{messages.rfq.unavailable}</div>}
          <div className="table-wrap">
            <table className="request-table">
              <thead>
                <tr>
                  <th>RFQ</th>
                  <th>{messages.rfq.sourceRequest}</th>
                  <th>{messages.purchaseRequest.category}</th>
                  <th>{messages.rfq.quoteProgress}</th>
                  <th>{messages.purchaseRequest.totalAmount}</th>
                  <th>{messages.purchaseRequest.status}</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{isLoading ? messages.rfq.loading : messages.rfq.empty}</td>
                  </tr>
                ) : (
                  rfqPagination.pageItems.map((rfq) => (
                    <tr key={rfq.rfqId}>
                      <td>
                        <button
                          className={rfq.rfqId === selectedRfqId ? 'row-link active' : 'row-link'}
                          onClick={() => handleRfqDetailOpen(rfq.rfqId)}
                          type="button"
                        >
                          <TruncatedText text={rfq.rfqId} />
                        </button>
                      </td>
                      <td>
                        <TruncatedText text={rfq.requestId} />
                      </td>
                      <td>
                        <TruncatedText text={categoryNameOf(rfq.categoryId, categories)} />
                      </td>
                      <td>{`${rfq.quoteCount}/${rfq.supplierCount}`}</td>
                      <td>{formatCurrency(rfq.requestTotalAmount, rfq.currency, language)}</td>
                      <td>
                        <span className={`tag ${rfqStatusToneOf(rfq.status)}`}>
                          {formatRfqStatus(rfq.status, messages)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ListPagination
            currentPage={rfqPagination.currentPage}
            messages={messages}
            onPageChange={rfqPagination.setPage}
            onPageSizeChange={rfqPagination.setPageSize}
            pageSize={rfqPagination.pageSize}
            totalItems={rfqPagination.totalItems}
            totalPages={rfqPagination.totalPages}
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
        size={840}
      >
        {drawerMode === 'create' ? (
          <form className="request-form rfq-form" onSubmit={handleCreateRfq}>
            <label className="form-wide">
              <span>{messages.rfq.approvedRequest}</span>
              <select
                disabled={approvedRequests.length === 0}
                required
                value={createForm.requestId}
                onChange={(event) => handleCreateRequestChange(event.target.value)}
              >
                {approvedRequests.length === 0 ? (
                  <option value="">{messages.rfq.noAvailableApprovedRequest}</option>
                ) : (
                  approvedRequests.map((request) => (
                    <option key={request.requestId} value={request.requestId}>
                      {request.requestId} · {request.title}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label>
              <span>{messages.rfq.procurementUser}</span>
              <div className="readonly-form-value">
                <TruncatedText text={userNameOf(createForm.procurementUserId, users)} />
              </div>
            </label>
            <label>
              <span>{messages.purchaseRequest.title}</span>
              <input required value={createForm.title} onChange={(event) => updateCreateForm('title', event.target.value)} />
            </label>
            <label className="form-wide">
              <span>{messages.rfq.suppliers}</span>
              <Select
                className="procure-multi-select"
                maxTagCount="responsive"
                mode="multiple"
                options={selectableSuppliers.map((supplier) => ({
                  label: supplier.supplierName,
                  value: supplier.supplierId,
                }))}
                onChange={(value) => updateCreateForm('supplierIds', value)}
                popupClassName="procure-multi-select-dropdown"
                value={createForm.supplierIds}
              />
            </label>
            {selectedCreateRequest && (
              <dl className="detail-grid form-wide">
                <div>
                  <dt>{messages.purchaseRequest.category}</dt>
                  <dd>
                    <TruncatedText text={categoryNameOf(selectedCreateRequest.categoryId, categories)} />
                  </dd>
                </div>
                <div>
                  <dt>{messages.purchaseRequest.totalAmount}</dt>
                  <dd>{formatCurrency(selectedCreateRequest.totalAmount, selectedCreateRequest.currency, language)}</dd>
                </div>
                <div>
                  <dt>{messages.purchaseRequest.expectedDeliveryDate}</dt>
                  <dd>{formatDate(selectedCreateRequest.expectedDeliveryDate, language)}</dd>
                </div>
                <div>
                  <dt>{messages.purchaseRequest.approvalStatus}</dt>
                  <dd>{formatApprovalStatus(selectedCreateRequest.approval?.status ?? 'APPROVED', messages)}</dd>
                </div>
              </dl>
            )}
            <DisabledActionTooltip className="form-wide" title={createRfqDisabledReason}>
              <button className="primary-button form-wide" disabled={Boolean(createRfqDisabledReason)} type="submit">
                <FileSearchOutlined />
                <span>{messages.rfq.create}</span>
              </button>
            </DisabledActionTooltip>
            {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
          </form>
        ) : detail ? (
          <div className="request-detail rfq-detail">
            <div className="detail-heading">
              <div>
                <TruncatedText className="text-strong" text={detail.title} />
                <TruncatedText className="text-small" text={`${detail.rfqId} · ${detail.requestId}`} />
              </div>
              <span className={`tag ${rfqStatusToneOf(detail.status)}`}>
                {formatRfqStatus(detail.status, messages)}
              </span>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>{messages.rfq.procurementUser}</dt>
                <dd>
                  <TruncatedText text={userNameOf(detail.procurementUserId, users)} />
                </dd>
              </div>
              <div>
                <dt>{messages.purchaseRequest.category}</dt>
                <dd>
                  <TruncatedText text={categoryNameOf(detail.categoryId, categories)} />
                </dd>
              </div>
              <div>
                <dt>{messages.purchaseRequest.totalAmount}</dt>
                <dd>{formatCurrency(detail.requestTotalAmount, detail.currency, language)}</dd>
              </div>
              <div>
                <dt>{messages.rfq.quoteProgress}</dt>
                <dd>{`${detail.quotes.length}/${detail.suppliers.length}`}</dd>
              </div>
            </dl>

            <section className="approval-section">
              <PanelTitle icon={<TeamOutlined />} title={messages.rfq.invitedSuppliers} />
              <div className="supplier-invite-list">
                {detail.suppliers.map((supplier) => {
                  const quote = quoteBySupplier.get(supplier.supplierId)
                  return (
                    <button
                      className={supplier.supplierId === quoteForm.supplierId ? 'supplier-chip active' : 'supplier-chip'}
                      key={supplier.supplierId}
                      onClick={() => handleQuoteSupplierChange(supplier.supplierId)}
                      type="button"
                    >
                      <strong title={supplier.supplierName}>{supplier.supplierName}</strong>
                      <span title={quote ? formatCurrency(quote.totalAmount, detail.currency, language) : messages.rfq.noQuote}>
                        {quote ? formatCurrency(quote.totalAmount, detail.currency, language) : messages.rfq.noQuote}
                      </span>
                      <em className={`tag ${riskToneOf(supplier.riskLevel)}`}>
                        {formatRiskLevel(supplier.riskLevel, language)}
                      </em>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="approval-section">
              <PanelTitle icon={<FileSearchOutlined />} title={messages.rfq.quoteEntry} aside={quoteSupplier?.supplierName} />
              <form className="quote-form" onSubmit={handleQuoteSubmit}>
                <label>
                  <span>{messages.rfq.suppliers}</span>
                  <select value={quoteForm.supplierId} onChange={(event) => handleQuoteSupplierChange(event.target.value)}>
                    {detail.suppliers.map((supplier) => (
                      <option key={supplier.supplierId} value={supplier.supplierId}>
                        {supplier.supplierName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{messages.rfq.quoteAmount}</span>
                  <input
                    min="0.01"
                    required
                    step="0.01"
                    type="number"
                    value={quoteForm.quoteAmount}
                    onChange={(event) => updateQuoteForm('quoteAmount', Number(event.target.value))}
                  />
                </label>
                <label>
                  <span>{messages.rfq.taxRate}</span>
                  <input
                    min="0"
                    max="1"
                    required
                    step="0.0001"
                    type="number"
                    value={quoteForm.taxRate}
                    onChange={(event) => updateQuoteForm('taxRate', Number(event.target.value))}
                  />
                </label>
                <label>
                  <span>{messages.rfq.deliveryDate}</span>
                  <input
                    required
                    type="date"
                    value={quoteForm.deliveryDate}
                    onChange={(event) => updateQuoteForm('deliveryDate', event.target.value)}
                  />
                </label>
                <div className="quote-risk-fields">
                  <label>
                    <span>{messages.rfq.supplierScore}</span>
                    <input
                      min="0"
                      max="100"
                      required
                      step="0.01"
                      type="number"
                      value={quoteForm.supplierScore}
                      onChange={(event) => updateQuoteForm('supplierScore', Number(event.target.value))}
                    />
                  </label>
                  <label>
                    <span>{messages.rfq.riskNote}</span>
                    <textarea value={quoteForm.riskNote} onChange={(event) => updateQuoteForm('riskNote', event.target.value)} />
                  </label>
                </div>
                <div className="quote-attachment-fields">
                  <label>
                    <span>{messages.rfq.attachmentFile}</span>
                    <FilePicker
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
                      ariaLabel={messages.rfq.attachmentFile}
                      chooseLabel={messages.rfq.chooseAttachment}
                      noFileLabel={messages.rfq.noAttachmentSelected}
                      selectedLabel={quoteForm.file?.name ?? quoteForm.fileName}
                      onFileChange={(file) => {
                        setQuoteDirty(true)
                        setQuoteForm((current) => ({
                          ...current,
                          file,
                          fileName: file?.name ?? current.fileName,
                          uploadedAttachments: file ? [] : current.uploadedAttachments,
                        }))
                      }}
                    />
                  </label>
                  <label>
                    <span>{messages.rfq.attachmentDescription}</span>
                    <input
                      value={quoteForm.fileDescription}
                      onChange={(event) => updateQuoteForm('fileDescription', event.target.value)}
                    />
                  </label>
                  <AttachmentList
                    attachments={[
                      ...quoteForm.uploadedAttachments,
                      ...(quoteForm.uploadedAttachments.length === 0 && quoteForm.fileName
                        ? [{
                            attachmentId: '',
                            contentType: 'application/pdf',
                            description: quoteForm.fileDescription || null,
                            downloadable: false,
                            downloadDisabledReason: quoteForm.file
                              ? messages.rfq.pendingUploadReason
                              : messages.rfq.metadataOnlyReason,
                            downloadUrl: null,
                            originalFileName: quoteForm.fileName,
                            sizeBytes: quoteForm.file?.size ?? 0,
                            storageStatus: quoteForm.file ? 'PENDING' : 'METADATA_ONLY',
                          }]
                        : []),
                    ]}
                    messages={messages}
                  />
                </div>
                <DisabledActionTooltip className="form-wide" title={saveQuoteDisabledReason}>
                  <button className="primary-button form-wide" disabled={Boolean(saveQuoteDisabledReason)} type="submit">
                    <CheckCircleOutlined />
                    <span>{messages.rfq.saveQuote}</span>
                  </button>
                </DisabledActionTooltip>
              </form>
            </section>

            <section className="approval-section">
              <PanelTitle icon={<NodeIndexOutlined />} title={messages.rfq.comparison} aside={messages.rfq.noPo} />
              <div className="table-wrap">
                <table className="request-table">
                  <thead>
                    <tr>
                      <th>{messages.rfq.rank}</th>
                      <th>{messages.foundation.supplierPool}</th>
                      <th>{messages.rfq.totalAmount}</th>
                      <th>{messages.rfq.deliveryDate}</th>
                      <th>{messages.rfq.score}</th>
                      <th>{messages.foundation.risk}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.length === 0 ? (
                      <tr>
                        <td colSpan={6}>{messages.rfq.noComparison}</td>
                      </tr>
                    ) : (
                      comparisonRows.map((row) => (
                        <tr key={row.supplierId}>
                          <td>
                            <span className={row.rank === 1 ? 'tag success' : 'tag'}>{row.rank}</span>
                          </td>
                          <td>
                            <TruncatedText className="text-strong" text={row.supplierName} />
                            {row.attachments[0] && (
                              <AttachmentInlineAction attachment={row.attachments[0]} messages={messages} />
                            )}
                          </td>
                          <td>{formatCurrency(row.totalAmount, detail.currency, language)}</td>
                          <td>{formatDate(row.deliveryDate, language)}</td>
                          <td>{row.recommendationScore}</td>
                          <td>
                            <span className={`tag ${riskToneOf(row.riskLevel)}`}>
                              {formatRiskLevel(row.riskLevel, language)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="ai-card">
              <div className="ai-action-row">
                <PanelTitle icon={<ApiOutlined />} title={messages.ai.title} aside={messages.ai.dataState} />
                <DisabledActionTooltip title={aiRfqDisabledReason}>
                  <button
                    aria-busy={aiRfqMutation.isPending}
                    className="line-add-button"
                    disabled={Boolean(aiRfqDisabledReason)}
                    onClick={requestAiRfqExplanation}
                    type="button"
                  >
                    {aiRfqMutation.isPending ? <LoadingOutlined /> : <ApiOutlined />}
                    <span>{aiRfqMutation.isPending ? messages.ai.generating : messages.ai.explainQuotes}</span>
                  </button>
                </DisabledActionTooltip>
              </div>
              <AiResultPanel
                isLoading={aiRfqMutation.isPending}
                language={language}
                messages={messages}
                response={aiRfqResponse}
                title={messages.ai.explainQuotes}
              />
            </section>
            {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
          </div>
        ) : (
          <div className="empty-state">{detailQuery.isLoading ? messages.rfq.loading : messages.rfq.empty}</div>
        )}
      </Drawer>
    </>
  )
}
