export const DEFAULT_LIST_PAGE_SIZE = 10
export const LIST_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
export const ALL_APPROVERS_VALUE = '__all_approvers__'

export type Language = 'zh' | 'en'

export type DemoPersonaKey = 'applicant' | 'approver' | 'procurement' | 'warehouse' | 'finance' | 'admin'

export type DemoPersona = {
  allowedPaths: string[]
  defaultPath: string
  key: DemoPersonaKey
  preferredUserIds: string[]
  roleIds: string[]
}

export const businessNavPaths = [
  '/',
  '/purchase-requests',
  '/approvals',
  '/rfqs',
  '/purchase-orders',
  '/receipts-invoices',
  '/three-way-matching',
  '/suppliers',
]

export const demoPersonaMenuOrder: DemoPersonaKey[] = ['admin', 'applicant', 'approver', 'procurement', 'warehouse', 'finance']

export const demoPersonas: DemoPersona[] = [
  {
    allowedPaths: ['/purchase-requests', '/suppliers'],
    defaultPath: '/purchase-requests',
    key: 'applicant',
    preferredUserIds: ['user-digital-applicant', 'user-mfg-applicant'],
    roleIds: ['role-applicant'],
  },
  {
    allowedPaths: ['/approvals', '/purchase-requests'],
    defaultPath: '/approvals',
    key: 'approver',
    preferredUserIds: ['user-digital-approver', 'user-mfg-approver'],
    roleIds: ['role-approver'],
  },
  {
    allowedPaths: ['/', '/purchase-requests', '/rfqs', '/purchase-orders', '/suppliers'],
    defaultPath: '/rfqs',
    key: 'procurement',
    preferredUserIds: ['user-digital-buyer', 'user-mfg-buyer'],
    roleIds: ['role-procurement'],
  },
  {
    allowedPaths: ['/receipts-invoices', '/purchase-orders'],
    defaultPath: '/receipts-invoices',
    key: 'warehouse',
    preferredUserIds: ['user-mfg-warehouse'],
    roleIds: ['role-warehouse'],
  },
  {
    allowedPaths: ['/', '/approvals', '/receipts-invoices', '/three-way-matching', '/purchase-orders'],
    defaultPath: '/three-way-matching',
    key: 'finance',
    preferredUserIds: ['user-digital-finance', 'user-mfg-finance'],
    roleIds: ['role-finance'],
  },
  {
    allowedPaths: businessNavPaths,
    defaultPath: '/master-data',
    key: 'admin',
    preferredUserIds: ['user-digital-admin'],
    roleIds: ['role-admin'],
  },
]

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  timestamp: string
}

export type HealthEnvelope = ApiEnvelope<{
  status: string
  application: string
  checkedAt: string
  demoContext: DemoContext
}>

export type DemoDataResetResult = {
  startedAt: string
  completedAt: string
  migrationsExecuted: number
  schemaVersion: string
}

export type DemoContext = {
  groupId: string
  groupName: string
  activeCompany: CompanyContext
  companies: CompanyContext[]
  supplierPoolScope: string
  dataBoundary: {
    groupShared: string
    companyIsolated: string
  }
}

export type CompanyContext = {
  companyId: string
  companyName: string
  businessScope: string
  active: boolean
}

export type DepartmentSummary = {
  departmentId: string
  companyId: string
  departmentName: string
  functionScope: string
}

export type RoleSummary = {
  roleId: string
  roleName: string
  roleType: string
}

export type UserSummary = {
  userId: string
  companyId: string
  departmentId: string
  departmentName: string
  displayName: string
  email: string
  positionTitle: string
  active: boolean
  roles: RoleSummary[]
}

export type CategorySummary = {
  categoryId: string
  categoryName: string
  businessScope: string
  groupLevel: boolean
}

export type SupplierSummary = {
  supplierId: string
  supplierName: string
  serviceScope: string
  location: string
  status: string
  riskLevel: string
  sharedScope: string
  categories: CategorySummary[]
}

export type BudgetAccountSummary = {
  budgetAccountId: string
  companyId: string
  accountName: string
  categoryId: string
  categoryName: string
  annualBudgetAmount: number
  availableAmount: number
  currency: string
  active: boolean
}

export type PurchaseRequestStatus = 'DRAFT' | 'SUBMITTED'
export type PurchaseRequestDrawerMode = 'create' | 'detail'
export type ApprovalInstanceStatus = 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
export type ApprovalNodeStatus = 'PENDING' | 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type ApprovalAction = 'CREATED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
export type RfqStatus = 'ISSUED' | 'QUOTING' | 'COMPARISON_READY'
export type PurchaseOrderStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED'
export type PurchaseOrderAction = 'CREATED' | 'PUBLISHED' | 'CANCELLED'

export type ApprovalRecord = {
  recordId: string
  nodeId: string | null
  actorId: string
  action: ApprovalAction
  comment: string | null
  createdAt: string
}

export type ApprovalSummary = {
  approvalId: string
  status: ApprovalInstanceStatus
  currentNodeId: string | null
  currentStepOrder: number | null
  currentNodeName: string | null
  currentApproverId: string | null
  matchedRuleId: string
  timeline: ApprovalRecord[]
}

export type ApprovalTask = {
  approvalId: string
  nodeId: string
  requestId: string
  companyId: string
  requesterId: string
  title: string
  totalAmount: number
  currency: string
  nodeName: string
  approverId: string
  activatedAt: string | null
}

export type ApprovalNode = {
  nodeId: string
  stepOrder: number
  nodeName: string
  approverId: string
  status: ApprovalNodeStatus
  activatedAt: string | null
  completedAt: string | null
}

export type ApprovalDetail = {
  approvalId: string
  requestId: string
  companyId: string
  requesterId: string
  matchedRuleId: string
  status: ApprovalInstanceStatus
  currentStepOrder: number | null
  startedAt: string
  completedAt: string | null
  contextSnapshot: Record<string, unknown>
  nodes: ApprovalNode[]
  timeline: ApprovalRecord[]
}

export type ApprovalActionPayload = {
  actorId: string
  comment?: string
}

export type PurchaseRequestLine = {
  lineNo: number
  itemName: string
  specification: string | null
  quantity: number
  unit: string
  estimatedUnitPrice: number
  estimatedAmount: number
  categoryId: string
}

export type PurchaseRequestListItem = {
  requestId: string
  companyId: string
  requesterId: string
  departmentId: string
  categoryId: string
  budgetAccountId: string
  supplierId: string | null
  supplierIds?: string[]
  title: string
  status: PurchaseRequestStatus
  totalAmount: number
  currency: string
  expectedDeliveryDate: string
  submittedAt: string | null
  createdAt: string
  lineCount: number
  approval: ApprovalSummary | null
}

export type PurchaseRequestDetail = PurchaseRequestListItem & {
  description: string | null
  updatedAt: string
  fieldSnapshot: Record<string, unknown>
  lineItems: PurchaseRequestLine[]
}

export type CreatePurchaseRequestDraftPayload = {
  companyId: string
  requesterId: string
  departmentId: string
  categoryId: string
  budgetAccountId: string
  supplierId?: string
  supplierIds?: string[]
  title: string
  description?: string
  totalAmount: number
  currency: string
  expectedDeliveryDate: string
  lineItems: Array<{
    itemName: string
    specification?: string
    quantity: number
    unit: string
    estimatedUnitPrice: number
    estimatedAmount: number
  }>
}

export type PurchaseRequestFormState = {
  companyId: string
  requesterId: string
  departmentId: string
  categoryId: string
  budgetAccountId: string
  supplierIds: string[]
  title: string
  description: string
  expectedDeliveryDate: string
  lineItems: PurchaseRequestFormLine[]
}

export type PurchaseRequestFormLine = {
  lineKey: string
  itemName: string
  specification: string
  quantity: number | ''
  unit: string
  estimatedUnitPrice: number | ''
}

export type RfqSupplier = {
  supplierId: string
  supplierName: string
  serviceScope: string
  location: string
  riskLevel: string
  sharedScope: string
  status: 'INVITED'
  categoryCoverage: string[]
  createdAt: string
}

export type RfqQuoteAttachment = {
  attachmentId: string
  fileName: string
  description: string | null
  contentType: string | null
  sizeBytes: number | null
  storageObjectKey: string | null
  storageStatus?: string | null
  downloadable?: boolean | null
  downloadUrl?: string | null
  downloadDisabledReason?: string | null
  createdAt: string
}

export type RfqQuote = {
  quoteId: string
  rfqId: string
  supplierId: string
  quoteAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  deliveryDate: string
  supplierScore: number
  riskNote: string | null
  attachments: RfqQuoteAttachment[]
  createdAt: string
  updatedAt: string
}

export type RfqListItem = {
  rfqId: string
  companyId: string
  requestId: string
  approvalId: string
  title: string
  status: RfqStatus
  requestTotalAmount: number
  currency: string
  expectedDeliveryDate: string
  requesterId: string
  procurementUserId: string
  categoryId: string
  supplierCount: number
  quoteCount: number
  createdAt: string
  updatedAt: string
}

export type RfqDetail = RfqListItem & {
  budgetAccountId: string
  requestSnapshot: Record<string, unknown>
  suppliers: RfqSupplier[]
  quotes: RfqQuote[]
}

export type RfqComparisonRow = {
  rank: number
  recommendationScore: number
  supplierId: string
  supplierName: string
  serviceScope: string
  riskLevel: string
  quoteAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  deliveryDate: string
  supplierScore: number
  riskNote: string | null
  attachments: RfqQuoteAttachment[]
}

export type CreateRfqPayload = {
  companyId: string
  requestId: string
  procurementUserId: string
  title?: string
  supplierIds: string[]
}

export type UpsertRfqQuotePayload = {
  companyId: string
  procurementUserId: string
  quoteAmount: number
  taxRate: number
  deliveryDate: string
  supplierScore: number
  riskNote?: string
  attachments?: Array<{
    fileName: string
    description?: string
    contentType?: string
    sizeBytes?: number
  }>
  attachmentIds?: string[]
}

export type UploadedAttachment = {
  attachmentId: string
  originalFileName: string
  description: string | null
  contentType: string
  sizeBytes: number
  storageStatus: string
  downloadable: boolean
  downloadUrl: string | null
  downloadDisabledReason: string | null
}

export type RfqCreateFormState = {
  procurementUserId: string
  requestId: string
  supplierIds: string[]
  title: string
}

export type RfqQuoteFormState = {
  supplierId: string
  quoteAmount: number
  taxRate: number
  deliveryDate: string
  supplierScore: number
  riskNote: string
  fileName: string
  fileDescription: string
  file: File | null
  uploadedAttachments: UploadedAttachment[]
}

export type PurchaseOrderLine = {
  lineId: string
  lineNo: number
  itemName: string
  specification: string | null
  quantity: number
  unit: string
  categoryId: string | null
  estimatedUnitPrice: number
  estimatedAmount: number
  confirmedUnitPrice: number
  confirmedAmount: number
}

export type PurchaseOrderDeliverySchedule = {
  scheduleId: string
  plannedDeliveryDate: string
  deliveryLocation: string
  contactPerson: string
  contactPhone: string
  deliveryNote: string | null
  createdAt: string
  updatedAt: string
}

export type PurchaseOrderStatusRecord = {
  recordId: string
  actorId: string
  action: PurchaseOrderAction
  fromStatus: PurchaseOrderStatus | null
  toStatus: PurchaseOrderStatus
  comment: string | null
  createdAt: string
}

export type PurchaseOrderListItem = {
  poId: string
  companyId: string
  rfqId: string
  quoteId: string
  requestId: string
  approvalId: string
  title: string
  status: PurchaseOrderStatus
  supplierId: string
  supplierName: string
  procurementUserId: string
  categoryId: string
  quoteAmount: number
  taxAmount: number
  totalAmount: number
  currency: string
  expectedDeliveryDate: string
  plannedDeliveryDate: string
  createdAt: string
  updatedAt: string
  issuedAt: string | null
  cancelledAt: string | null
}

export type PurchaseOrderDetail = PurchaseOrderListItem & {
  requesterId: string
  supplierServiceScope: string
  supplierRiskLevel: string
  budgetAccountId: string
  taxRate: number
  quoteDeliveryDate: string
  quoteUpdatedAt: string
  upstreamSnapshot: Record<string, unknown>
  lines: PurchaseOrderLine[]
  deliverySchedule: PurchaseOrderDeliverySchedule
  statusRecords: PurchaseOrderStatusRecord[]
}

export type CreatePurchaseOrderPayload = {
  companyId: string
  rfqId: string
  quoteId: string
  procurementUserId: string
  plannedDeliveryDate: string
  deliveryLocation: string
  contactPerson: string
  contactPhone: string
  deliveryNote?: string
}

export type PurchaseOrderActionPayload = {
  companyId: string
  actorId: string
  comment?: string
}

export type CancelPurchaseOrderPayload = {
  companyId: string
  actorId: string
  reason: string
}

export type PurchaseOrderCreateFormState = {
  rfqId: string
  quoteId: string
  procurementUserId: string
  plannedDeliveryDate: string
  deliveryLocation: string
  contactPerson: string
  contactPhone: string
  deliveryNote: string
}

export type ReceiptProgressStatus = 'NOT_RECEIVED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED'
export type InvoiceProgressStatus = 'NOT_INVOICED' | 'PARTIALLY_INVOICED' | 'FULLY_INVOICED'
export type InvoiceAmountStatus = 'NOT_INVOICED' | 'MATCHED' | 'VARIANCE'
export type PurchaseReceiptStatus = 'RECORDED'
export type SupplierInvoiceStatus = 'RECORDED'
export type ReceiptInvoiceCreateMode = 'receipt' | 'invoice'
export type ThreeWayMatchStatus = 'PENDING_INPUT' | 'MATCHED' | 'EXCEPTION' | 'RESOLVED'
export type ThreeWayMatchSeverity = 'LOW' | 'MEDIUM' | 'HIGH'
export type ThreeWayMatchDifferenceType =
  | 'MISSING_RECEIPT'
  | 'MISSING_INVOICE'
  | 'RECEIPT_QUANTITY_SHORT'
  | 'INVOICE_QUANTITY_OVER_RECEIPT'
  | 'INVOICE_AMOUNT_MISMATCH'
export type ThreeWayMatchActionType = 'ACKNOWLEDGE' | 'MARK_IN_PROGRESS' | 'RESOLVE' | 'REOPEN'
export type ThreeWayMatchTab = 'all' | 'exceptions' | 'resolved'
export type ProcurementDashboardScope = 'GROUP' | 'COMPANY'
export type ProcurementDashboardScopeValue = 'GROUP' | string

export type DashboardMetric = {
  key: string
  label: string
  value: number
  currency: string | null
  generatedAt: string
}

export type SpendTrendPoint = {
  period: string
  amount: number
  currency: string
  documentCount: number
}

export type DocumentFunnelStage = {
  key: string
  label: string
  count: number
}

export type StatusDistributionBucket = {
  documentType: string
  documentLabel: string
  status: string
  label: string
  count: number
}

export type SupplierDistributionItem = {
  supplierId: string
  supplierName: string
  issuedPoAmount: number
  currency: string
  issuedPoCount: number
  quoteCount: number
}

export type ExceptionHighlight = {
  matchId: string
  companyId: string
  companyName: string
  poId: string
  poTitle: string
  supplierId: string
  supplierName: string
  severity: ThreeWayMatchSeverity | null
  differenceCount: number
  primaryDifferenceType: ThreeWayMatchDifferenceType | null
  primaryDifferenceDescription: string | null
  invoiceVarianceAmount: number
  currency: string
  lastCalculatedAt: string
}

export type ProcurementDashboard = {
  scope: ProcurementDashboardScope
  groupId: string
  groupName: string
  companyId: string | null
  companyName: string | null
  companyIds: string[]
  generatedAt: string
  summary: DashboardMetric[]
  spendTrend: SpendTrendPoint[]
  documentFunnel: DocumentFunnelStage[]
  statusDistributions: StatusDistributionBucket[]
  supplierDistribution: SupplierDistributionItem[]
  exceptionHighlights: ExceptionHighlight[]
}

export type GlobalSearchResultType =
  | 'PURCHASE_REQUEST'
  | 'APPROVAL'
  | 'RFQ'
  | 'PURCHASE_ORDER'
  | 'RECEIPT'
  | 'INVOICE'
  | 'THREE_WAY_MATCH'
  | 'SUPPLIER'
  | 'MASTER_DATA'

export type GlobalSearchResult = {
  type: GlobalSearchResultType
  id: string
  title: string
  subtitle: string | null
  status: string | null
  companyId: string | null
  companyName: string | null
  supplierName: string | null
  amount: number | null
  currency: string | null
  ownershipScope: 'COMPANY' | 'GROUP_SHARED' | string
  matchedFields: string[]
  targetPath: string
  targetParams: Record<string, string>
  occurredAt: string | null
}

export type GlobalSearchGroup = {
  type: GlobalSearchResultType
  label: string
  results: GlobalSearchResult[]
}

export type GlobalSearchResponse = {
  query: string
  companyId: string
  companyName: string
  generatedAt: string
  groups: GlobalSearchGroup[]
}

export type ReceiptInvoiceAttachment = {
  attachmentId: string
  fileName: string
  description: string | null
  contentType: string
  sizeBytes: number
  storageObjectKey: string | null
  storageStatus?: string | null
  downloadable?: boolean | null
  downloadUrl?: string | null
  downloadDisabledReason?: string | null
  createdAt: string
}

export type FulfillmentLine = {
  poLineId: string
  lineNo: number
  itemName: string
  specification: string | null
  orderedQuantity: number
  receivedQuantity: number
  invoicedQuantity: number
  unit: string
  confirmedAmount: number
}

export type FulfillmentPurchaseOrder = {
  poId: string
  companyId: string
  title: string
  supplierId: string
  supplierName: string
  poTotalAmount: number
  currency: string
  expectedDeliveryDate: string
  orderedQuantity: number
  receivedQuantity: number
  invoicedQuantity: number
  invoiceTotalAmount: number
  invoiceAmountVariance: number
  receiptSummary: ReceiptProgressStatus
  invoiceSummary: InvoiceProgressStatus
  invoiceAmountStatus: InvoiceAmountStatus
  attachmentCount: number
  lines: FulfillmentLine[]
  issuedAt: string | null
  updatedAt: string
}

export type ReceiptListItem = {
  receiptId: string
  companyId: string
  poId: string
  supplierId: string
  supplierName: string
  receivedBy: string
  receivedDate: string
  status: PurchaseReceiptStatus
  receivedQuantity: number
  lineCount: number
  attachmentCount: number
  attachments: ReceiptInvoiceAttachment[]
  createdAt: string
  updatedAt: string
}

export type InvoiceListItem = {
  invoiceId: string
  companyId: string
  poId: string
  supplierId: string
  supplierName: string
  invoiceNumber: string
  invoiceDate: string
  registeredBy: string
  status: SupplierInvoiceStatus
  untaxedAmount: number
  taxAmount: number
  totalAmount: number
  currency: string
  lineCount: number
  attachmentCount: number
  attachments: ReceiptInvoiceAttachment[]
  createdAt: string
  updatedAt: string
}

export type CreateReceiptPayload = {
  companyId: string
  poId: string
  receivedBy: string
  receivedDate: string
  note?: string
  lines: Array<{
    poLineId: string
    receivedQuantity: number
    note?: string
  }>
  attachments?: Array<{
    fileName: string
    description?: string
    contentType: string
    sizeBytes: number
  }>
  attachmentIds?: string[]
}

export type CreateInvoicePayload = {
  companyId: string
  poId: string
  invoiceNumber: string
  invoiceDate: string
  registeredBy: string
  note?: string
  lines: Array<{
    poLineId: string
    invoicedQuantity: number
    untaxedAmount: number
    taxRate: number
    taxAmount: number
    totalAmount: number
  }>
  attachments?: Array<{
    fileName: string
    description?: string
    contentType: string
    sizeBytes: number
  }>
  attachmentIds?: string[]
}

export type ReceiptCreateFormState = {
  poId: string
  receivedBy: string
  receivedDate: string
  note: string
  fileName: string
  fileDescription: string
  file: File | null
  uploadedAttachments: UploadedAttachment[]
  lines: Array<{
    poLineId: string
    receivedQuantity: number
    note: string
  }>
}

export type InvoiceCreateFormState = {
  poId: string
  invoiceNumber: string
  invoiceDate: string
  registeredBy: string
  note: string
  fileName: string
  fileDescription: string
  file: File | null
  uploadedAttachments: UploadedAttachment[]
  lines: Array<{
    poLineId: string
    invoicedQuantity: number
    untaxedAmount: number
    taxRate: number
    taxAmount: number
    totalAmount: number
  }>
}

export type InvoiceEditableLineKey = 'invoicedQuantity' | 'untaxedAmount' | 'taxRate' | 'taxAmount' | 'totalAmount'

export type ThreeWayMatchListItem = {
  matchId: string
  companyId: string
  poId: string
  poTitle: string
  supplierId: string
  supplierName: string
  status: ThreeWayMatchStatus
  poTotalAmount: number
  invoiceTotalAmount: number
  invoiceVarianceAmount: number
  currency: string
  differenceCount: number
  highestSeverity: ThreeWayMatchSeverity | null
  lastCalculatedAt: string
  updatedAt: string
}

export type ThreeWayMatchPoSummary = {
  poId: string
  companyId: string
  title: string
  status: PurchaseOrderStatus
  supplierId: string
  supplierName: string
  totalAmount: number
  currency: string
  expectedDeliveryDate: string
  issuedAt: string | null
}

export type ThreeWayMatchReceiptSummary = {
  receiptCount: number
  receivedQuantity: number
  latestReceiptAt: string | null
}

export type ThreeWayMatchInvoiceSummary = {
  invoiceCount: number
  invoicedQuantity: number
  invoiceTotalAmount: number
  invoiceVarianceAmount: number
  latestInvoiceAt: string | null
}

export type ThreeWayMatchLine = {
  poLineId: string
  lineNo: number
  itemName: string
  specification: string | null
  orderedQuantity: number
  receivedQuantity: number
  invoicedQuantity: number
  unit: string
}

export type ThreeWayMatchDifference = {
  differenceId: string
  differenceType: ThreeWayMatchDifferenceType
  severity: ThreeWayMatchSeverity
  poLineId: string | null
  lineNo: number | null
  itemName: string | null
  specification: string | null
  orderedQuantity: number | null
  receivedQuantity: number | null
  invoicedQuantity: number | null
  unit: string | null
  poAmount: number | null
  invoiceAmount: number | null
  differenceAmount: number | null
  currency: string
  description: string
  createdAt: string
}

export type ThreeWayMatchActionRecord = {
  actionId: string
  actionType: ThreeWayMatchActionType
  actorId: string
  note: string
  createdAt: string
}

export type ThreeWayMatchDetail = {
  matchId: string
  companyId: string
  status: ThreeWayMatchStatus
  sourcePo: ThreeWayMatchPoSummary
  receiptSummary: ThreeWayMatchReceiptSummary
  invoiceSummary: ThreeWayMatchInvoiceSummary
  orderedTotalQuantity: number
  receivedTotalQuantity: number
  invoicedTotalQuantity: number
  poTotalAmount: number
  invoiceTotalAmount: number
  invoiceVarianceAmount: number
  currency: string
  differenceCount: number
  highestSeverity: ThreeWayMatchSeverity | null
  lines: ThreeWayMatchLine[]
  differences: ThreeWayMatchDifference[]
  actions: ThreeWayMatchActionRecord[]
  lastCalculatedAt: string
  createdAt: string
  updatedAt: string
}

export type RecalculateMatchPayload = {
  companyId: string
  poId: string
  actorId: string
}

export type HandleMatchActionPayload = {
  companyId: string
  actorId: string
  actionType: ThreeWayMatchActionType
  note: string
}

export type AiScenario =
  | 'PURCHASE_REQUEST_DRAFT'
  | 'PURCHASE_REQUEST_RISK'
  | 'RFQ_QUOTE_EXPLANATION'
  | 'THREE_WAY_MATCHING_EXPLANATION'

export type AiContextReference = {
  type: string
  id: string
  label: string
}

export type AiAssistantResponse = {
  invocationId: string
  scenario: AiScenario
  model: string
  result: Record<string, unknown>
  sourceReferences: AiContextReference[]
  generatedAt: string
}

export type AiDraftLine = {
  itemName?: string
  specification?: string
  quantity?: number
  unit?: string
  estimatedUnitPrice?: number
  estimatedAmount?: number
}

export type AiDraftPreviewResult = {
  title?: string
  businessPurpose?: string
  requesterId?: string
  departmentId?: string
  categoryId?: string
  budgetAccountId?: string
  supplierId?: string
  supplierIds?: string[]
  expectedDeliveryDate?: string
  currency?: string
  totalAmount?: number
  lineItems?: AiDraftLine[]
  missingFields?: string[]
  confidenceNotes?: string[]
}

export type AiRiskReviewResult = {
  riskLevel?: string
  riskItems?: Array<{ title?: string; evidence?: string; severity?: string }>
  suggestedActions?: string[]
  followUpQuestions?: string[]
  continueRecommended?: boolean
}

export type AiRfqExplanationResult = {
  summary?: string
  supplierInsights?: Array<{ supplierId?: string; assessment?: string; strengths?: string[]; risks?: string[] }>
  keyDifferences?: string[]
  riskNotes?: string[]
  questionsToConfirm?: string[]
  confidenceLevel?: string
}

export type AiMatchingExplanationResult = {
  summary?: string
  differenceInsights?: Array<{ differenceId?: string; assessment?: string; suggestedManualAction?: string }>
  likelyCauses?: string[]
  suggestedActions?: string[]
  requiredFollowUpData?: string[]
  confidenceLevel?: string
}

export const demoContext: DemoContext = {
  groupId: 'group-xinghe',
  groupName: '星河控股集团',
  activeCompany: {
    companyId: 'company-digital',
    companyName: '星河数字科技有限公司',
    businessScope: '信息技术设备、软件订阅、办公采购',
    active: true,
  },
  companies: [
    {
      companyId: 'company-digital',
      companyName: '星河数字科技有限公司',
      businessScope: '信息技术设备、软件订阅、办公采购',
      active: true,
    },
    {
      companyId: 'company-manufacturing',
      companyName: '星河智能制造有限公司',
      businessScope: '生产耗材、设备备件、物流服务',
      active: false,
    },
  ],
  supplierPoolScope: '集团共享供应商池',
  dataBoundary: {
    groupShared: '供应商池、采购品类模板、集团级看板汇总',
    companyIsolated: '采购申请、审批实例、询价单、采购订单、收货、发票、三单匹配结果',
  },
}
