import { ApiOutlined, CheckCircleOutlined, DeleteOutlined, FileAddOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Drawer, Modal, Select, Tooltip } from 'antd'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { APPLICANT_ROLE_ID, demoUserHasExactRole, demoUserHasRoleCapability } from '../../demoRoleCapabilities'
import type { Language, UserSummary, CategorySummary, SupplierSummary, BudgetAccountSummary, PurchaseRequestDrawerMode, PurchaseRequestListItem, CreatePurchaseRequestDraftPayload, PurchaseRequestFormState, PurchaseRequestFormLine, AiAssistantResponse, AiDraftPreviewResult } from '../../domain/types'
import { fetchPurchaseRequestDetail, createPurchaseRequestDraft, submitPurchaseRequest, deletePurchaseRequestDraft, fetchApprovalByRequest, previewAiPurchaseRequestDraft, reviewAiPurchaseRequestRisk } from '../../api/client'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { useListPagination } from '../../shared/hooks/useListPagination'
import { routeParam } from '../../shared/utils/route'
import { formatCurrency, getViewportCenter, createPurchaseRequestFormLine, lineAmountOf, buildPurchaseRequestFormDefaults, formatPurchaseRequestStatus, statusToneOf, currentStepOf, formatApprovalStatus, categoryNameOf, budgetNameOf, userNameOf, supplierNamesOf, preferredSupplierIdsForCategory, formatDate, formatDateTime, roundAmount } from '../../shared/utils/procurement'
import { ListPagination, TruncatedText, DisabledActionTooltip, AiResultPanel, PanelTitle } from '../../shared/ui/common'
import { ApprovalProgress } from '../../shared/ui/procurementWidgets'

export function PurchaseRequestView({
  activeDemoUser,
  budgetAccounts,
  categories,
  isError,
  isCreateOpen,
  isLoading,
  language,
  messages,
  onCreateClose,
  onRefresh,
  purchaseRequests,
  selectedCompanyId,
  suppliers,
  users,
}: {
  activeDemoUser?: UserSummary
  budgetAccounts: BudgetAccountSummary[]
  categories: CategorySummary[]
  isError: boolean
  isCreateOpen: boolean
  isLoading: boolean
  language: Language
  messages: LocalizedMessages
  onCreateClose: () => void
  onRefresh: () => void
  purchaseRequests: PurchaseRequestListItem[]
  selectedCompanyId: string
  suppliers: SupplierSummary[]
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const [modal, modalContextHolder] = Modal.useModal()
  const wasCreateOpen = useRef(false)
  const handledRouteRequestKey = useRef('')
  const routeRequestId = routeParam(location.search, 'requestId')
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [isCreateDirty, setCreateDirty] = useState(false)
  const [lastDrawerMode, setLastDrawerMode] = useState<PurchaseRequestDrawerMode>('detail')
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const [aiIntent, setAiIntent] = useState<string>(messages.ai.draftDefaultIntent)
  const [aiDraftResponse, setAiDraftResponse] = useState<AiAssistantResponse | null>(null)
  const [aiRiskResponse, setAiRiskResponse] = useState<AiAssistantResponse | null>(null)
  const createSubmitIntentRef = useRef<'draft' | 'submit'>('draft')
  const [form, setForm] = useState<PurchaseRequestFormState>(() =>
    buildPurchaseRequestFormDefaults(selectedCompanyId),
  )
  const purchaseRequestPagination = useListPagination(purchaseRequests, selectedCompanyId)

  useEffect(() => {
    if (purchaseRequests.length === 0) {
      setSelectedRequestId(undefined)
      setDetailDrawerOpen(false)
      return
    }

    if (selectedRequestId && !purchaseRequests.some((request) => request.requestId === selectedRequestId)) {
      setSelectedRequestId(undefined)
      setDetailDrawerOpen(false)
    }
  }, [purchaseRequests, selectedRequestId])

  useEffect(() => {
    const didOpenCreateDrawer = isCreateOpen && !wasCreateOpen.current
    wasCreateOpen.current = isCreateOpen

    if (didOpenCreateDrawer) {
      setLastDrawerMode('create')
      setCreateDirty(false)
      setFeedback(null)
      setAiIntent(messages.ai.draftDefaultIntent)
      setAiDraftResponse(null)
      setAiRiskResponse(null)
      setDetailDrawerOpen(false)
      setForm(buildPurchaseRequestFormDefaults(selectedCompanyId))
    }
  }, [isCreateOpen, messages.ai.draftDefaultIntent, selectedCompanyId])

  useEffect(() => {
    setForm((current) => {
      const requester = users.find(
        (user) =>
          user.userId === current.requesterId &&
          user.active &&
          demoUserHasRoleCapability(user, [APPLICANT_ROLE_ID]),
      )
      const currentCategory = categories.find((category) => category.categoryId === current.categoryId)
      const budgetForCurrentCategory =
        currentCategory &&
        budgetAccounts.find(
          (account) =>
            account.budgetAccountId === current.budgetAccountId &&
            account.categoryId === currentCategory.categoryId &&
            account.active,
        )
      const supplierIds = currentCategory
        ? current.supplierIds.filter((supplierId) =>
            suppliers.some(
              (supplier) =>
                supplier.supplierId === supplierId &&
                supplier.categories.some((category) => category.categoryId === currentCategory.categoryId),
            ),
          )
        : []
      const next = {
        ...current,
        budgetAccountId: budgetForCurrentCategory ? current.budgetAccountId : '',
        categoryId: currentCategory?.categoryId ?? '',
        companyId: selectedCompanyId,
        departmentId: requester?.departmentId ?? '',
        requesterId: requester?.userId ?? '',
        supplierIds,
      }

      if (
        next.budgetAccountId === current.budgetAccountId &&
        next.categoryId === current.categoryId &&
        next.companyId === current.companyId &&
        next.departmentId === current.departmentId &&
        next.requesterId === current.requesterId &&
        next.supplierIds.length === current.supplierIds.length &&
        next.supplierIds.every((supplierId, index) => supplierId === current.supplierIds[index])
      ) {
        return current
      }

      return next
    })
  }, [budgetAccounts, categories, selectedCompanyId, suppliers, users])
  const detailQuery = useQuery({
    queryKey: ['purchase-request', selectedRequestId],
    queryFn: () => fetchPurchaseRequestDetail(selectedRequestId ?? ''),
    enabled: Boolean(selectedRequestId),
    placeholderData: keepPreviousData,
    retry: 1,
  })
  const selectedDetail = detailQuery.data?.data
  const approvalDetailQuery = useQuery({
    queryKey: ['approval-by-request', selectedDetail?.requestId, selectedDetail?.companyId],
    queryFn: () => fetchApprovalByRequest(selectedDetail?.requestId ?? '', selectedDetail?.companyId),
    enabled: Boolean(selectedDetail?.approval),
    placeholderData: keepPreviousData,
    retry: 1,
  })

  const createMutation = useMutation({
    mutationFn: createPurchaseRequestDraft,
    onError: (error) => {
      setFeedback({
        message: `${messages.purchaseRequest.createFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response) => {
      setCreateDirty(false)
      setFeedback({ message: messages.purchaseRequest.createSuccess, tone: 'success' })
      setSelectedRequestId(response.data.requestId)
      setDetailDrawerOpen(true)
      onCreateClose()
      onRefresh()
      void queryClient.invalidateQueries({ queryKey: ['purchase-request', response.data.requestId] })
    },
  })

  const createAndSubmitMutation = useMutation({
    mutationFn: async (payload: CreatePurchaseRequestDraftPayload) => {
      const created = await createPurchaseRequestDraft(payload)
      return submitPurchaseRequest(created.data.requestId)
    },
    onError: (error) => {
      setFeedback({
        message: `${messages.purchaseRequest.submitFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response) => {
      setCreateDirty(false)
      setFeedback({ message: messages.purchaseRequest.submitSuccess, tone: 'success' })
      setSelectedRequestId(response.data.requestId)
      setDetailDrawerOpen(true)
      onCreateClose()
      onRefresh()
      void queryClient.invalidateQueries({ queryKey: ['purchase-request', response.data.requestId] })
      void queryClient.invalidateQueries({ queryKey: ['approval-by-request', response.data.requestId] })
    },
  })

  const submitMutation = useMutation({
    mutationFn: submitPurchaseRequest,
    onError: (error) => {
      setFeedback({
        message: `${messages.purchaseRequest.submitFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response) => {
      setFeedback({ message: messages.purchaseRequest.submitSuccess, tone: 'success' })
      setSelectedRequestId(response.data.requestId)
      onRefresh()
      void queryClient.invalidateQueries({ queryKey: ['purchase-request', response.data.requestId] })
      void queryClient.invalidateQueries({ queryKey: ['approval-by-request', response.data.requestId] })
    },
  })

  const deleteDraftMutation = useMutation({
    mutationFn: ({ actorId, requestId }: { actorId: string; requestId: string }) =>
      deletePurchaseRequestDraft(requestId, actorId),
    onError: (error) => {
      setFeedback({
        message: `${messages.purchaseRequest.deleteFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response) => {
      setFeedback({ message: messages.purchaseRequest.deleteSuccess, tone: 'success' })
      setSelectedRequestId(undefined)
      setDetailDrawerOpen(false)
      setAiRiskResponse(null)
      onRefresh()
      queryClient.removeQueries({ queryKey: ['purchase-request', response.data.requestId] })
    },
  })

  const aiDraftMutation = useMutation({
    mutationFn: previewAiPurchaseRequestDraft,
    onError: (error) => {
      setFeedback({
        message: `${messages.ai.unavailable}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response) => {
      const draft = response.data.result as AiDraftPreviewResult
      setAiDraftResponse(response.data)
      setCreateDirty(true)
      setForm((current) => ({
        ...current,
        budgetAccountId: draft.budgetAccountId || current.budgetAccountId,
        categoryId: draft.categoryId || current.categoryId,
        departmentId: draft.departmentId || current.departmentId,
        description: draft.businessPurpose || current.description,
        expectedDeliveryDate: draft.expectedDeliveryDate || current.expectedDeliveryDate,
        requesterId: draft.requesterId || current.requesterId,
        supplierIds: preferredSupplierIdsForCategory(
          draft.categoryId || current.categoryId,
          suppliers,
          draft.supplierIds ?? (draft.supplierId ? [draft.supplierId] : current.supplierIds),
        ),
        title: draft.title || current.title,
        lineItems:
          draft.lineItems && draft.lineItems.length > 0
            ? draft.lineItems.map((line) =>
                createPurchaseRequestFormLine({
                  estimatedUnitPrice: typeof line.estimatedUnitPrice === 'number' ? line.estimatedUnitPrice : '',
                  itemName: line.itemName ?? '',
                  quantity: typeof line.quantity === 'number' ? line.quantity : '',
                  specification: line.specification ?? '',
                  unit: line.unit ?? '',
                }),
              )
            : current.lineItems,
      }))
    },
  })

  const aiRiskMutation = useMutation({
    mutationFn: reviewAiPurchaseRequestRisk,
    onError: (error) => {
      setFeedback({
        message: `${messages.ai.unavailable}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response) => {
      setAiRiskResponse(response.data)
    },
  })

  const filteredBudgetAccounts = budgetAccounts.filter((account) => account.categoryId === form.categoryId && account.active)
  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.categories.some((category) => category.categoryId === form.categoryId),
  )
  const approvalDetail = approvalDetailQuery.data?.data
  const drawerMode: PurchaseRequestDrawerMode | null = isCreateOpen ? 'create' : isDetailDrawerOpen ? 'detail' : null
  const renderedDrawerMode = drawerMode ?? lastDrawerMode
  const drawerTitle = renderedDrawerMode === 'create' ? messages.purchaseRequest.create : messages.purchaseRequest.detail
  const totalAmount = roundAmount(form.lineItems.reduce((sum, line) => sum + lineAmountOf(line), 0))
  const isCreatePending = createMutation.isPending || createAndSubmitMutation.isPending
  const drawerExtra =
    renderedDrawerMode === 'create' ? (
      <div className="drawer-action-group">
        <button
          className="secondary-button"
          disabled={isCreatePending}
          form="purchase-request-create-form"
          onClick={() => {
            createSubmitIntentRef.current = 'draft'
          }}
          type="submit"
        >
          <FileAddOutlined />
          <span>{messages.purchaseRequest.saveDraft}</span>
        </button>
        <button
          className="primary-button"
          disabled={isCreatePending}
          form="purchase-request-create-form"
          onClick={() => {
            createSubmitIntentRef.current = 'submit'
          }}
          type="submit"
        >
          <CheckCircleOutlined />
          <span>{messages.purchaseRequest.submit}</span>
        </button>
      </div>
    ) : selectedDetail?.status === 'DRAFT' ? (
      <div className="drawer-action-group">
        <button
          className="secondary-button danger"
          disabled={deleteDraftMutation.isPending || submitMutation.isPending}
          onClick={confirmDeleteDraft}
          type="button"
        >
          <DeleteOutlined />
          <span>{messages.purchaseRequest.deleteDraft}</span>
        </button>
        <button
          className="primary-button"
          disabled={deleteDraftMutation.isPending || submitMutation.isPending}
          onClick={() => submitMutation.mutate(selectedDetail.requestId)}
          type="button"
        >
          <CheckCircleOutlined />
          <span>{messages.purchaseRequest.submit}</span>
        </button>
      </div>
    ) : null

  const updateForm = <Key extends keyof PurchaseRequestFormState>(key: Key, value: PurchaseRequestFormState[Key]) => {
    setCreateDirty(true)
    setForm((current) => ({ ...current, [key]: value }))
  }

  const aiDraftActorId =
    form.requesterId ||
    (activeDemoUser?.companyId === selectedCompanyId &&
    demoUserHasRoleCapability(activeDemoUser, [APPLICANT_ROLE_ID])
      ? activeDemoUser.userId
      : '') ||
    users.find((user) => user.active && demoUserHasExactRole(user, [APPLICANT_ROLE_ID]))?.userId ||
    users.find((user) => user.active)?.userId ||
    ''
  const aiDraftDisabledReason = aiDraftMutation.isPending
    ? messages.ai.generating
    : !aiIntent.trim()
      ? messages.ai.disabledNoIntent
      : !aiDraftActorId
        ? messages.ai.disabledNoActor
        : undefined

  const requestAiDraft = () => {
    if (aiDraftDisabledReason) {
      return
    }
    setAiDraftResponse(null)
    aiDraftMutation.mutate({
      actorId: aiDraftActorId,
      companyId: selectedCompanyId,
      intent: aiIntent,
    })
  }

  const requestAiRisk = () => {
    if (!selectedDetail) {
      return
    }
    setAiRiskResponse(null)
    aiRiskMutation.mutate({
      actorId: selectedDetail.approval?.currentApproverId ?? selectedDetail.requesterId,
      companyId: selectedDetail.companyId,
      requestId: selectedDetail.requestId,
    })
  }

  function confirmDeleteDraft() {
    if (!selectedDetail) {
      return
    }

    const actorId = activeDemoUser?.userId ?? selectedDetail.requesterId
    modal.confirm({
      mousePosition: getViewportCenter(),
      centered: true,
      cancelText: messages.purchaseRequest.continueEdit,
      content: messages.purchaseRequest.deleteConfirmContent,
      focusable: { autoFocusButton: 'cancel' },
      okButtonProps: { danger: true, loading: deleteDraftMutation.isPending },
      okText: messages.purchaseRequest.deleteConfirm,
      onOk: () => deleteDraftMutation.mutateAsync({ actorId, requestId: selectedDetail.requestId }),
      rootClassName: 'procure-confirm-modal',
      title: messages.purchaseRequest.deleteConfirmTitle,
    })
  }

  const updateLineItem = <Key extends keyof Omit<PurchaseRequestFormLine, 'lineKey'>>(
    lineKey: string,
    key: Key,
    value: PurchaseRequestFormLine[Key],
  ) => {
    setCreateDirty(true)
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((line) => (line.lineKey === lineKey ? { ...line, [key]: value } : line)),
    }))
  }

  const addLineItem = () => {
    setCreateDirty(true)
    setForm((current) => ({
      ...current,
      lineItems: [...current.lineItems, createPurchaseRequestFormLine()],
    }))
  }

  const removeLineItem = (lineKey: string) => {
    setCreateDirty(true)
    setForm((current) => ({
      ...current,
      lineItems:
        current.lineItems.length > 1 ? current.lineItems.filter((line) => line.lineKey !== lineKey) : current.lineItems,
    }))
  }

  const parseOptionalNumber = (value: string) => (value === '' ? '' : Number(value))

  const handleRequesterChange = (requesterId: string) => {
    setCreateDirty(true)
    const requester = users.find((user) => user.userId === requesterId)
    setForm((current) => ({
      ...current,
      departmentId: requester?.departmentId ?? current.departmentId,
      requesterId,
    }))
  }

  const handleCategoryChange = (categoryId: string) => {
    setCreateDirty(true)
    const budgetAccount =
      budgetAccounts.find((account) => account.categoryId === categoryId && account.active) ?? budgetAccounts[0]
    const supplierIds = preferredSupplierIdsForCategory(categoryId, suppliers)
    setForm((current) => ({
      ...current,
      budgetAccountId: budgetAccount?.budgetAccountId ?? '',
      categoryId,
      supplierIds,
    }))
  }

  const handleCreateDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.companyId || !form.requesterId || !form.departmentId || !form.categoryId || !form.budgetAccountId) {
      setFeedback({ message: messages.purchaseRequest.unavailable, tone: 'danger' })
      return
    }

    const payload = {
      budgetAccountId: form.budgetAccountId,
      categoryId: form.categoryId,
      companyId: form.companyId,
      currency: 'CNY',
      departmentId: form.departmentId,
      description: form.description,
      expectedDeliveryDate: form.expectedDeliveryDate,
      requesterId: form.requesterId,
      supplierId: form.supplierIds[0] || undefined,
      supplierIds: form.supplierIds.length > 0 ? form.supplierIds : undefined,
      title: form.title,
      totalAmount,
      lineItems: form.lineItems.map((line) => ({
        estimatedAmount: lineAmountOf(line),
        estimatedUnitPrice: Number(line.estimatedUnitPrice),
        itemName: line.itemName,
        quantity: Number(line.quantity),
        specification: line.specification,
        unit: line.unit,
      })),
    }
    const intent = createSubmitIntentRef.current
    createSubmitIntentRef.current = 'draft'

    if (intent === 'submit') {
      createAndSubmitMutation.mutate(payload)
      return
    }

    createMutation.mutate(payload)
  }

  const handleRequestDetailOpen = (requestId: string) => {
    setFeedback(null)
    setAiRiskResponse(null)
    setLastDrawerMode('detail')
    setSelectedRequestId(requestId)
    setDetailDrawerOpen(true)
  }

  useEffect(() => {
    if (!routeRequestId) {
      return
    }

    const routeKey = `${location.key}:${routeRequestId}`
    if (handledRouteRequestKey.current === routeKey) {
      return
    }

    if (routeRequestId === selectedRequestId && isDetailDrawerOpen) {
      handledRouteRequestKey.current = routeKey
      return
    }

    if (!purchaseRequests.some((request) => request.requestId === routeRequestId)) {
      return
    }

    handledRouteRequestKey.current = routeKey
    setFeedback(null)
    setAiRiskResponse(null)
    setLastDrawerMode('detail')
    setSelectedRequestId(routeRequestId)
    setDetailDrawerOpen(true)
  }, [isDetailDrawerOpen, location.key, purchaseRequests, routeRequestId, selectedRequestId])

  const closeCreateDrawer = () => {
    setLastDrawerMode('create')
    setCreateDirty(false)
    setAiIntent(messages.ai.draftDefaultIntent)
    setAiDraftResponse(null)
    setDetailDrawerOpen(false)
    onCreateClose()
  }

  const handleDrawerClose = () => {
    if (drawerMode === 'create') {
      if (isCreateDirty) {
        modal.confirm({
          mousePosition: getViewportCenter(),
          centered: true,
          cancelText: messages.purchaseRequest.continueEdit,
          content: messages.purchaseRequest.discardContent,
          focusable: { autoFocusButton: 'cancel' },
          okType: 'danger',
          okText: messages.purchaseRequest.discardConfirm,
          onOk: closeCreateDrawer,
          rootClassName: 'procure-confirm-modal',
          title: messages.purchaseRequest.discardTitle,
        })
        return
      }

      closeCreateDrawer()
      return
    }

    setDetailDrawerOpen(false)
  }

  return (
    <>
      {modalContextHolder}
      <section className="request-grid">
        <section className="panel request-list-panel">
          <PanelTitle
            icon={<FileAddOutlined />}
            title={messages.purchaseRequest.list}
          />
          {isError && <div className="data-alert">{messages.purchaseRequest.unavailable}</div>}
          <div className="table-wrap">
            <table className="request-table">
              <thead>
                <tr>
                  <th>{messages.purchaseRequest.requestId}</th>
                  <th>{messages.purchaseRequest.title}</th>
                  <th>{messages.purchaseRequest.category}</th>
                  <th>{messages.purchaseRequest.totalAmount}</th>
                  <th>{messages.purchaseRequest.currentStep}</th>
                  <th>{messages.purchaseRequest.status}</th>
                </tr>
              </thead>
              <tbody>
                {purchaseRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{isLoading ? messages.purchaseRequest.loading : messages.purchaseRequest.empty}</td>
                  </tr>
                ) : (
	                  purchaseRequestPagination.pageItems.map((request) => (
	                    <tr key={request.requestId}>
	                      <td>
                          <button
                            aria-label={`${messages.purchaseRequest.requestId}: ${request.requestId}`}
                            className={request.requestId === selectedRequestId ? 'row-link active' : 'row-link'}
                            onClick={() => handleRequestDetailOpen(request.requestId)}
                            type="button"
                          >
                            <TruncatedText text={request.requestId} />
                          </button>
	                      </td>
	                      <td>
	                        <TruncatedText text={request.title} />
	                      </td>
	                      <td>
	                        <TruncatedText text={categoryNameOf(request.categoryId, categories)} />
	                      </td>
	                      <td>
	                        {formatCurrency(request.totalAmount, request.currency, language)}
	                      </td>
	                      <td>
	                        <TruncatedText text={currentStepOf(request.status, messages, request.approval)} />
	                      </td>
	                      <td>
	                        <span
	                          className={`tag ${statusToneOf(request.status)}`}
	                        >
	                          {formatPurchaseRequestStatus(request.status, messages)}
	                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <ListPagination
            currentPage={purchaseRequestPagination.currentPage}
            messages={messages}
            onPageChange={purchaseRequestPagination.setPage}
            onPageSizeChange={purchaseRequestPagination.setPageSize}
            pageSize={purchaseRequestPagination.pageSize}
            totalItems={purchaseRequestPagination.totalItems}
            totalPages={purchaseRequestPagination.totalPages}
          />
        </section>

      </section>

		      <Drawer
		        className="request-drawer"
		        destroyOnClose={false}
		        keyboard
		        maskClosable
		        extra={drawerExtra}
		        onClose={handleDrawerClose}
	        open={drawerMode !== null}
	        title={drawerTitle}
	        size={760}
	      >
	        {renderedDrawerMode === 'create' ? (
	        <form className="request-form" id="purchase-request-create-form" onSubmit={handleCreateDraft}>
          <section className="ai-card form-wide">
            <PanelTitle icon={<ApiOutlined />} title={messages.ai.title} aside={messages.ai.dataState} />
            <label className="form-wide">
              <span>{messages.ai.draftIntent}</span>
              <textarea
                placeholder={messages.ai.draftPlaceholder}
                value={aiIntent}
                onChange={(event) => setAiIntent(event.target.value)}
              />
            </label>
            {!aiDraftMutation.isPending && (
              <DisabledActionTooltip className="form-wide" title={aiDraftDisabledReason}>
                <button
                  className="line-add-button"
                  disabled={Boolean(aiDraftDisabledReason)}
                  onClick={requestAiDraft}
                  type="button"
                >
                  <ApiOutlined />
                  <span>{messages.ai.generateDraft}</span>
                </button>
              </DisabledActionTooltip>
            )}
            <AiResultPanel
              isLoading={aiDraftMutation.isPending}
              language={language}
              messages={messages}
              response={aiDraftResponse}
              title={messages.ai.result}
            />
          </section>
          <label>
            <span>{messages.purchaseRequest.title}</span>
            <input required value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
          </label>
          <label>
            <span>{messages.purchaseRequest.requester}</span>
            <select required value={form.requesterId} onChange={(event) => handleRequesterChange(event.target.value)}>
              <option value="" disabled>{messages.purchaseRequest.selectRequester}</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.displayName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{messages.purchaseRequest.category}</span>
            <select required value={form.categoryId} onChange={(event) => handleCategoryChange(event.target.value)}>
              <option value="" disabled>{messages.purchaseRequest.selectCategory}</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{messages.purchaseRequest.budgetAccount}</span>
            <select required value={form.budgetAccountId} onChange={(event) => updateForm('budgetAccountId', event.target.value)}>
              <option value="" disabled>{messages.purchaseRequest.selectBudgetAccount}</option>
              {filteredBudgetAccounts.map((account) => (
                <option key={account.budgetAccountId} value={account.budgetAccountId}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{messages.purchaseRequest.supplier}</span>
            <Select
              allowClear
              className="procure-multi-select"
              maxTagCount="responsive"
              mode="multiple"
              onChange={(value) => updateForm('supplierIds', value)}
              options={filteredSuppliers.map((supplier) => ({
                label: supplier.supplierName,
                value: supplier.supplierId,
              }))}
              placeholder={messages.purchaseRequest.noSupplier}
              popupClassName="procure-multi-select-dropdown"
              value={form.supplierIds}
            />
          </label>
          <label>
            <span>{messages.purchaseRequest.expectedDeliveryDate}</span>
            <input
              required
              type="date"
              value={form.expectedDeliveryDate}
              onChange={(event) => updateForm('expectedDeliveryDate', event.target.value)}
            />
          </label>
          <label className="form-wide">
            <span>{messages.purchaseRequest.description}</span>
            <textarea value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
          </label>
          <section className="line-items-card form-wide">
            <div className="line-items-heading">
              <span>{messages.purchaseRequest.lineItems}</span>
              <button className="line-add-button" onClick={addLineItem} type="button">
                <PlusOutlined />
                <span>{messages.purchaseRequest.addLineItem}</span>
              </button>
            </div>
            <div className="line-items-table-wrap">
              <table className="line-items-table">
                <thead>
                  <tr>
                    <th>{messages.purchaseRequest.itemName}</th>
                    <th>{messages.purchaseRequest.specification}</th>
                    <th>{messages.purchaseRequest.quantity}</th>
                    <th>{messages.purchaseRequest.unit}</th>
                    <th>{messages.purchaseRequest.estimatedUnitPrice}</th>
                    <th>{messages.purchaseRequest.lineSubtotal}</th>
                    <th aria-label={messages.purchaseRequest.removeLineItem} />
                  </tr>
                </thead>
                <tbody>
                  {form.lineItems.map((line) => (
                    <tr key={line.lineKey}>
                      <td>
	                        <input
	                          aria-label={messages.purchaseRequest.itemName}
	                          required
	                          value={line.itemName}
	                          onChange={(event) => updateLineItem(line.lineKey, 'itemName', event.target.value)}
	                        />
                      </td>
                      <td>
	                        <input
	                          aria-label={messages.purchaseRequest.specification}
	                          value={line.specification}
	                          onChange={(event) => updateLineItem(line.lineKey, 'specification', event.target.value)}
	                        />
                      </td>
                      <td>
                        <input
                          aria-label={messages.purchaseRequest.quantity}
                          min="0.01"
                          required
                          step="0.01"
                          type="number"
                          value={line.quantity}
                          onChange={(event) => updateLineItem(line.lineKey, 'quantity', parseOptionalNumber(event.target.value))}
                        />
                      </td>
                      <td>
	                        <input
	                          aria-label={messages.purchaseRequest.unit}
	                          required
	                          value={line.unit}
	                          onChange={(event) => updateLineItem(line.lineKey, 'unit', event.target.value)}
	                        />
                      </td>
                      <td>
                        <input
                          aria-label={messages.purchaseRequest.estimatedUnitPrice}
                          min="0.01"
                          required
                          step="0.01"
                          type="number"
                          value={line.estimatedUnitPrice}
                          onChange={(event) =>
                            updateLineItem(line.lineKey, 'estimatedUnitPrice', parseOptionalNumber(event.target.value))
                          }
                        />
                      </td>
	                      <td className="line-subtotal">
                        {formatCurrency(lineAmountOf(line), 'CNY', language)}
                      </td>
                      <td>
                        <Tooltip title={messages.purchaseRequest.removeLineItem}>
                          <button
                            aria-label={messages.purchaseRequest.removeLineItem}
                            className="icon-button line-delete-button"
                            disabled={form.lineItems.length === 1}
                            onClick={() => removeLineItem(line.lineKey)}
                            type="button"
                          >
                            <DeleteOutlined />
                          </button>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="line-items-total">
              <span>{messages.purchaseRequest.totalAmount}</span>
              <strong>{formatCurrency(totalAmount, 'CNY', language)}</strong>
            </div>
          </section>
          {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
	        </form>
	        ) : selectedDetail ? (
		          <div className="request-detail">
		            <div className="detail-heading">
		              <div>
		                <TruncatedText className="text-strong" text={selectedDetail.title} />
		                <TruncatedText className="text-small" text={selectedDetail.requestId} />
		              </div>
		              <span
		                className={`tag ${statusToneOf(selectedDetail.status)}`}
		              >
		                {formatPurchaseRequestStatus(selectedDetail.status, messages)}
		              </span>
	            </div>
	            <dl className="detail-grid">
		              <div>
		                <dt>{messages.purchaseRequest.requester}</dt>
		                <dd>
		                  <TruncatedText text={userNameOf(selectedDetail.requesterId, users)} />
		                </dd>
		              </div>
		              <div>
		                <dt>{messages.purchaseRequest.category}</dt>
		                <dd>
		                  <TruncatedText text={categoryNameOf(selectedDetail.categoryId, categories)} />
		                </dd>
		              </div>
		              <div>
		                <dt>{messages.purchaseRequest.budgetAccount}</dt>
		                <dd>
		                  <TruncatedText text={budgetNameOf(selectedDetail.budgetAccountId, budgetAccounts)} />
		                </dd>
		              </div>
		              <div>
		                <dt>{messages.purchaseRequest.supplier}</dt>
		                <dd>
		                  <TruncatedText text={supplierNamesOf(selectedDetail, suppliers, messages)} />
		                </dd>
		              </div>
		              <div>
		                <dt>{messages.purchaseRequest.expectedDeliveryDate}</dt>
		                <dd>{formatDate(selectedDetail.expectedDeliveryDate, language)}</dd>
		              </div>
		              <div>
		                <dt>{messages.purchaseRequest.totalAmount}</dt>
		                <dd>{formatCurrency(selectedDetail.totalAmount, selectedDetail.currency, language)}</dd>
		              </div>
		              <div>
		                <dt>{messages.purchaseRequest.submittedAt}</dt>
		                <dd>
		                  {selectedDetail.submittedAt
		                    ? formatDateTime(selectedDetail.submittedAt, language)
		                    : messages.purchaseRequest.notSubmitted}
		                </dd>
		              </div>
		              <div>
		                <dt>{messages.purchaseRequest.currentStep}</dt>
		                <dd>{currentStepOf(selectedDetail.status, messages, selectedDetail.approval)}</dd>
		              </div>
		              <div>
		                <dt>{messages.purchaseRequest.approvalStatus}</dt>
		                <dd>
		                  {selectedDetail.approval
		                    ? formatApprovalStatus(selectedDetail.approval.status, messages)
		                    : messages.purchaseRequest.noApproval}
		                </dd>
		              </div>
		              <div>
		                <dt>{messages.purchaseRequest.currentApprover}</dt>
		                <dd>
		                  {selectedDetail.approval
		                    ? selectedDetail.approval.currentApproverId
		                      ? userNameOf(selectedDetail.approval.currentApproverId, users)
		                      : messages.approval.terminal
		                    : messages.purchaseRequest.noApproval}
		                </dd>
		              </div>
		            </dl>
                <section className="ai-card">
                  <div className="ai-action-row">
                    <PanelTitle icon={<ApiOutlined />} title={messages.ai.title} aside={messages.ai.dataState} />
                    <button
                      aria-busy={aiRiskMutation.isPending}
                      className="line-add-button"
                      disabled={aiRiskMutation.isPending}
                      onClick={requestAiRisk}
                      type="button"
                    >
                      {aiRiskMutation.isPending ? <LoadingOutlined /> : <ApiOutlined />}
                      <span>{aiRiskMutation.isPending ? messages.ai.generating : messages.ai.reviewRisk}</span>
                    </button>
                  </div>
                  <AiResultPanel
                    isLoading={aiRiskMutation.isPending}
                    language={language}
                    messages={messages}
                    response={aiRiskResponse}
                    title={messages.ai.reviewRisk}
                  />
                </section>
		            {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
		            <p className="detail-description">{selectedDetail.description}</p>
	            <div className="table-wrap">
	              <table className="request-table">
	                <thead>
	                  <tr>
	                    <th>{messages.purchaseRequest.itemName}</th>
	                    <th>{messages.purchaseRequest.quantity}</th>
	                    <th>{messages.purchaseRequest.estimatedUnitPrice}</th>
	                    <th>{messages.purchaseRequest.totalAmount}</th>
	                  </tr>
	                </thead>
	                <tbody>
	                  {selectedDetail.lineItems.map((line) => (
	                    <tr key={line.lineNo}>
	                      <td>
	                        <TruncatedText className="text-strong" text={line.itemName} />
	                        {line.specification && <TruncatedText className="text-small" text={line.specification} />}
	                      </td>
	                      <td>{`${line.quantity} ${line.unit}`}</td>
	                      <td>
	                        {formatCurrency(line.estimatedUnitPrice, selectedDetail.currency, language)}
	                      </td>
	                      <td>
	                        {formatCurrency(line.estimatedAmount, selectedDetail.currency, language)}
	                      </td>
	                    </tr>
	                  ))}
	                </tbody>
	              </table>
	            </div>
	            {selectedDetail.approval && (
	              approvalDetail ? (
	                <ApprovalProgress
	                  aside={formatApprovalStatus(selectedDetail.approval.status, messages)}
	                  language={language}
	                  messages={messages}
	                  nodes={approvalDetail.nodes}
	                  records={approvalDetail.timeline}
	                  users={users}
	                />
	              ) : (
	                <ApprovalProgress
	                  aside={formatApprovalStatus(selectedDetail.approval.status, messages)}
	                  language={language}
	                  messages={messages}
	                  records={selectedDetail.approval.timeline}
	                  users={users}
	                />
	              )
	            )}
	          </div>
	        ) : (
	          <div className="empty-state">{isLoading ? messages.purchaseRequest.loading : messages.purchaseRequest.empty}</div>
	        )}
	      </Drawer>
    </>
  )
}
