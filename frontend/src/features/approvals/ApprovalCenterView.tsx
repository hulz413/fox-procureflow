import { AlertOutlined, ApiOutlined, AuditOutlined, CheckCircleOutlined, LoadingOutlined, ProfileOutlined, SwapOutlined } from '@ant-design/icons'
import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Drawer, Modal } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ADMIN_ROLE_ID, APPROVER_ROLE_ID, FINANCE_ROLE_ID, demoUserHasExactRole } from '../../demoRoleCapabilities'
import { ALL_APPROVERS_VALUE } from '../../domain/types'
import type { Language, UserSummary, CategorySummary, SupplierSummary, BudgetAccountSummary, DepartmentSummary, AiAssistantResponse, ApprovalTask } from '../../domain/types'
import { fetchApprovalTasks, fetchApprovalDetail, approveApproval, rejectApproval, withdrawApproval, reviewAiPurchaseRequestRisk } from '../../api/client'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { useListPagination } from '../../shared/hooks/useListPagination'
import { routeParam } from '../../shared/utils/route'
import { formatCurrency, getViewportCenter, formatApprovalStatus, approvalStatusToneOf, contextText, contextAmount, categoryNameOf, budgetNameOf, userNameOf, contextSupplierText, formatDate, formatDateTime } from '../../shared/utils/procurement'
import { ListPagination, TruncatedText, DisabledActionTooltip, AiResultPanel, PanelTitle } from '../../shared/ui/common'
import { ApprovalProgress } from '../../shared/ui/procurementWidgets'

export function ApprovalCenterView({
  activeDemoUser,
  budgetAccounts,
  categories,
  departments,
  isError,
  isLoading,
  language,
  messages,
  selectedCompanyId,
  suppliers,
  users,
}: {
  activeDemoUser?: UserSummary
  budgetAccounts: BudgetAccountSummary[]
  categories: CategorySummary[]
  departments: DepartmentSummary[]
  isError: boolean
  isLoading: boolean
  language: Language
  messages: LocalizedMessages
  selectedCompanyId: string
  suppliers: SupplierSummary[]
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const [modal, modalContextHolder] = Modal.useModal()
  const handledRouteApprovalKey = useRef('')
  const routeApprovalId = routeParam(location.search, 'approvalId')
  const isAdmin = demoUserHasExactRole(activeDemoUser, [ADMIN_ROLE_ID])
  const approvers = users.filter(
    (user) =>
      user.active &&
      user.companyId === selectedCompanyId &&
      demoUserHasExactRole(user, [APPROVER_ROLE_ID, FINANCE_ROLE_ID]),
  )
  const activeApproverId = approvers.find((user) => user.userId === activeDemoUser?.userId)?.userId ?? ''
  const approverIdsKey = approvers.map((user) => user.userId).join('|')
  const [selectedApproverId, setSelectedApproverId] = useState(isAdmin ? ALL_APPROVERS_VALUE : activeApproverId)
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const [aiRiskResponse, setAiRiskResponse] = useState<AiAssistantResponse | null>(null)

  useEffect(() => {
    if (isAdmin) {
      setSelectedApproverId((current) =>
        current === ALL_APPROVERS_VALUE || approvers.some((user) => user.userId === current)
          ? current
          : ALL_APPROVERS_VALUE,
      )
      return
    }

    if (activeApproverId) {
      setSelectedApproverId((current) => (current === activeApproverId ? current : activeApproverId))
      return
    }

    setSelectedApproverId('')
  }, [activeApproverId, approverIdsKey, approvers, isAdmin])

  const tasksQuery = useQuery({
    queryKey: ['approval-tasks', selectedCompanyId, selectedApproverId],
    queryFn: () => fetchApprovalTasks(selectedCompanyId, selectedApproverId),
    enabled: selectedCompanyId.length > 0 && selectedApproverId.length > 0 && selectedApproverId !== ALL_APPROVERS_VALUE,
    placeholderData: keepPreviousData,
    retry: 1,
  })
  const allApproverTaskQueries = useQueries({
    queries: isAdmin && selectedApproverId === ALL_APPROVERS_VALUE
      ? approvers.map((approver) => ({
          queryKey: ['approval-tasks', selectedCompanyId, approver.userId],
          queryFn: () => fetchApprovalTasks(selectedCompanyId, approver.userId),
          enabled: selectedCompanyId.length > 0,
          retry: 1,
        }))
      : [],
  })
  const allApproverTasks = useMemo(
    () =>
      Array.from(
        new Map(
          allApproverTaskQueries
            .flatMap((query) => query.data?.data ?? [])
            .map((task) => [task.nodeId, task]),
        ).values(),
      ).sort((left, right) => {
        const leftTime = left.activatedAt ? new Date(left.activatedAt).getTime() : 0
        const rightTime = right.activatedAt ? new Date(right.activatedAt).getTime() : 0
        return leftTime - rightTime
      }),
    [allApproverTaskQueries],
  )
  const isAllApproverMode = isAdmin && selectedApproverId === ALL_APPROVERS_VALUE
  const tasks = isAllApproverMode ? allApproverTasks : (tasksQuery.isPlaceholderData ? [] : (tasksQuery.data?.data ?? []))
  const taskPagination = useListPagination(tasks, `${selectedCompanyId}:${selectedApproverId}`)
  const tasksLoading = isAllApproverMode
    ? allApproverTaskQueries.some((query) => query.isLoading)
    : tasksQuery.isLoading
  const tasksError = isAllApproverMode
    ? allApproverTaskQueries.some((query) => query.isError)
    : tasksQuery.isError

  const detailQuery = useQuery({
    queryKey: ['approval-detail', selectedApprovalId, selectedCompanyId],
    queryFn: () => fetchApprovalDetail(selectedApprovalId ?? '', selectedCompanyId),
    enabled: Boolean(selectedApprovalId),
    retry: 1,
  })
  const detail = detailQuery.data?.data
  const activeNode = detail?.nodes.find((node) => node.status === 'ACTIVE')
  const summaryDepartmentId = detail ? contextText(detail.contextSnapshot, 'departmentId') : ''
  const summaryBudgetAccountId = detail ? contextText(detail.contextSnapshot, 'budgetAccountId') : ''
  const summaryExpectedDeliveryDate = detail ? contextText(detail.contextSnapshot, 'expectedDeliveryDate') : ''
  const summaryDepartmentName =
    departments.find((department) => department.departmentId === summaryDepartmentId)?.departmentName ??
    users.find((user) => user.departmentId === summaryDepartmentId)?.departmentName ??
    summaryDepartmentId
  const summaryBudgetAccountName = budgetNameOf(summaryBudgetAccountId, budgetAccounts)
  const summarySupplierText = detail ? contextSupplierText(detail.contextSnapshot, suppliers, messages) : ''
  const summaryDeliveryDateText = summaryExpectedDeliveryDate
    ? formatDate(summaryExpectedDeliveryDate, language)
    : '-'
  const approvalActorId = selectedApproverId === ALL_APPROVERS_VALUE ? activeNode?.approverId ?? '' : selectedApproverId
  const canApprove =
    detail?.status === 'IN_PROGRESS' &&
    Boolean(activeNode) &&
    (isAdmin || activeNode?.approverId === selectedApproverId)
  const canWithdraw = detail?.status === 'IN_PROGRESS'

  const actionMutation = useMutation({
    mutationFn: ({
      action,
      actorId,
      approvalId,
      comment,
    }: {
      action: 'approve' | 'reject' | 'withdraw'
      actorId: string
      approvalId: string
      comment: string
    }) => {
      const payload = { actorId, comment: comment.trim() || undefined }
      if (action === 'approve') {
        return approveApproval(approvalId, payload)
      }
      if (action === 'reject') {
        return rejectApproval(approvalId, payload)
      }
      return withdrawApproval(approvalId, payload)
    },
    onError: (error) => {
      setFeedback({
        message: `${messages.approval.actionFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: (response, variables) => {
      const successMessage =
        variables.action === 'approve'
          ? messages.approval.approveSuccess
          : variables.action === 'reject'
            ? messages.approval.rejectSuccess
            : messages.approval.withdrawSuccess
      setComment('')
      setFeedback({ message: successMessage, tone: 'success' })
      setSelectedApprovalId(response.data.approvalId)
      void queryClient.invalidateQueries({ queryKey: ['approval-tasks'] })
      void queryClient.invalidateQueries({ queryKey: ['approval-detail', response.data.approvalId] })
      void queryClient.invalidateQueries({ queryKey: ['approval-by-request', response.data.requestId] })
      void queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      void queryClient.invalidateQueries({ queryKey: ['purchase-request', response.data.requestId] })
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

  const approveDisabledReason = actionMutation.isPending
    ? messages.approval.actionPendingReason
    : !canApprove
      ? messages.approval.approveDisabledReason
      : undefined
  const rejectDisabledReason = actionMutation.isPending
    ? messages.approval.actionPendingReason
    : !canApprove
      ? messages.approval.rejectDisabledReason
      : undefined
  const withdrawDisabledReason = actionMutation.isPending
    ? messages.approval.actionPendingReason
    : !canWithdraw
      ? messages.approval.withdrawDisabledReason
      : undefined

  const runApprovalAction = (action: 'approve' | 'reject' | 'withdraw') => {
    if (!detail) {
      return
    }

    actionMutation.mutate({
      action,
      actorId: action === 'withdraw' ? detail.requesterId : approvalActorId,
      approvalId: detail.approvalId,
      comment,
    })
  }

  const requestAiRisk = () => {
    if (!detail) {
      return
    }
    setAiRiskResponse(null)
    aiRiskMutation.mutate({
      actorId: approvalActorId || detail.requesterId,
      companyId: detail.companyId,
      requestId: detail.requestId,
    })
  }

  const closeApprovalDrawer = () => {
    setDetailDrawerOpen(false)
    setComment('')
    setFeedback(null)
    setAiRiskResponse(null)
  }

  useEffect(() => {
    if (!routeApprovalId) {
      return
    }

    const routeKey = `${location.key}:${routeApprovalId}`
    if (handledRouteApprovalKey.current === routeKey) {
      return
    }

    if (routeApprovalId === selectedApprovalId && isDetailDrawerOpen) {
      handledRouteApprovalKey.current = routeKey
      return
    }

    handledRouteApprovalKey.current = routeKey
    setSelectedApprovalId(routeApprovalId)
    setDetailDrawerOpen(true)
    setComment('')
    setFeedback(null)
    setAiRiskResponse(null)
  }, [isDetailDrawerOpen, location.key, routeApprovalId, selectedApprovalId])

  const handleApprovalDrawerClose = () => {
    if (comment.length > 0) {
      modal.confirm({
        mousePosition: getViewportCenter(),
        centered: true,
        cancelText: messages.purchaseRequest.continueEdit,
        content: messages.approval.discardContent,
        focusable: { autoFocusButton: 'cancel' },
        okType: 'danger',
        okText: messages.approval.discardConfirm,
        onOk: closeApprovalDrawer,
        rootClassName: 'procure-confirm-modal',
        title: messages.approval.discardTitle,
      })
      return
    }

    closeApprovalDrawer()
  }

  return (
    <>
    {modalContextHolder}
    <section className="approval-grid">
      <section className="panel approval-task-panel">
        <PanelTitle icon={<AuditOutlined />} title={messages.approval.taskList} />
        {(isError || tasksError) && <div className="data-alert">{messages.approval.unavailable}</div>}
        <div className="table-wrap">
          <table className="request-table approval-task-table">
            <thead>
              <tr>
                <th>{messages.purchaseRequest.requestId}</th>
                <th>{messages.purchaseRequest.title}</th>
                <th>{messages.purchaseRequest.totalAmount}</th>
                <th>{messages.approval.node}</th>
                <th>{messages.approval.arrivedAt}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    {isLoading || tasksLoading ? messages.approval.loading : messages.approval.emptyTasks}
                  </td>
                </tr>
              ) : (
                taskPagination.pageItems.map((task) => (
                  <tr key={task.nodeId}>
                    <td>
                      <button
                        className={task.approvalId === selectedApprovalId ? 'row-link active' : 'row-link'}
                        onClick={() => {
                          setSelectedApprovalId(task.approvalId)
                          setDetailDrawerOpen(true)
                          setFeedback(null)
                          setAiRiskResponse(null)
                        }}
                        type="button"
                      >
                        <TruncatedText text={task.requestId} />
                      </button>
                    </td>
                    <td>
                      <TruncatedText text={task.title} />
                    </td>
                    <td>{formatCurrency(task.totalAmount, task.currency, language)}</td>
                    <td>
                      <TruncatedText text={task.nodeName} />
                    </td>
                    <td>
                      <span className="approval-arrival-time" title={approvalTaskArrivalTitle(task, messages, language)}>
                        <TruncatedText text={formatApprovalWaitingDuration(task.activatedAt, language) || '-'} />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ListPagination
          currentPage={taskPagination.currentPage}
          messages={messages}
          onPageChange={taskPagination.setPage}
          onPageSizeChange={taskPagination.setPageSize}
          pageSize={taskPagination.pageSize}
          totalItems={taskPagination.totalItems}
          totalPages={taskPagination.totalPages}
        />
      </section>
    </section>

    <Drawer
      className="request-drawer approval-drawer"
      destroyOnClose={false}
      keyboard
      maskClosable
      onClose={handleApprovalDrawerClose}
      open={isDetailDrawerOpen}
      title={messages.approval.detail}
      size={760}
    >
      {!detail ? (
        <div className="empty-state">
          {detailQuery.isLoading ? messages.approval.loading : messages.approval.noDetail}
        </div>
      ) : (
        <div className="approval-detail">
          <div className="detail-heading">
            <div>
              <TruncatedText className="text-strong" text={contextText(detail.contextSnapshot, 'title')} />
              <TruncatedText className="text-small" text={detail.requestId} />
            </div>
            <span className={`tag ${approvalStatusToneOf(detail.status)}`}>
              {formatApprovalStatus(detail.status, messages)}
            </span>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>{messages.approval.requester}</dt>
              <dd>
                <TruncatedText text={userNameOf(detail.requesterId, users)} />
              </dd>
            </div>
            <div>
              <dt>{messages.purchaseRequest.category}</dt>
              <dd>
                <TruncatedText text={categoryNameOf(contextText(detail.contextSnapshot, 'categoryId'), categories)} />
              </dd>
            </div>
            <div>
              <dt>{messages.purchaseRequest.totalAmount}</dt>
              <dd>
                {formatCurrency(
                  contextAmount(detail.contextSnapshot, 'totalAmount'),
                  contextText(detail.contextSnapshot, 'currency') || 'CNY',
                  language,
                )}
              </dd>
            </div>
            <div>
              <dt>{messages.approval.currentApprover}</dt>
              <dd>
                <TruncatedText text={activeNode ? userNameOf(activeNode.approverId, users) : messages.approval.terminal} />
              </dd>
            </div>
            <div>
              <dt>{messages.approval.startedAt}</dt>
              <dd>{formatDateTime(detail.startedAt, language)}</dd>
            </div>
            {activeNode?.activatedAt ? (
              <div>
                <dt>{messages.approval.arrivedAt}</dt>
                <dd>{formatDateTime(activeNode.activatedAt, language)}</dd>
              </div>
            ) : null}
          </dl>

          <section className="approval-context">
            <PanelTitle icon={<ProfileOutlined />} title={messages.approval.requestSummary} />
            <dl className="context-grid">
              <div>
                <dt>{messages.purchaseRequest.department}</dt>
                <dd>
                  <TruncatedText text={summaryDepartmentName} />
                </dd>
              </div>
              <div>
                <dt>{messages.purchaseRequest.budgetAccount}</dt>
                <dd>
                  <TruncatedText text={summaryBudgetAccountName} />
                </dd>
              </div>
              <div>
                <dt>{messages.purchaseRequest.supplier}</dt>
                <dd>
                  <TruncatedText text={summarySupplierText} />
                </dd>
              </div>
              <div>
                <dt>{messages.purchaseRequest.expectedDeliveryDate}</dt>
                <dd>
                  <TruncatedText text={summaryDeliveryDateText} />
                </dd>
              </div>
            </dl>
          </section>

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

          <ApprovalProgress language={language} messages={messages} nodes={detail.nodes} records={detail.timeline} users={users} />

          <div className="approval-actions">
            <label>
              <span>{messages.approval.comment}</span>
              <textarea
                placeholder={messages.approval.commentPlaceholder}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
            <div>
              <DisabledActionTooltip title={approveDisabledReason}>
                <button
                  className="primary-button"
                  disabled={Boolean(approveDisabledReason)}
                  onClick={() => runApprovalAction('approve')}
                  type="button"
                >
                  <CheckCircleOutlined />
                  <span>{messages.approval.approve}</span>
                </button>
              </DisabledActionTooltip>
              <DisabledActionTooltip title={rejectDisabledReason}>
                <button
                  className="line-add-button danger-action"
                  disabled={Boolean(rejectDisabledReason)}
                  onClick={() => runApprovalAction('reject')}
                  type="button"
                >
                  <AlertOutlined />
                  <span>{messages.approval.reject}</span>
                </button>
              </DisabledActionTooltip>
              <DisabledActionTooltip title={withdrawDisabledReason}>
                <button
                  className="line-add-button"
                  disabled={Boolean(withdrawDisabledReason)}
                  onClick={() => runApprovalAction('withdraw')}
                  type="button"
                >
                  <SwapOutlined />
                  <span>{messages.approval.withdraw}</span>
                </button>
              </DisabledActionTooltip>
            </div>
          </div>
          {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
        </div>
      )}
    </Drawer>
    </>
  )
}

function approvalTaskArrivalTitle(task: ApprovalTask, messages: LocalizedMessages, language: Language) {
  return task.activatedAt ? `${messages.approval.arrivedAt}: ${formatDateTime(task.activatedAt, language)}` : undefined
}

function formatApprovalWaitingDuration(activatedAt: string | null, language: Language) {
  if (!activatedAt) {
    return ''
  }

  const elapsedMs = Date.now() - new Date(activatedAt).getTime()
  const safeElapsedMs = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0
  const elapsedMinutes = Math.floor(safeElapsedMs / 60_000)
  const elapsedHours = Math.floor(safeElapsedMs / 3_600_000)
  const elapsedDays = Math.floor(elapsedHours / 24)
  const remainingHours = elapsedHours % 24

  if (language === 'zh') {
    if (elapsedMinutes < 1) {
      return '已等待不足1分钟'
    }
    if (elapsedHours < 1) {
      return `已等待 ${elapsedMinutes}分钟`
    }
    if (elapsedDays < 1) {
      return `已等待 ${elapsedHours}小时`
    }

    return `已等待 ${elapsedDays}天${remainingHours > 0 ? `${remainingHours}小时` : ''}`
  }

  if (elapsedMinutes < 1) {
    return 'Waited under 1 min'
  }
  if (elapsedHours < 1) {
    return `Waited ${elapsedMinutes} min`
  }
  if (elapsedDays < 1) {
    return `Waited ${elapsedHours}h`
  }

  return `Waited ${elapsedDays}d${remainingHours > 0 ? ` ${remainingHours}h` : ''}`
}
