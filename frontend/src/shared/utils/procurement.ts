import { APPLICANT_ROLE_ID, demoUserHasExactRole, demoUserHasRoleCapability } from '../../demoRoleCapabilities'
import type { Language, DemoPersona, UserSummary, CategorySummary, SupplierSummary, BudgetAccountSummary, PurchaseRequestStatus, ApprovalInstanceStatus, ApprovalNodeStatus, ApprovalAction, RfqStatus, PurchaseOrderStatus, PurchaseOrderAction, ApprovalSummary, PurchaseRequestListItem, PurchaseRequestDetail, PurchaseRequestFormState, PurchaseRequestFormLine, RfqQuoteAttachment, RfqListItem, RfqDetail, UploadedAttachment, RfqCreateFormState, RfqQuoteFormState, PurchaseOrderCreateFormState, ReceiptProgressStatus, InvoiceProgressStatus, InvoiceAmountStatus, ThreeWayMatchStatus, ThreeWayMatchSeverity, ThreeWayMatchDifferenceType, ThreeWayMatchActionType, ExceptionHighlight, FulfillmentPurchaseOrder, ReceiptCreateFormState, InvoiceCreateFormState } from '../../domain/types'
import { apiBaseUrl } from '../../api/client'
import type { LocalizedMessages } from '../../i18n/localizedContent'

export function formatOptionalCurrency(value: number | undefined, currency: string | undefined, language: Language) {
  return typeof value === 'number' ? formatCurrency(value, currency ?? 'CNY', language) : undefined
}

export function formatCurrency(value: number, currency: string, language: Language) {
  return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export function formatRiskLevel(riskLevel: string, language: Language) {
  const labels =
    language === 'zh'
      ? { high: '高', low: '低', medium: '中' }
      : { high: 'High', low: 'Low', medium: 'Medium' }

  return labels[riskLevel as keyof typeof labels] ?? riskLevel
}

export function riskToneOf(riskLevel: string) {
  if (riskLevel === 'high') {
    return 'danger'
  }

  return riskLevel === 'medium' ? 'warn' : ''
}

export function formatSupplierStatus(status: string, messages: LocalizedMessages) {
  if (status === 'active') {
    return messages.supplierPool.active
  }
  if (status === 'inactive') {
    return messages.supplierPool.inactive
  }
  return status
}

export function supplierStatusToneOf(status: string) {
  return status === 'inactive' ? 'danger' : 'success'
}

export function formatSupplierSharedScope(sharedScope: string, messages: LocalizedMessages) {
  return sharedScope === 'group-shared' ? messages.supplierPool.groupSharedValue : sharedScope
}

export function createLineKey() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function getViewportCenter() {
  return {
    x: window.scrollX + window.innerWidth / 2,
    y: window.scrollY + window.innerHeight / 2,
  }
}

export function createPurchaseRequestFormLine(
  overrides: Partial<Omit<PurchaseRequestFormLine, 'lineKey'>> = {},
): PurchaseRequestFormLine {
  return {
    estimatedUnitPrice: 0,
    itemName: '',
    lineKey: createLineKey(),
    quantity: 1,
    specification: '',
    unit: '件',
    ...overrides,
  }
}

export function lineAmountOf(line: PurchaseRequestFormLine) {
  const quantity = Number.isFinite(line.quantity) ? line.quantity : 0
  const unitPrice = Number.isFinite(line.estimatedUnitPrice) ? line.estimatedUnitPrice : 0

  return roundAmount(quantity * unitPrice)
}

export function userForDemoPersona(persona: DemoPersona, users: UserSummary[], companyId?: string) {
  const isInScope = (user: UserSummary) => !companyId || user.companyId === companyId
  const hasPersonaRole = (user: UserSummary) =>
    user.roles.some((role) => persona.roleIds.includes(role.roleId))
  const preferredUsers = persona.preferredUserIds
    .map((userId) => users.find((user) => user.userId === userId))
    .filter((user): user is UserSummary => Boolean(user))

  return (
    preferredUsers.find(isInScope) ??
    users.find((user) => isInScope(user) && hasPersonaRole(user)) ??
    preferredUsers[0] ??
    users.find(hasPersonaRole)
  )
}

export function buildPurchaseRequestFormDefaults(
  selectedCompanyId: string,
  users: UserSummary[],
  categories: CategorySummary[],
  budgetAccounts: BudgetAccountSummary[],
  suppliers: SupplierSummary[],
  preferredRequester?: UserSummary,
): PurchaseRequestFormState {
  const requester =
    (preferredRequester?.companyId === selectedCompanyId &&
    demoUserHasRoleCapability(preferredRequester, [APPLICANT_ROLE_ID])
      ? preferredRequester
      : undefined) ??
    users.find((user) => demoUserHasExactRole(user, [APPLICANT_ROLE_ID])) ??
    users.find((user) => user.active) ??
    users[0]
  const defaultCategory = categories[0]
  const budgetAccount =
    budgetAccounts.find((account) => account.categoryId === defaultCategory?.categoryId && account.active) ??
    budgetAccounts.find((account) => account.active) ??
    budgetAccounts[0]
  const categoryId = budgetAccount?.categoryId ?? defaultCategory?.categoryId ?? ''
  const supplierIds = preferredSupplierIdsForCategory(categoryId, suppliers)

  return {
    budgetAccountId: budgetAccount?.budgetAccountId ?? '',
    categoryId,
    companyId: selectedCompanyId,
    departmentId: requester?.departmentId ?? '',
    description: '研发团队扩编使用',
    expectedDeliveryDate: '2026-06-15',
    lineItems: [
      createPurchaseRequestFormLine({
        estimatedUnitPrice: 9300,
        itemName: '商务笔记本电脑',
        quantity: 20,
        specification: '14 英寸 / 32G / 1T SSD',
        unit: '台',
      }),
    ],
    requesterId: requester?.userId ?? '',
    supplierIds,
    title: '20 台笔记本采购',
  }
}

export function formatPurchaseRequestStatus(status: PurchaseRequestStatus, messages: LocalizedMessages) {
  return status === 'SUBMITTED' ? messages.purchaseRequest.submitted : messages.purchaseRequest.draft
}

export function statusToneOf(status: PurchaseRequestStatus) {
  return status === 'SUBMITTED' ? 'success' : 'warn'
}

export function currentStepOf(
  status: PurchaseRequestStatus,
  messages: LocalizedMessages,
  approval?: ApprovalSummary | null,
) {
  if (approval) {
    if (approval.status === 'IN_PROGRESS') {
      return approval.currentNodeName ?? messages.purchaseRequest.waitingApproval
    }

    return formatApprovalStatus(approval.status, messages)
  }

  return status === 'SUBMITTED' ? messages.purchaseRequest.waitingApproval : messages.purchaseRequest.intakeStep
}

export function formatApprovalStatus(status: ApprovalInstanceStatus, messages: LocalizedMessages) {
  const labels = {
    APPROVED: messages.approval.approved,
    IN_PROGRESS: messages.approval.inProgress,
    REJECTED: messages.approval.rejected,
    WITHDRAWN: messages.approval.withdrawn,
  }

  return labels[status] ?? messages.approval.unknown
}

export function approvalStatusToneOf(status: ApprovalInstanceStatus) {
  if (status === 'APPROVED') {
    return 'success'
  }
  if (status === 'REJECTED') {
    return 'danger'
  }
  if (status === 'WITHDRAWN') {
    return 'neutral'
  }
  return 'warn'
}

export function formatApprovalNodeStatus(status: ApprovalNodeStatus, messages: LocalizedMessages) {
  const labels = {
    ACTIVE: messages.approval.active,
    APPROVED: messages.approval.approved,
    CANCELLED: messages.approval.cancelled,
    PENDING: messages.approval.pending,
    REJECTED: messages.approval.rejected,
  }

  return labels[status] ?? messages.approval.unknown
}

export function approvalNodeToneOf(status: ApprovalNodeStatus) {
  if (status === 'APPROVED') {
    return 'success'
  }
  if (status === 'REJECTED') {
    return 'danger'
  }
  if (status === 'ACTIVE') {
    return 'warn'
  }
  return 'neutral'
}

export function formatApprovalAction(action: ApprovalAction, messages: LocalizedMessages) {
  const labels = {
    APPROVED: messages.approval.approvedAction,
    CREATED: messages.approval.created,
    REJECTED: messages.approval.rejectedAction,
    WITHDRAWN: messages.approval.withdrawnAction,
  }

  return labels[action] ?? messages.approval.unknown
}

export function approvalActionToneOf(action: ApprovalAction) {
  if (action === 'APPROVED') {
    return 'success'
  }
  if (action === 'REJECTED') {
    return 'danger'
  }
  if (action === 'WITHDRAWN') {
    return 'neutral'
  }
  return 'warn'
}

export function contextText(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key]
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

export function contextAmount(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key]
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function categoryNameOf(categoryId: string, categories: CategorySummary[]) {
  return categories.find((category) => category.categoryId === categoryId)?.categoryName ?? categoryId
}

export function budgetNameOf(budgetAccountId: string, budgetAccounts: BudgetAccountSummary[]) {
  return budgetAccounts.find((account) => account.budgetAccountId === budgetAccountId)?.accountName ?? budgetAccountId
}

export function userNameOf(userId: string, users: UserSummary[]) {
  return users.find((user) => user.userId === userId)?.displayName ?? userId
}

export function supplierNameOf(supplierId: string | null, suppliers: SupplierSummary[], messages: LocalizedMessages) {
  if (!supplierId) {
    return messages.purchaseRequest.noSupplier
  }

  return suppliers.find((supplier) => supplier.supplierId === supplierId)?.supplierName ?? supplierId
}

export function supplierNamesText(supplierIds: string[], suppliers: SupplierSummary[], messages: LocalizedMessages) {
  if (supplierIds.length === 0) {
    return messages.purchaseRequest.noSupplier
  }

  return supplierIds.map((supplierId) => supplierNameOf(supplierId, suppliers, messages)).join(' / ')
}

export function supplierIdsFromSnapshot(snapshot?: Record<string, unknown>) {
  const value = snapshot?.supplierIds
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function supplierNamesOf(
  request: Pick<PurchaseRequestDetail, 'fieldSnapshot' | 'supplierId' | 'supplierIds'>,
  suppliers: SupplierSummary[],
  messages: LocalizedMessages,
) {
  const supplierIds = request.supplierIds?.length
    ? request.supplierIds
    : supplierIdsFromSnapshot(request.fieldSnapshot).length > 0
      ? supplierIdsFromSnapshot(request.fieldSnapshot)
      : request.supplierId
        ? [request.supplierId]
        : []

  return supplierNamesText(supplierIds, suppliers, messages)
}

export function contextSupplierText(
  snapshot: Record<string, unknown>,
  suppliers: SupplierSummary[],
  messages: LocalizedMessages,
) {
  const supplierIds = supplierIdsFromSnapshot(snapshot)
  if (supplierIds.length > 0) {
    return supplierNamesText(supplierIds, suppliers, messages)
  }

  const supplierId = contextText(snapshot, 'supplierId')
  return supplierId ? supplierNamesText([supplierId], suppliers, messages) : messages.purchaseRequest.noSupplier
}

export function preferredSupplierForCategory(categoryId: string, suppliers: SupplierSummary[], currentSupplierId?: string) {
  const supportsCategory = (supplier: SupplierSummary) =>
    supplier.categories.some((category) => category.categoryId === categoryId)
  const currentSupplier = suppliers.find((supplier) => supplier.supplierId === currentSupplierId && supportsCategory(supplier))
  if (currentSupplier) {
    return currentSupplier
  }

  if (categoryId === 'category-it-hardware') {
    return suppliers.find((supplier) => supplier.supplierId === 'supplier-bluechip' && supportsCategory(supplier))
  }

  return suppliers.find(supportsCategory)
}

export function preferredSupplierIdsForCategory(
  categoryId: string,
  suppliers: SupplierSummary[],
  currentSupplierIds: string[] = [],
) {
  const validCurrentSupplierIds = currentSupplierIds.filter((supplierId) =>
    suppliers.some((supplier) =>
      supplier.supplierId === supplierId &&
      supplier.categories.some((category) => category.categoryId === categoryId),
    ),
  )
  if (validCurrentSupplierIds.length > 0) {
    return validCurrentSupplierIds
  }

  const preferredSupplier = preferredSupplierForCategory(categoryId, suppliers)
  return preferredSupplier ? [preferredSupplier.supplierId] : []
}

export function suppliersForCategory(categoryId: string, suppliers: SupplierSummary[]) {
  return suppliers.filter((supplier) => supplier.categories.some((category) => category.categoryId === categoryId))
}

export function uploadedFromRfqAttachment(attachment: RfqQuoteAttachment): UploadedAttachment {
  return {
    attachmentId: attachment.attachmentId,
    contentType: attachment.contentType ?? 'application/octet-stream',
    description: attachment.description,
    downloadable: Boolean(attachment.downloadable),
    downloadDisabledReason: attachment.downloadDisabledReason ?? null,
    downloadUrl: attachment.downloadUrl ?? null,
    originalFileName: attachment.fileName,
    sizeBytes: attachment.sizeBytes ?? 0,
    storageStatus: attachment.storageStatus ?? (attachment.downloadable ? 'READY' : 'METADATA_ONLY'),
  }
}

export function attachmentDownloadUrl(attachment: {
  attachmentId: string
  downloadable?: boolean | null
  downloadUrl?: string | null
}) {
  if (attachment.downloadUrl) {
    return attachment.downloadUrl.startsWith('http') ? attachment.downloadUrl : `${apiBaseUrl}${attachment.downloadUrl}`
  }
  return attachment.downloadable ? `${apiBaseUrl}/api/attachments/${encodeURIComponent(attachment.attachmentId)}/download` : null
}

export function openAttachmentDownload(attachment: {
  attachmentId: string
  downloadable?: boolean | null
  downloadUrl?: string | null
}) {
  const url = attachmentDownloadUrl(attachment)
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export function buildRfqCreateFormDefaults(
  selectedCompanyId: string,
  approvedRequests: PurchaseRequestListItem[],
  suppliers: SupplierSummary[],
  buyers: UserSummary[],
  preferredBuyer?: UserSummary,
): RfqCreateFormState {
  const request = approvedRequests.find((item) => item.companyId === selectedCompanyId) ?? approvedRequests[0]
  const candidateSuppliers = suppliersForCategory(request?.categoryId ?? '', suppliers)
  const buyer =
    (preferredBuyer?.companyId === selectedCompanyId ? preferredBuyer : undefined) ??
    buyers.find((user) => user.companyId === selectedCompanyId) ??
    buyers[0]

  return {
    procurementUserId: buyer?.userId ?? '',
    requestId: request?.requestId ?? '',
    supplierIds: candidateSuppliers.slice(0, 3).map((supplier) => supplier.supplierId),
    title: request ? defaultRfqTitle(request.title) : '',
  }
}

export function defaultRfqTitle(requestTitle: string): string {
  const normalizedTitle = requestTitle.trim()
  return normalizedTitle.endsWith('询价') ? normalizedTitle : `${normalizedTitle}询价`
}

export function buildRfqQuoteFormDefaults(detail?: RfqDetail, preferredSupplierId?: string): RfqQuoteFormState {
  const supplier =
    detail?.suppliers.find((item) => item.supplierId === preferredSupplierId) ??
    detail?.suppliers[0]
  const quote = detail?.quotes.find((item) => item.supplierId === supplier?.supplierId)
  const attachment = quote?.attachments[0]

  return {
    deliveryDate: quote?.deliveryDate ?? nextDate(14),
    fileDescription: attachment?.description ?? '',
    fileName: attachment?.fileName ?? '',
    file: null,
    quoteAmount: quote?.quoteAmount ?? 0,
    riskNote: quote?.riskNote ?? '',
    supplierId: supplier?.supplierId ?? '',
    supplierScore: quote?.supplierScore ?? 85,
    taxRate: quote?.taxRate ?? 0.13,
    uploadedAttachments: quote?.attachments.filter((item) => Boolean(item.downloadable)).map(uploadedFromRfqAttachment) ?? [],
  }
}

export function buildPurchaseOrderCreateFormDefaults(
  selectedCompanyId: string,
  eligibleRfqs: RfqListItem[],
  buyers: UserSummary[],
  preferredBuyer?: UserSummary,
): PurchaseOrderCreateFormState {
  const rfq = eligibleRfqs.find((item) => item.companyId === selectedCompanyId) ?? eligibleRfqs[0]
  const buyer =
    (preferredBuyer?.companyId === selectedCompanyId ? preferredBuyer : undefined) ??
    buyers.find((user) => user.companyId === selectedCompanyId) ??
    buyers[0]

  return {
    contactPerson: buyer?.displayName ?? '',
    contactPhone: '138-0000-0000',
    deliveryLocation: selectedCompanyId === 'company-manufacturing' ? '星河智能制造华东仓' : '星河数字科技研发中心',
    deliveryNote: '',
    plannedDeliveryDate: rfq?.expectedDeliveryDate ?? nextDate(14),
    procurementUserId: buyer?.userId ?? '',
    quoteId: '',
    rfqId: rfq?.rfqId ?? '',
  }
}

export function buildReceiptCreateFormDefaults(
  fulfillmentRows: FulfillmentPurchaseOrder[],
  users: UserSummary[],
  selectedCompanyId: string,
  preferredPoId?: string,
  preferredReceiver?: UserSummary,
): ReceiptCreateFormState {
  const po =
    fulfillmentRows.find((row) => row.poId === preferredPoId) ??
    fulfillmentRows.find((row) => row.receiptSummary !== 'FULLY_RECEIVED') ??
    fulfillmentRows[0]
  const receiver =
    (preferredReceiver?.companyId === selectedCompanyId ? preferredReceiver : undefined) ??
    users.find((user) => user.companyId === selectedCompanyId) ??
    users[0]

  return {
    fileDescription: '',
    file: null,
    fileName: '',
    lines: po?.lines.map((line) => ({
      note: '',
      poLineId: line.poLineId,
      receivedQuantity: Math.max(0, roundAmount(line.orderedQuantity - line.receivedQuantity)),
    })) ?? [],
    note: '',
    poId: po?.poId ?? '',
    receivedBy: receiver?.userId ?? '',
    receivedDate: nextDate(0),
    uploadedAttachments: [],
  }
}

export function buildInvoiceCreateFormDefaults(
  fulfillmentRows: FulfillmentPurchaseOrder[],
  users: UserSummary[],
  selectedCompanyId: string,
  preferredPoId?: string,
  preferredRegisteredUser?: UserSummary,
): InvoiceCreateFormState {
  const po =
    fulfillmentRows.find((row) => row.poId === preferredPoId) ??
    fulfillmentRows.find((row) => row.invoiceSummary !== 'FULLY_INVOICED') ??
    fulfillmentRows[0]
  const registeredUser =
    (preferredRegisteredUser?.companyId === selectedCompanyId ? preferredRegisteredUser : undefined) ??
    users.find((user) => user.companyId === selectedCompanyId) ??
    users[0]

  return {
    fileDescription: '',
    file: null,
    fileName: '',
    invoiceDate: nextDate(0),
    invoiceNumber: po ? `FP-${po.poId.replace('PO-', '')}` : '',
    lines: po?.lines.map((line) => {
      const remainingQuantity = Math.max(0, roundAmount(line.orderedQuantity - line.invoicedQuantity))
      const ratio = line.orderedQuantity > 0 ? remainingQuantity / line.orderedQuantity : 0
      const totalAmount = roundAmount(line.confirmedAmount * ratio)
      const untaxedAmount = roundAmount(totalAmount / 1.13)
      const taxAmount = roundAmount(totalAmount - untaxedAmount)
      return {
        invoicedQuantity: remainingQuantity,
        poLineId: line.poLineId,
        taxAmount,
        taxRate: 0.13,
        totalAmount,
        untaxedAmount,
      }
    }) ?? [],
    note: '',
    poId: po?.poId ?? '',
    registeredBy: registeredUser?.userId ?? '',
    uploadedAttachments: [],
  }
}

export function nextDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function formatRfqStatus(status: RfqStatus, messages: LocalizedMessages) {
  const labels = {
    COMPARISON_READY: messages.rfq.comparisonReady,
    ISSUED: messages.rfq.issued,
    QUOTING: messages.rfq.quoting,
  }

  return labels[status] ?? status
}

export function rfqStatusToneOf(status: RfqStatus) {
  if (status === 'COMPARISON_READY') {
    return 'success'
  }
  if (status === 'QUOTING') {
    return 'warn'
  }
  return 'neutral'
}

export function formatPurchaseOrderStatus(status: PurchaseOrderStatus, messages: LocalizedMessages) {
  const labels = {
    CANCELLED: messages.purchaseOrder.cancelled,
    DRAFT: messages.purchaseOrder.draft,
    ISSUED: messages.purchaseOrder.issued,
  }

  return labels[status] ?? status
}

export function purchaseOrderStatusToneOf(status: PurchaseOrderStatus) {
  if (status === 'ISSUED') {
    return 'success'
  }
  if (status === 'CANCELLED') {
    return 'danger'
  }
  return 'neutral'
}

export function formatPurchaseOrderAction(action: PurchaseOrderAction, messages: LocalizedMessages) {
  const labels = {
    CANCELLED: messages.purchaseOrder.cancelledAction,
    CREATED: messages.purchaseOrder.createdAction,
    PUBLISHED: messages.purchaseOrder.publishedAction,
  }

  return labels[action] ?? action
}

export function formatReceiptProgress(status: ReceiptProgressStatus, messages: LocalizedMessages) {
  const labels = {
    FULLY_RECEIVED: messages.receiptInvoice.fullyReceived,
    NOT_RECEIVED: messages.receiptInvoice.notReceived,
    PARTIALLY_RECEIVED: messages.receiptInvoice.partiallyReceived,
  }

  return labels[status] ?? status
}

export function receiptProgressToneOf(status: ReceiptProgressStatus) {
  if (status === 'FULLY_RECEIVED') {
    return 'success'
  }
  if (status === 'PARTIALLY_RECEIVED') {
    return 'warn'
  }
  return 'neutral'
}

export function formatInvoiceProgress(status: InvoiceProgressStatus, messages: LocalizedMessages) {
  const labels = {
    FULLY_INVOICED: messages.receiptInvoice.fullyInvoiced,
    NOT_INVOICED: messages.receiptInvoice.notInvoiced,
    PARTIALLY_INVOICED: messages.receiptInvoice.partiallyInvoiced,
  }

  return labels[status] ?? status
}

export function invoiceProgressToneOf(status: InvoiceProgressStatus) {
  if (status === 'FULLY_INVOICED') {
    return 'success'
  }
  if (status === 'PARTIALLY_INVOICED') {
    return 'warn'
  }
  return 'neutral'
}

export function formatInvoiceAmountStatus(status: InvoiceAmountStatus, messages: LocalizedMessages) {
  const labels = {
    MATCHED: messages.receiptInvoice.matched,
    NOT_INVOICED: messages.receiptInvoice.notInvoiced,
    VARIANCE: messages.receiptInvoice.amountVariance,
  }

  return labels[status] ?? status
}

export function invoiceAmountToneOf(status: InvoiceAmountStatus) {
  if (status === 'VARIANCE') {
    return 'danger'
  }
  if (status === 'MATCHED') {
    return 'success'
  }
  return 'neutral'
}

export function formatMatchStatus(status: ThreeWayMatchStatus, messages: LocalizedMessages) {
  const labels = {
    EXCEPTION: messages.matching.exception,
    MATCHED: messages.matching.matched,
    PENDING_INPUT: messages.matching.pendingInput,
    RESOLVED: messages.matching.resolved,
  }

  return labels[status] ?? status
}

export function matchStatusToneOf(status: ThreeWayMatchStatus) {
  if (status === 'MATCHED') {
    return 'success'
  }
  if (status === 'EXCEPTION') {
    return 'danger'
  }
  if (status === 'PENDING_INPUT') {
    return 'warn'
  }
  return 'neutral'
}

export function formatMatchSeverity(severity: ThreeWayMatchSeverity, messages: LocalizedMessages) {
  const labels = {
    HIGH: messages.matching.high,
    LOW: messages.matching.low,
    MEDIUM: messages.matching.medium,
  }

  return labels[severity] ?? severity
}

export function severityToneOf(severity: ThreeWayMatchSeverity) {
  if (severity === 'HIGH') {
    return 'danger'
  }
  if (severity === 'MEDIUM') {
    return 'warn'
  }
  return 'neutral'
}

export function formatDifferenceType(type: ThreeWayMatchDifferenceType, messages: LocalizedMessages) {
  const labels = {
    INVOICE_AMOUNT_MISMATCH: messages.matching.amountMismatch,
    INVOICE_QUANTITY_OVER_RECEIPT: messages.matching.invoiceOverReceipt,
    MISSING_INVOICE: messages.matching.missingInvoice,
    MISSING_RECEIPT: messages.matching.missingReceipt,
    RECEIPT_QUANTITY_SHORT: messages.matching.receiptShort,
  }

  return labels[type] ?? type
}

export function formatDashboardExceptionReason(exception: ExceptionHighlight, messages: LocalizedMessages) {
  if (!exception.primaryDifferenceType) {
    return messages.dashboard.empty
  }

  const typeLabel = formatDifferenceType(exception.primaryDifferenceType, messages)
  return exception.primaryDifferenceDescription
    ? `${typeLabel} · ${exception.primaryDifferenceDescription}`
    : typeLabel
}

export function hasAmountVariance(amount: number) {
  return Math.abs(amount) > 0.005
}

export function formatMatchAction(action: ThreeWayMatchActionType, messages: LocalizedMessages) {
  const labels = {
    ACKNOWLEDGE: messages.matching.acknowledge,
    MARK_IN_PROGRESS: messages.matching.markInProgress,
    REOPEN: messages.matching.reopen,
    RESOLVE: messages.matching.resolve,
  }

  return labels[action] ?? action
}

export function formatDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

export function roundAmount(value: number) {
  return Math.round(value * 100) / 100
}
