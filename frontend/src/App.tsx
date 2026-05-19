import {
  AlertOutlined,
  ApiOutlined,
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FileSearchOutlined,
  InboxOutlined,
  LogoutOutlined,
  LoadingOutlined,
  NodeIndexOutlined,
  PlusOutlined,
  ProfileOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  SwapOutlined,
  TeamOutlined,
  TranslationOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { keepPreviousData, QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, ConfigProvider, Drawer, Dropdown, Layout, Modal, Popover, Select, Tooltip } from 'antd'
import type { MenuProps, ThemeConfig } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import ReactECharts from 'echarts-for-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const { Header, Sider, Content } = Layout

const queryClient = new QueryClient()

type Language = 'zh' | 'en'

const antdLocales = {
  zh: zhCN,
  en: enUS,
}

const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#2f7a4d',
    colorInfo: '#2f7a4d',
    colorSuccess: '#5b8468',
    colorWarning: '#8f7a45',
    colorError: '#95605c',
    colorText: '#1e2723',
    colorTextSecondary: '#707771',
    colorBgBase: '#f5f6f4',
    colorBgContainer: '#ffffff',
    colorBorder: '#dde2dc',
    borderRadius: 8,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    wireframe: false,
  },
  components: {
    Button: {
      borderRadius: 7,
      controlHeight: 34,
      primaryShadow: 'none',
    },
    Card: {
      borderRadiusLG: 8,
      boxShadowTertiary: 'none',
    },
    Layout: {
      bodyBg: '#f5f6f4',
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Table: {
      headerBg: '#f8f9f7',
      borderColor: '#dde2dc',
    },
    Tag: {
      borderRadiusSM: 12,
    },
  },
}

type ApiEnvelope<T> = {
  success: boolean
  data: T
  timestamp: string
}

type HealthEnvelope = ApiEnvelope<{
  status: string
  application: string
  checkedAt: string
  demoContext: DemoContext
}>

type DemoDataResetResult = {
  startedAt: string
  completedAt: string
  migrationsExecuted: number
  schemaVersion: string
}

type DemoContext = {
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

type CompanyContext = {
  companyId: string
  companyName: string
  businessScope: string
  active: boolean
}

type DepartmentSummary = {
  departmentId: string
  companyId: string
  departmentName: string
  functionScope: string
}

type RoleSummary = {
  roleId: string
  roleName: string
  roleType: string
}

type UserSummary = {
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

type CategorySummary = {
  categoryId: string
  categoryName: string
  businessScope: string
  groupLevel: boolean
}

type SupplierSummary = {
  supplierId: string
  supplierName: string
  serviceScope: string
  location: string
  status: string
  riskLevel: string
  sharedScope: string
  categories: CategorySummary[]
}

type BudgetAccountSummary = {
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

type PurchaseRequestStatus = 'DRAFT' | 'SUBMITTED'
type PurchaseRequestDrawerMode = 'create' | 'detail'
type ApprovalInstanceStatus = 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
type ApprovalNodeStatus = 'PENDING' | 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
type ApprovalAction = 'CREATED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
type RfqStatus = 'ISSUED' | 'QUOTING' | 'COMPARISON_READY'
type PurchaseOrderStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED'
type PurchaseOrderAction = 'CREATED' | 'PUBLISHED' | 'CANCELLED'

type ApprovalRecord = {
  recordId: string
  nodeId: string | null
  actorId: string
  action: ApprovalAction
  comment: string | null
  createdAt: string
}

type ApprovalSummary = {
  approvalId: string
  status: ApprovalInstanceStatus
  currentNodeId: string | null
  currentStepOrder: number | null
  currentNodeName: string | null
  currentApproverId: string | null
  matchedRuleId: string
  timeline: ApprovalRecord[]
}

type ApprovalTask = {
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

type ApprovalNode = {
  nodeId: string
  stepOrder: number
  nodeName: string
  approverId: string
  status: ApprovalNodeStatus
  activatedAt: string | null
  completedAt: string | null
}

type ApprovalDetail = {
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

type ApprovalActionPayload = {
  actorId: string
  comment?: string
}

type PurchaseRequestLine = {
  lineNo: number
  itemName: string
  specification: string | null
  quantity: number
  unit: string
  estimatedUnitPrice: number
  estimatedAmount: number
  categoryId: string
}

type PurchaseRequestListItem = {
  requestId: string
  companyId: string
  requesterId: string
  departmentId: string
  categoryId: string
  budgetAccountId: string
  supplierId: string | null
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

type PurchaseRequestDetail = PurchaseRequestListItem & {
  description: string | null
  updatedAt: string
  fieldSnapshot: Record<string, unknown>
  lineItems: PurchaseRequestLine[]
}

type CreatePurchaseRequestDraftPayload = {
  companyId: string
  requesterId: string
  departmentId: string
  categoryId: string
  budgetAccountId: string
  supplierId?: string
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

type PurchaseRequestFormState = {
  companyId: string
  requesterId: string
  departmentId: string
  categoryId: string
  budgetAccountId: string
  supplierId: string
  title: string
  description: string
  expectedDeliveryDate: string
  lineItems: PurchaseRequestFormLine[]
}

type PurchaseRequestFormLine = {
  lineKey: string
  itemName: string
  specification: string
  quantity: number
  unit: string
  estimatedUnitPrice: number
}

type RfqSupplier = {
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

type RfqQuoteAttachment = {
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

type RfqQuote = {
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

type RfqListItem = {
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

type RfqDetail = RfqListItem & {
  budgetAccountId: string
  requestSnapshot: Record<string, unknown>
  suppliers: RfqSupplier[]
  quotes: RfqQuote[]
}

type RfqComparisonRow = {
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

type CreateRfqPayload = {
  companyId: string
  requestId: string
  procurementUserId: string
  title?: string
  supplierIds: string[]
}

type UpsertRfqQuotePayload = {
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

type UploadedAttachment = {
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

type RfqCreateFormState = {
  procurementUserId: string
  requestId: string
  supplierIds: string[]
  title: string
}

type RfqQuoteFormState = {
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

type PurchaseOrderLine = {
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

type PurchaseOrderDeliverySchedule = {
  scheduleId: string
  plannedDeliveryDate: string
  deliveryLocation: string
  contactPerson: string
  contactPhone: string
  deliveryNote: string | null
  createdAt: string
  updatedAt: string
}

type PurchaseOrderStatusRecord = {
  recordId: string
  actorId: string
  action: PurchaseOrderAction
  fromStatus: PurchaseOrderStatus | null
  toStatus: PurchaseOrderStatus
  comment: string | null
  createdAt: string
}

type PurchaseOrderListItem = {
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

type PurchaseOrderDetail = PurchaseOrderListItem & {
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

type CreatePurchaseOrderPayload = {
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

type PurchaseOrderActionPayload = {
  companyId: string
  actorId: string
  comment?: string
}

type CancelPurchaseOrderPayload = {
  companyId: string
  actorId: string
  reason: string
}

type PurchaseOrderCreateFormState = {
  rfqId: string
  quoteId: string
  procurementUserId: string
  plannedDeliveryDate: string
  deliveryLocation: string
  contactPerson: string
  contactPhone: string
  deliveryNote: string
}

type ReceiptProgressStatus = 'NOT_RECEIVED' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED'
type InvoiceProgressStatus = 'NOT_INVOICED' | 'PARTIALLY_INVOICED' | 'FULLY_INVOICED'
type InvoiceAmountStatus = 'NOT_INVOICED' | 'MATCHED' | 'VARIANCE'
type PurchaseReceiptStatus = 'RECORDED'
type SupplierInvoiceStatus = 'RECORDED'
type ReceiptInvoiceCreateMode = 'receipt' | 'invoice'
type ThreeWayMatchStatus = 'PENDING_INPUT' | 'MATCHED' | 'EXCEPTION' | 'RESOLVED'
type ThreeWayMatchSeverity = 'LOW' | 'MEDIUM' | 'HIGH'
type ThreeWayMatchDifferenceType =
  | 'MISSING_RECEIPT'
  | 'MISSING_INVOICE'
  | 'RECEIPT_QUANTITY_SHORT'
  | 'INVOICE_QUANTITY_OVER_RECEIPT'
  | 'INVOICE_AMOUNT_MISMATCH'
type ThreeWayMatchActionType = 'ACKNOWLEDGE' | 'MARK_IN_PROGRESS' | 'RESOLVE' | 'REOPEN'
type ThreeWayMatchTab = 'all' | 'exceptions' | 'resolved'
type ProcurementDashboardScope = 'GROUP' | 'COMPANY'
type ProcurementDashboardScopeValue = 'GROUP' | string

type DashboardMetric = {
  key: string
  label: string
  value: number
  currency: string | null
  generatedAt: string
}

type SpendTrendPoint = {
  period: string
  amount: number
  currency: string
  documentCount: number
}

type DocumentFunnelStage = {
  key: string
  label: string
  count: number
}

type StatusDistributionBucket = {
  documentType: string
  documentLabel: string
  status: string
  label: string
  count: number
}

type SupplierDistributionItem = {
  supplierId: string
  supplierName: string
  issuedPoAmount: number
  currency: string
  issuedPoCount: number
  quoteCount: number
}

type ExceptionHighlight = {
  matchId: string
  companyId: string
  companyName: string
  poId: string
  poTitle: string
  supplierId: string
  supplierName: string
  severity: ThreeWayMatchSeverity | null
  invoiceVarianceAmount: number
  currency: string
  lastCalculatedAt: string
}

type ProcurementDashboard = {
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

type ReceiptInvoiceAttachment = {
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

type FulfillmentLine = {
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

type FulfillmentPurchaseOrder = {
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

type ReceiptListItem = {
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

type InvoiceListItem = {
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

type CreateReceiptPayload = {
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

type CreateInvoicePayload = {
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

type ReceiptCreateFormState = {
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

type InvoiceCreateFormState = {
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

type InvoiceEditableLineKey = 'invoicedQuantity' | 'untaxedAmount' | 'taxRate' | 'taxAmount' | 'totalAmount'

type ThreeWayMatchListItem = {
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

type ThreeWayMatchPoSummary = {
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

type ThreeWayMatchReceiptSummary = {
  receiptCount: number
  receivedQuantity: number
  latestReceiptAt: string | null
}

type ThreeWayMatchInvoiceSummary = {
  invoiceCount: number
  invoicedQuantity: number
  invoiceTotalAmount: number
  invoiceVarianceAmount: number
  latestInvoiceAt: string | null
}

type ThreeWayMatchLine = {
  poLineId: string
  lineNo: number
  itemName: string
  specification: string | null
  orderedQuantity: number
  receivedQuantity: number
  invoicedQuantity: number
  unit: string
}

type ThreeWayMatchDifference = {
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

type ThreeWayMatchActionRecord = {
  actionId: string
  actionType: ThreeWayMatchActionType
  actorId: string
  note: string
  createdAt: string
}

type ThreeWayMatchDetail = {
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

type RecalculateMatchPayload = {
  companyId: string
  poId: string
  actorId: string
}

type HandleMatchActionPayload = {
  companyId: string
  actorId: string
  actionType: ThreeWayMatchActionType
  note: string
}

type AiScenario =
  | 'PURCHASE_REQUEST_DRAFT'
  | 'PURCHASE_REQUEST_RISK'
  | 'RFQ_QUOTE_EXPLANATION'
  | 'THREE_WAY_MATCHING_EXPLANATION'

type AiContextReference = {
  type: string
  id: string
  label: string
}

type AiAssistantResponse = {
  invocationId: string
  scenario: AiScenario
  model: string
  result: Record<string, unknown>
  sourceReferences: AiContextReference[]
  generatedAt: string
}

type AiDraftLine = {
  itemName?: string
  specification?: string
  quantity?: number
  unit?: string
  estimatedUnitPrice?: number
  estimatedAmount?: number
}

type AiDraftPreviewResult = {
  title?: string
  businessPurpose?: string
  requesterId?: string
  departmentId?: string
  categoryId?: string
  budgetAccountId?: string
  supplierId?: string
  expectedDeliveryDate?: string
  currency?: string
  totalAmount?: number
  lineItems?: AiDraftLine[]
  missingFields?: string[]
  confidenceNotes?: string[]
}

type AiRiskReviewResult = {
  riskLevel?: string
  riskItems?: Array<{ title?: string; evidence?: string; severity?: string }>
  suggestedActions?: string[]
  followUpQuestions?: string[]
  continueRecommended?: boolean
}

type AiRfqExplanationResult = {
  summary?: string
  supplierInsights?: Array<{ supplierId?: string; assessment?: string; strengths?: string[]; risks?: string[] }>
  keyDifferences?: string[]
  riskNotes?: string[]
  questionsToConfirm?: string[]
  confidenceLevel?: string
}

type AiMatchingExplanationResult = {
  summary?: string
  differenceInsights?: Array<{ differenceId?: string; assessment?: string; suggestedManualAction?: string }>
  likelyCauses?: string[]
  suggestedActions?: string[]
  requiredFollowUpData?: string[]
  confidenceLevel?: string
}

const demoContext: DemoContext = {
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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

async function fetchApi<T>(path: string): Promise<ApiEnvelope<T>> {
  return requestApi<T>(path)
}

async function requestApi<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
    ...init,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message =
      errorBody && typeof errorBody.message === 'string'
        ? errorBody.message
        : `Request failed with ${response.status}`
    throw new Error(message)
  }

  return response.json() as Promise<ApiEnvelope<T>>
}

async function postApi<T>(path: string, body?: unknown): Promise<ApiEnvelope<T>> {
  return requestApi<T>(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    method: 'POST',
  })
}

async function putApi<T>(path: string, body?: unknown): Promise<ApiEnvelope<T>> {
  return requestApi<T>(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    method: 'PUT',
  })
}

async function fetchHealth(): Promise<HealthEnvelope> {
  return fetchApi('/api/health')
}

async function fetchMasterDataContext() {
  return fetchApi<DemoContext>('/api/master-data/context')
}

async function fetchCompanies() {
  return fetchApi<CompanyContext[]>('/api/master-data/companies')
}

async function fetchDepartments(companyId: string) {
  return fetchApi<DepartmentSummary[]>(`/api/master-data/companies/${companyId}/departments`)
}

async function fetchUsers(companyId: string) {
  return fetchApi<UserSummary[]>(`/api/master-data/companies/${companyId}/users`)
}

async function fetchSuppliers() {
  return fetchApi<SupplierSummary[]>('/api/master-data/suppliers')
}

async function fetchCategories() {
  return fetchApi<CategorySummary[]>('/api/master-data/categories')
}

async function fetchBudgetAccounts(companyId: string) {
  return fetchApi<BudgetAccountSummary[]>(`/api/master-data/companies/${companyId}/budget-accounts`)
}

async function resetDemoData() {
  return postApi<DemoDataResetResult>('/api/demo-data/reset')
}

async function fetchPurchaseRequests(companyId: string) {
  return fetchApi<PurchaseRequestListItem[]>(`/api/purchase-requests?companyId=${encodeURIComponent(companyId)}`)
}

async function fetchPurchaseRequestDetail(requestId: string) {
  return fetchApi<PurchaseRequestDetail>(`/api/purchase-requests/${encodeURIComponent(requestId)}`)
}

async function createPurchaseRequestDraft(payload: CreatePurchaseRequestDraftPayload) {
  return postApi<PurchaseRequestDetail>('/api/purchase-requests/drafts', payload)
}

async function submitPurchaseRequest(requestId: string) {
  return postApi<PurchaseRequestDetail>(`/api/purchase-requests/${encodeURIComponent(requestId)}/submit`)
}

async function fetchApprovalTasks(companyId: string, approverId: string) {
  return fetchApi<ApprovalTask[]>(
    `/api/approvals/tasks?companyId=${encodeURIComponent(companyId)}&approverId=${encodeURIComponent(approverId)}`,
  )
}

async function fetchApprovalDetail(approvalId: string, companyId?: string) {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
  return fetchApi<ApprovalDetail>(`/api/approvals/${encodeURIComponent(approvalId)}${query}`)
}

async function fetchApprovalByRequest(requestId: string, companyId?: string) {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
  return fetchApi<ApprovalDetail>(`/api/approvals/by-request/${encodeURIComponent(requestId)}${query}`)
}

async function approveApproval(approvalId: string, payload: ApprovalActionPayload) {
  return postApi<ApprovalDetail>(`/api/approvals/${encodeURIComponent(approvalId)}/approve`, payload)
}

async function rejectApproval(approvalId: string, payload: ApprovalActionPayload) {
  return postApi<ApprovalDetail>(`/api/approvals/${encodeURIComponent(approvalId)}/reject`, payload)
}

async function withdrawApproval(approvalId: string, payload: ApprovalActionPayload) {
  return postApi<ApprovalDetail>(`/api/approvals/${encodeURIComponent(approvalId)}/withdraw`, payload)
}

async function fetchRfqs(companyId: string) {
  return fetchApi<RfqListItem[]>(`/api/rfqs?companyId=${encodeURIComponent(companyId)}`)
}

async function fetchRfqDetail(rfqId: string, companyId?: string) {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
  return fetchApi<RfqDetail>(`/api/rfqs/${encodeURIComponent(rfqId)}${query}`)
}

async function createRfq(payload: CreateRfqPayload) {
  return postApi<RfqDetail>('/api/rfqs', payload)
}

async function upsertRfqQuote(rfqId: string, supplierId: string, payload: UpsertRfqQuotePayload) {
  return putApi<RfqQuote>(`/api/rfqs/${encodeURIComponent(rfqId)}/quotes/${encodeURIComponent(supplierId)}`, payload)
}

async function uploadAttachment({
  companyId,
  description,
  file,
  supplierId,
  targetId,
  targetType,
  uploadedBy,
}: {
  companyId: string
  description?: string
  file: File
  supplierId?: string
  targetId: string
  targetType: 'RFQ_QUOTE' | 'RECEIPT' | 'INVOICE'
  uploadedBy?: string
}) {
  const formData = new FormData()
  formData.append('companyId', companyId)
  formData.append('targetType', targetType)
  formData.append('targetId', targetId)
  if (supplierId) {
    formData.append('supplierId', supplierId)
  }
  if (uploadedBy) {
    formData.append('uploadedBy', uploadedBy)
  }
  if (description) {
    formData.append('description', description)
  }
  formData.append('file', file)

  const response = await fetch(`${apiBaseUrl}/api/attachments`, {
    body: formData,
    method: 'POST',
  })
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message =
      errorBody && typeof errorBody.message === 'string'
        ? errorBody.message
        : `Request failed with ${response.status}`
    throw new Error(message)
  }
  return response.json() as Promise<ApiEnvelope<UploadedAttachment>>
}

async function fetchRfqComparison(rfqId: string, companyId?: string) {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
  return fetchApi<RfqComparisonRow[]>(`/api/rfqs/${encodeURIComponent(rfqId)}/comparison${query}`)
}

async function fetchPurchaseOrders(companyId: string) {
  return fetchApi<PurchaseOrderListItem[]>(`/api/purchase-orders?companyId=${encodeURIComponent(companyId)}`)
}

async function fetchPurchaseOrderDetail(poId: string, companyId?: string) {
  const query = companyId ? `?companyId=${encodeURIComponent(companyId)}` : ''
  return fetchApi<PurchaseOrderDetail>(`/api/purchase-orders/${encodeURIComponent(poId)}${query}`)
}

async function createPurchaseOrder(payload: CreatePurchaseOrderPayload) {
  return postApi<PurchaseOrderDetail>('/api/purchase-orders', payload)
}

async function publishPurchaseOrder(poId: string, payload: PurchaseOrderActionPayload) {
  return postApi<PurchaseOrderDetail>(`/api/purchase-orders/${encodeURIComponent(poId)}/publish`, payload)
}

async function cancelPurchaseOrder(poId: string, payload: CancelPurchaseOrderPayload) {
  return postApi<PurchaseOrderDetail>(`/api/purchase-orders/${encodeURIComponent(poId)}/cancel`, payload)
}

async function fetchFulfillmentPurchaseOrders(companyId: string) {
  return fetchApi<FulfillmentPurchaseOrder[]>(`/api/receipts-invoices/purchase-orders?companyId=${encodeURIComponent(companyId)}`)
}

async function fetchReceipts(companyId: string, poId?: string) {
  const poQuery = poId ? `&poId=${encodeURIComponent(poId)}` : ''
  return fetchApi<ReceiptListItem[]>(`/api/receipts?companyId=${encodeURIComponent(companyId)}${poQuery}`)
}

async function fetchInvoices(companyId: string, poId?: string) {
  const poQuery = poId ? `&poId=${encodeURIComponent(poId)}` : ''
  return fetchApi<InvoiceListItem[]>(`/api/invoices?companyId=${encodeURIComponent(companyId)}${poQuery}`)
}

async function createReceipt(payload: CreateReceiptPayload) {
  return postApi<unknown>('/api/receipts', payload)
}

async function createInvoice(payload: CreateInvoicePayload) {
  return postApi<unknown>('/api/invoices', payload)
}

async function fetchThreeWayMatches(companyId: string, status?: ThreeWayMatchStatus) {
  const statusQuery = status ? `&status=${encodeURIComponent(status)}` : ''
  return fetchApi<ThreeWayMatchListItem[]>(`/api/three-way-matching?companyId=${encodeURIComponent(companyId)}${statusQuery}`)
}

async function fetchThreeWayMatchExceptions(companyId: string) {
  return fetchApi<ThreeWayMatchListItem[]>(`/api/three-way-matching/exceptions?companyId=${encodeURIComponent(companyId)}`)
}

async function fetchThreeWayMatchDetail(matchId: string, companyId: string) {
  return fetchApi<ThreeWayMatchDetail>(
    `/api/three-way-matching/${encodeURIComponent(matchId)}?companyId=${encodeURIComponent(companyId)}`,
  )
}

async function recalculateThreeWayMatch(payload: RecalculateMatchPayload) {
  return postApi<ThreeWayMatchDetail>('/api/three-way-matching/recalculate', payload)
}

async function handleThreeWayMatchAction(matchId: string, payload: HandleMatchActionPayload) {
  return postApi<ThreeWayMatchDetail>(`/api/three-way-matching/${encodeURIComponent(matchId)}/actions`, payload)
}

async function previewAiPurchaseRequestDraft(payload: { companyId: string; actorId: string; intent: string }) {
  return postApi<AiAssistantResponse>('/api/ai-assistant/purchase-request-draft-preview', payload)
}

async function reviewAiPurchaseRequestRisk(payload: { companyId: string; actorId: string; requestId: string }) {
  return postApi<AiAssistantResponse>('/api/ai-assistant/purchase-request-risk-review', payload)
}

async function explainAiRfqQuotes(payload: { companyId: string; actorId: string; rfqId: string }) {
  return postApi<AiAssistantResponse>('/api/ai-assistant/rfq-quote-explanation', payload)
}

async function explainAiMatchingException(payload: { companyId: string; actorId: string; matchId: string }) {
  return postApi<AiAssistantResponse>('/api/ai-assistant/three-way-matching-explanation', payload)
}

async function fetchProcurementDashboard(scope: ProcurementDashboardScope, companyId?: string) {
  const query = new URLSearchParams({ scope })
  if (scope === 'COMPANY' && companyId) {
    query.set('companyId', companyId)
  }

  return fetchApi<ProcurementDashboard>(`/api/procurement-dashboard?${query.toString()}`)
}

export const localizedContent = {
  zh: {
    brandSubtitle: '集团采购协同',
    boundaryNote: '集团共享供应商池，公司级采购数据隔离',
    aria: {
      modules: '采购模块',
      search: '搜索',
      notifications: '通知',
      serviceStatus: '服务状态',
      procurementMetrics: '采购指标',
    },
    header: {
      title: '采购看板',
      foundationTitle: '组织与主数据',
      supplierPoolTitle: '供应商池',
      purchaseRequestsTitle: '采购申请',
      approvalsTitle: '审批中心',
      rfqTitle: '询报价',
      purchaseOrdersTitle: '采购订单',
      receiptInvoiceTitle: '收货发票',
      matchingTitle: '三单匹配',
    },
    actions: {
      newRequest: '新建申请',
      newRfq: '新建 RFQ',
      newPo: '新建 PO',
      newReceipt: '登记收货',
      newInvoice: '登记发票',
    },
    notificationCenter: {
      title: '通知',
      empty: '暂无通知',
      dismiss: '关闭通知',
      countLabel: '未读通知',
      items: [
        {
          id: 'approval-pr-0401',
          path: '/approvals',
          title: '审批任务新增 4 条',
          description: '周明远有新的信息技术类采购申请待审批。',
          time: '刚刚',
          tone: 'approval',
        },
        {
          id: 'matching-po-0302',
          path: '/three-way-matching',
          title: '三单匹配出现异常',
          description: 'PO-20260518-0302 发票金额比 PO 高 ¥2,300。',
          time: '10 分钟前',
          tone: 'warning',
        },
        {
          id: 'rfq-workstation-ready',
          path: '/rfqs',
          title: '移动工作站 RFQ 可比价',
          description: '蓝芯、云舟、诚采三家报价已齐，可进入报价对比。',
          time: '今天 11:45',
          tone: 'success',
        },
      ],
    },
    ai: {
      title: 'AI 采购助手',
      dataState: 'AI 建议',
      draftIntent: '自然语言需求',
      draftPlaceholder: '例如：研发团队下月需要 20 台 14 英寸笔记本，预算约 18.6 万',
      generateDraft: '生成草稿',
      reviewRisk: '风险提示',
      explainQuotes: '解释报价',
      explainMatching: '解释异常',
      generating: 'AI 生成中',
      generatingDescription: '正在生成建议，请稍候',
      unavailable: 'AI 助手暂不可用',
      disabledNoIntent: '先输入采购需求',
      disabledNoActor: '当前公司没有可用用户',
      disabledNeedQuotes: '至少两家有效报价后才能解释',
      disabledExceptionOnly: '只有异常匹配结果需要 AI 解释',
      result: 'AI 结果',
      invocation: '调用编号',
      model: '模型',
      generatedAt: '生成时间',
      confidence: '置信度',
      riskLevel: '风险等级',
      businessPurpose: '业务用途',
      missingFields: '待补字段',
      confidenceNotes: '置信说明',
      riskItems: '风险项',
      suggestedActions: '建议动作',
      followUpQuestions: '待确认问题',
      continueRecommended: '建议继续',
      keyDifferences: '主要差异',
      riskNotes: '风险说明',
      supplierInsights: '供应商解读',
      differenceInsights: '差异解读',
      likelyCauses: '可能原因',
      requiredFollowUpData: '需补充资料',
      noAiResult: '暂无 AI 结果',
    },
    status: {
      backend: '后端',
    },
    userMenu: {
      openMenu: '打开用户菜单',
      name: '王然',
      role: '采购经理',
      email: 'wang.ran@xinghe.com',
      language: '切换语言',
      chinese: '中文',
      english: 'English',
      resetDemoData: '重置演示数据',
      resetDemoDataRunning: '正在重置演示数据',
      resetDemoDataTitle: '重置演示数据？',
      resetDemoDataDescription: '这会清空当前录入、审批、RFQ、PO、收货、发票和匹配结果，并按内置 seed 重新生成演示数据。',
      resetDemoDataConfirm: '重置数据',
      resetDemoDataSuccess: '演示数据已还原',
      resetDemoDataFailure: '重置演示数据失败',
      logout: '退出登录',
    },
    panels: {
      spendTrend: '采购金额趋势',
      companyView: '公司视角',
      recentRequests: '近期采购申请',
      procurementFlow: '采购流程',
      risks: '风险与待办',
      today: '今日',
      dataBoundary: '数据边界',
      skeletonRule: '骨架约定',
    },
    table: {
      request: '申请单',
      category: '品类',
      company: '公司',
      amount: '金额',
      currentStep: '当前节点',
      status: '状态',
    },
    navItems: [
      { label: '采购看板', icon: <DashboardOutlined />, path: '/' },
      { label: '采购申请', icon: <FileAddOutlined />, path: '/purchase-requests' },
      { label: '审批中心', icon: <AuditOutlined />, path: '/approvals' },
      { label: '询报价', icon: <FileSearchOutlined />, path: '/rfqs' },
      { label: '采购订单', icon: <ShoppingCartOutlined />, path: '/purchase-orders' },
      { label: '收货发票', icon: <InboxOutlined />, path: '/receipts-invoices' },
      { label: '三单匹配', icon: <SwapOutlined />, path: '/three-way-matching' },
      { label: '供应商池', icon: <TeamOutlined />, path: '/suppliers' },
      { label: '主数据', icon: <DatabaseOutlined />, path: '/master-data' },
    ],
    kpis: [
      {
        label: '本月采购金额',
        value: '¥428.6万',
        note: '较上月 +12.4%',
        icon: <ShoppingCartOutlined />,
      },
      {
        label: '待审批',
        value: '27',
        note: '高优先级 5 单',
        icon: <AuditOutlined />,
        tone: 'warn',
      },
      {
        label: 'RFQ 进行中',
        value: '14',
        note: '平均 2.8 家报价',
        icon: <FileSearchOutlined />,
      },
      {
        label: '匹配异常',
        value: '3',
        note: '金额差异 ¥2,300',
        icon: <AlertOutlined />,
        tone: 'danger',
      },
    ],
    purchaseRows: [
      {
        id: 'PR-2026-0518-021',
        category: '笔记本电脑',
        company: '星河数字科技',
        amount: '¥186,000',
        node: '财务审批',
        status: '审批中',
        tone: 'warn',
      },
      {
        id: 'PR-2026-0518-014',
        category: '设备备件',
        company: '星河智能制造',
        amount: '¥72,400',
        node: '生产负责人',
        status: '待处理',
        tone: 'neutral',
      },
      {
        id: 'PR-2026-0517-033',
        category: '软件订阅',
        company: '星河数字科技',
        amount: '¥38,000',
        node: '采购员询价',
        status: 'RFQ',
        tone: 'success',
      },
      {
        id: 'PR-2026-0516-009',
        category: '物流服务',
        company: '星河智能制造',
        amount: '¥24,800',
        node: '三单匹配',
        status: '异常',
        tone: 'danger',
      },
    ],
    flowStages: [
      { title: '申请提交', description: '草稿、提交、预算科目', count: '' },
      { title: '审批流转', description: '公司、金额、品类规则', count: '', tone: 'warn' },
      { title: '询价比价', description: '供应商池、报价评分', count: '' },
      { title: '订单到票', description: 'PO、收货、发票、匹配', count: '', tone: 'danger' },
    ],
    riskItems: [
      { title: '发票金额偏差', detail: 'PO-2026-088 发票多 ¥2,300', tone: 'danger' },
      { title: '审批即将超时', detail: '设备备件申请已等待 21 小时', tone: 'warn' },
      { title: '供应商评分下降', detail: '蓝芯电子交付评分 -6.2', tone: 'neutral' },
    ],
    riskAction: {
      danger: '异常',
      review: '复核',
    },
    boundary: {
      groupShared: '集团共享',
      companyIsolated: '公司隔离',
    },
    dashboard: {
      dataState: '后端看板数据',
      scope: '看板范围',
      groupScope: '集团汇总',
      loading: '加载采购看板',
      unavailable: '采购看板暂不可用',
      empty: '暂无数据',
      spendTrend: '采购金额趋势',
      documentFunnel: '采购单据漏斗',
      statusDistribution: '状态分布',
      supplierDistribution: '供应商分布',
      exceptionHighlights: '匹配异常摘要',
      noExceptions: '暂无三单匹配异常',
      noTrend: '暂无采购金额趋势',
      noFunnel: '暂无单据漏斗数据',
      noStatus: '暂无状态分布',
      noSuppliers: '暂无供应商分布',
      viewMatching: '查看三单匹配',
      generatedAt: '生成时间',
      documentCount: '单据数',
      issuedPoAmount: '已发布 PO 金额',
      pendingApprovals: '待审批',
      activeRfqs: '进行中 RFQ',
      issuedPurchaseOrders: '已发布 PO',
      receiptInvoiceFollowUp: '收货/发票待补齐',
      matchingExceptions: '三单匹配异常',
      quotes: '报价',
      issuedPoCount: 'PO',
      company: '公司',
      supplier: '供应商',
      severity: '严重度',
      invoiceVariance: '金额差异',
      lastCalculated: '最近计算',
    },
    foundation: {
      dataState: '后端基础数据',
      loading: '加载中',
      unavailable: '主数据暂不可用',
      groupContext: '集团与公司上下文',
      companySelector: '公司选择',
      supplierPool: '集团共享供应商池',
      categories: '采购品类',
      departmentsUsers: '部门与用户角色',
      budgetAccounts: '预算科目',
      companyScoped: '公司级数据',
      selectedCompany: '当前公司',
      serviceScope: '服务范围',
      location: '地区',
      status: '状态',
      risk: '风险',
      category: '品类',
      department: '部门',
      user: '用户',
      role: '角色',
      account: '科目',
      annualBudget: '年度预算',
      availableBudget: '可用金额',
      active: '启用',
      inactive: '停用',
      groupLevel: '集团级',
      shared: '共享',
    },
    supplierPool: {
      dataState: '后端供应商数据',
      loading: '加载供应商池',
      unavailable: '供应商池暂不可用',
      empty: '暂无供应商',
      noResults: '没有符合条件的供应商',
      list: '供应商列表',
      detail: '供应商详情',
      sharedPool: '集团共享供应商池',
      filter: '筛选供应商',
      keyword: '关键词',
      keywordPlaceholder: '搜索名称、服务、地区或品类',
      category: '采购品类',
      risk: '风险等级',
      status: '状态',
      allCategories: '全部品类',
      allRisks: '全部风险',
      allStatuses: '全部状态',
      clearFilters: '清空筛选',
      resultCount: '结果',
      visibleSuppliers: '当前供应商',
      totalSuppliers: '供应商总数',
      coveredCategories: '覆盖品类',
      selectedCompany: '当前公司语境',
      companyHint: '公司切换仅改变演示语境，供应商池保持集团共享',
      groupBoundary: '供应商池属于集团共享参考数据',
      companyBoundary: '采购申请、RFQ、PO、收货、发票和三单匹配仍按公司隔离',
      serviceScope: '服务范围',
      location: '地区',
      sharedScope: '共享范围',
      supplierId: '供应商编号',
      active: '启用',
      inactive: '停用',
      groupSharedValue: '集团共享',
      inspect: '查看',
    },
    purchaseRequest: {
      dataState: '真实后端数据',
      unavailable: '采购申请暂不可用',
      empty: '暂无采购申请',
      loading: '加载中',
      companySelector: '公司选择',
      list: '采购申请列表',
      detail: '申请详情',
      create: '新建采购申请',
      continueEdit: '继续编辑',
      saveDraft: '保存草稿',
      submit: '提交申请',
      requestId: '申请单号',
      title: '申请标题',
      description: '需求说明',
      requester: '申请人',
      department: '部门',
      category: '品类',
      budgetAccount: '预算科目',
      supplier: '意向供应商',
      expectedDeliveryDate: '期望交付日期',
      itemName: '物品名称',
      specification: '规格说明',
      quantity: '数量',
      unit: '单位',
      estimatedUnitPrice: '预估单价',
      totalAmount: '预计金额',
      status: '状态',
      createdAt: '创建时间',
      submittedAt: '提交时间',
      lineItems: '明细行',
      addLineItem: '新增明细',
      removeLineItem: '删除明细',
      lineSubtotal: '小计',
      draft: '草稿',
      submitted: '已提交',
      notSubmitted: '未提交',
      upstreamOnly: '已提交申请将作为后续审批流的上游记录',
      noSupplier: '暂不指定',
      currentStep: '当前节点',
      intakeStep: '申请录入',
      waitingApproval: '等待审批流',
      noApproval: '暂无审批',
      approvalStatus: '审批状态',
      currentApprover: '当前审批人',
      matchedRule: '命中规则',
      approvalPath: '审批路径',
      approvalTimeline: '审批记录',
      recentFromBackend: '后端申请数据',
      createSuccess: '草稿已保存',
      submitSuccess: '申请已提交',
      createFailed: '保存失败',
      submitFailed: '提交失败',
      discardTitle: '放弃本次编辑？',
      discardContent: '当前申请还没有保存，关闭后本次修改会丢失。',
      discardConfirm: '放弃编辑',
    },
    approval: {
      dataState: '后端审批数据',
      unavailable: '审批中心暂不可用',
      loading: '加载中',
      emptyTasks: '暂无待办',
      taskList: '待审批任务',
      detail: '审批详情',
      approver: '审批人',
      activeCompany: '当前公司',
      requestSummary: '申请摘要',
      path: '审批路径',
      context: '审批上下文',
      timeline: '审批记录',
      status: '审批状态',
      requester: '申请人',
      currentApprover: '当前审批人',
      matchedRule: '命中规则',
      startedAt: '发起时间',
      completedAt: '完成时间',
      node: '节点',
      comment: '审批意见',
      commentPlaceholder: '填写通过或驳回意见',
      approve: '通过',
      reject: '驳回',
      withdraw: '撤回',
      approveSuccess: '审批已通过',
      rejectSuccess: '已驳回审批',
      withdrawSuccess: '审批已撤回',
      actionFailed: '操作失败',
      noApprover: '暂无审批人',
      searchApprover: '搜索审批人姓名、职位或邮箱',
      discardTitle: '放弃本次审批意见？',
      discardContent: '当前审批意见还没有提交，关闭后本次输入会丢失。',
      discardConfirm: '放弃意见',
      approveDisabledReason: '当前审批人或状态不允许通过',
      rejectDisabledReason: '当前审批人或状态不允许驳回',
      withdrawDisabledReason: '当前审批已结束，不能撤回',
      actionPendingReason: '审批操作提交中',
      noDetail: '请选择审批任务',
      terminal: '已结束',
      inProgress: '审批中',
      approved: '已通过',
      rejected: '已驳回',
      withdrawn: '已撤回',
      pending: '待处理',
      active: '处理中',
      cancelled: '已取消',
      created: '发起',
      approvedAction: '通过',
      rejectedAction: '驳回',
      withdrawnAction: '撤回',
      unknown: '未知',
    },
    rfq: {
      dataState: '后端 RFQ 数据',
      unavailable: '询报价暂不可用',
      loading: '加载中',
      empty: '暂无 RFQ',
      list: 'RFQ 列表',
      detail: 'RFQ 详情',
      create: '新建 RFQ',
      createSuccess: 'RFQ 已创建',
      createFailed: '创建失败',
      quoteSuccess: '报价已保存',
      quoteFailed: '报价保存失败',
      approvedRequest: '已审批申请',
      noApprovedRequest: '暂无已通过审批的申请',
      noAvailableApprovedRequest: '暂无可新建 RFQ 的已审批申请',
      procurementUser: '采购员',
      suppliers: '候选供应商',
      invitedSuppliers: '受邀供应商',
      quoteProgress: '报价进度',
      sourceRequest: '来源申请',
      comparison: '报价对比',
      quoteEntry: '报价录入',
      quoteAmount: '报价金额',
      taxRate: '税率',
      taxAmount: '税额',
      totalAmount: '含税总额',
      deliveryDate: '交付日期',
      supplierScore: '供应商评分',
      riskNote: '风险备注',
      attachmentFile: '附件文件名',
      attachmentDescription: '附件说明',
      downloadAttachment: '下载',
      metadataOnlyReason: '仅有元数据，未上传真实文件',
      pendingUploadReason: '保存时上传后可下载',
      uploadingAttachment: '附件上传中',
      saveQuote: '保存报价',
      rank: '推荐',
      score: '评分',
      issued: '已发出',
      quoting: '报价中',
      comparisonReady: '可比价',
      noQuote: '未报价',
      noComparison: '至少两家报价后显示推荐排序',
      noPo: '在采购订单页生成 PO',
      discardTitle: '放弃本次 RFQ 编辑？',
      discardContent: '当前 RFQ 还没有保存，关闭后本次修改会丢失。',
      discardConfirm: '放弃 RFQ',
      discardDetailTitle: '放弃本次报价编辑？',
      discardDetailContent: '当前报价内容还没有保存，关闭后本次输入会丢失。',
      discardDetailConfirm: '放弃报价',
      saveQuotePendingReason: '报价保存中',
      createPendingReason: 'RFQ 创建中',
    },
    purchaseOrder: {
      dataState: '后端 PO 数据',
      unavailable: '采购订单暂不可用',
      loading: '加载中',
      empty: '暂无采购订单',
      list: '采购订单列表',
      detail: '采购订单详情',
      create: '新建采购订单',
      createSuccess: '采购订单已创建',
      createFailed: '创建失败',
      publishSuccess: '采购订单已发布',
      cancelSuccess: '采购订单已取消',
      actionFailed: '操作失败',
      eligibleRfq: '可下单 RFQ',
      selectedQuote: '选定报价',
      noEligibleRfq: '暂无可下单 RFQ',
      buyer: '采购员',
      plannedDeliveryDate: '计划交付日期',
      deliveryLocation: '交付地点',
      contactPerson: '联系人',
      contactPhone: '联系电话',
      deliveryNote: '交付备注',
      sourceRfq: '来源 RFQ',
      supplier: '供应商',
      quoteSnapshot: '报价快照',
      deliverySchedule: '交付计划',
      statusRecords: '状态记录',
      lineSnapshot: '明细快照',
      publish: '发布 PO',
      cancel: '取消 PO',
      cancelReason: '取消原因',
      cancelPlaceholder: '填写取消原因',
      draft: '草稿',
      issued: '已发布',
      cancelled: '已取消',
      createdAction: '创建',
      publishedAction: '发布',
      cancelledAction: '取消',
      noQuote: '请选择有效报价',
      noRecords: '暂无状态记录',
      downstreamBoundary: '发布后不创建收货、发票或三单匹配记录',
      discardTitle: '放弃本次 PO 编辑？',
      discardContent: '当前采购订单还没有保存，关闭后本次修改会丢失。',
      discardConfirm: '放弃 PO',
      discardDetailTitle: '放弃本次 PO 操作输入？',
      discardDetailContent: '当前详情抽屉中有未提交的取消原因，关闭后本次输入会丢失。',
      discardDetailConfirm: '放弃输入',
      publishDisabledIssuedReason: '已发布的 PO 不能再次发布',
      publishDisabledCancelledReason: '已取消的 PO 不能发布',
      publishPendingReason: 'PO 发布中',
      cancelRequiresReason: '填写取消原因后才能取消 PO',
      cancelDisabledCancelledReason: '已取消的 PO 不能重复取消',
      cancelPendingReason: 'PO 取消中',
    },
    receiptInvoice: {
      dataState: '后端履约数据',
      unavailable: '收货发票暂不可用',
      loading: '加载中',
      empty: '暂无已发布 PO',
      list: 'PO 履约列表',
      detail: '履约详情',
      receiptList: '收货单',
      invoiceList: '供应商发票',
      createReceipt: '登记收货',
      createInvoice: '登记发票',
      receiptSuccess: '收货已登记',
      invoiceSuccess: '发票已登记',
      actionFailed: '操作失败',
      orderedQuantity: '订购数量',
      receivedQuantity: '已收货',
      invoicedQuantity: '已开票',
      invoiceTotal: '发票总额',
      variance: '金额差异',
      receiptSummary: '收货状态',
      invoiceSummary: '开票状态',
      invoiceAmountStatus: '金额状态',
      sourcePo: '来源 PO',
      receiver: '收货人',
      receivedDate: '收货日期',
      registeredBy: '登记人',
      invoiceNumber: '发票号',
      invoiceDate: '发票日期',
      untaxedAmount: '未税金额',
      note: '备注',
      attachmentFile: '附件文件名',
      attachmentDescription: '附件说明',
      attachments: '附件元数据',
      lineFulfillment: '明细履约',
      notReceived: '未收货',
      partiallyReceived: '部分收货',
      fullyReceived: '已收齐',
      notInvoiced: '未开票',
      partiallyInvoiced: '部分开票',
      fullyInvoiced: '已开齐',
      matched: '金额一致',
      amountVariance: '金额偏差',
      recorded: '已记录',
      noIssuedPo: '暂无可登记的已发布 PO',
      fullyReceivedReason: '该 PO 已收齐，不能继续登记收货',
      fullyInvoicedReason: '该 PO 已开齐，不能继续登记发票',
      createPendingReason: '提交中',
      discardTitle: '放弃本次收货/发票编辑？',
      discardContent: '当前单据还没有保存，关闭后本次输入会丢失。',
      discardConfirm: '放弃输入',
      boundary: '收货和发票保存后会同步刷新三单匹配结果',
    },
    matching: {
      dataState: '后端匹配数据',
      unavailable: '三单匹配暂不可用',
      loading: '加载中',
      empty: '暂无三单匹配记录',
      list: '匹配结果',
      exceptions: '异常队列',
      resolvedList: '已处理',
      detail: '匹配详情',
      allTab: '全部',
      exceptionsTab: '异常',
      resolvedTab: '已处理',
      matched: '匹配正常',
      pendingInput: '待补齐',
      exception: '异常',
      resolved: '已关闭',
      status: '匹配状态',
      severity: '严重度',
      high: '高',
      medium: '中',
      low: '低',
      differences: '差异项',
      handlingRecords: '处理记录',
      actionNote: '处理备注',
      acknowledge: '确认异常',
      markInProgress: '标记处理中',
      resolve: '关闭异常',
      reopen: '重新打开',
      recalculate: '重新计算',
      actionSuccess: '处理记录已保存',
      recalculateSuccess: '匹配结果已刷新',
      actionFailed: '操作失败',
      noActor: '当前公司没有可用处理人',
      noteRequired: '填写处理备注后才能提交',
      exceptionOnly: '只有异常状态可以执行该操作',
      resolvedOnly: '只有已关闭异常可以重新打开',
      pendingAction: '操作提交中',
      discardTitle: '放弃本次匹配处理输入？',
      discardContent: '当前处理备注尚未提交，关闭或切换后本次输入会丢失。',
      discardConfirm: '放弃输入',
      poAmount: 'PO 金额',
      invoiceAmount: '发票金额',
      invoiceVariance: '金额差异',
      ordered: '订购',
      received: '收货',
      invoiced: '开票',
      lastCalculated: '最近计算',
      receiptSummary: '收货汇总',
      invoiceSummary: '发票汇总',
      missingReceipt: '缺收货',
      missingInvoice: '缺发票',
      receiptShort: '收货不足',
      invoiceOverReceipt: '开票超收货',
      amountMismatch: '金额不一致',
      noDifferences: '暂无差异',
      noActions: '暂无处理记录',
    },
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  },
  en: {
    brandSubtitle: 'Group procurement',
    boundaryNote: 'Group supplier pool shared; company procurement data isolated',
    aria: {
      modules: 'Procurement modules',
      search: 'Search',
      notifications: 'Notifications',
      serviceStatus: 'Service status',
      procurementMetrics: 'Procurement metrics',
    },
    header: {
      title: 'Procurement Dashboard',
      foundationTitle: 'Organization & Master Data',
      supplierPoolTitle: 'Supplier Pool',
      purchaseRequestsTitle: 'Purchase Requests',
      approvalsTitle: 'Approval Center',
      rfqTitle: 'RFQ',
      purchaseOrdersTitle: 'Purchase Orders',
      receiptInvoiceTitle: 'Receiving & Invoices',
      matchingTitle: 'Three-Way Matching',
    },
    actions: {
      newRequest: 'New Request',
      newRfq: 'New RFQ',
      newPo: 'New PO',
      newReceipt: 'Record Receipt',
      newInvoice: 'Record Invoice',
    },
    notificationCenter: {
      title: 'Notifications',
      empty: 'No notifications',
      dismiss: 'Dismiss notification',
      countLabel: 'Unread notifications',
      items: [
        {
          id: 'approval-pr-0401',
          path: '/approvals',
          title: '4 new approval tasks',
          description: 'Zhou Mingyuan has new IT purchase requests awaiting approval.',
          time: 'Just now',
          tone: 'approval',
        },
        {
          id: 'matching-po-0302',
          path: '/three-way-matching',
          title: 'Three-way match exception',
          description: 'PO-20260518-0302 invoice amount is ¥2,300 above PO.',
          time: '10 min ago',
          tone: 'warning',
        },
        {
          id: 'rfq-workstation-ready',
          path: '/rfqs',
          title: 'Workstation RFQ ready',
          description: 'Bluechip, Yunzhou, and Chengcai quotes are ready to compare.',
          time: 'Today 11:45',
          tone: 'success',
        },
      ],
    },
    ai: {
      title: 'AI Procurement Assistant',
      dataState: 'AI advice',
      draftIntent: 'Natural-language need',
      draftPlaceholder: 'Example: R&D needs 20 14-inch laptops next month, budget around 186,000',
      generateDraft: 'Generate Draft',
      reviewRisk: 'Risk Review',
      explainQuotes: 'Explain Quotes',
      explainMatching: 'Explain Exception',
      generating: 'AI is generating',
      generatingDescription: 'Generating advice, please wait',
      unavailable: 'AI assistant unavailable',
      disabledNoIntent: 'Enter a procurement need first',
      disabledNoActor: 'No available user in the current company',
      disabledNeedQuotes: 'At least two valid quotes are required',
      disabledExceptionOnly: 'Only exception matching results need AI explanation',
      result: 'AI Result',
      invocation: 'Invocation',
      model: 'Model',
      generatedAt: 'Generated',
      confidence: 'Confidence',
      riskLevel: 'Risk Level',
      businessPurpose: 'Business Purpose',
      missingFields: 'Missing Fields',
      confidenceNotes: 'Confidence Notes',
      riskItems: 'Risk Items',
      suggestedActions: 'Suggested Actions',
      followUpQuestions: 'Follow-up Questions',
      continueRecommended: 'Continue Recommended',
      keyDifferences: 'Key Differences',
      riskNotes: 'Risk Notes',
      supplierInsights: 'Supplier Insights',
      differenceInsights: 'Difference Insights',
      likelyCauses: 'Likely Causes',
      requiredFollowUpData: 'Required Follow-up Data',
      noAiResult: 'No AI result yet',
    },
    status: {
      backend: 'Backend',
    },
    userMenu: {
      openMenu: 'Open user menu',
      name: 'Wang Ran',
      role: 'Procurement Manager',
      email: 'wang.ran@xinghe.com',
      language: 'Language',
      chinese: '中文',
      english: 'English',
      resetDemoData: 'Reset demo data',
      resetDemoDataRunning: 'Resetting demo data',
      resetDemoDataTitle: 'Reset demo data?',
      resetDemoDataDescription: 'This clears current requests, approvals, RFQs, POs, receipts, invoices, and matching results, then rebuilds the built-in seed data.',
      resetDemoDataConfirm: 'Reset data',
      resetDemoDataSuccess: 'Demo data restored',
      resetDemoDataFailure: 'Failed to reset demo data',
      logout: 'Log out',
    },
    panels: {
      spendTrend: 'Spend Trend',
      companyView: 'Company View',
      recentRequests: 'Recent Requests',
      procurementFlow: 'Procurement Flow',
      risks: 'Risks & Tasks',
      today: 'Today',
      dataBoundary: 'Data Boundary',
      skeletonRule: 'Skeleton Rule',
    },
    table: {
      request: 'Request',
      category: 'Category',
      company: 'Company',
      amount: 'Amount',
      currentStep: 'Current Step',
      status: 'Status',
    },
    navItems: [
      { label: 'Dashboard', icon: <DashboardOutlined />, path: '/' },
      { label: 'Requests', icon: <FileAddOutlined />, path: '/purchase-requests' },
      { label: 'Approvals', icon: <AuditOutlined />, path: '/approvals' },
      { label: 'RFQ', icon: <FileSearchOutlined />, path: '/rfqs' },
      { label: 'Purchase Orders', icon: <ShoppingCartOutlined />, path: '/purchase-orders' },
      { label: 'Receiving & Invoices', icon: <InboxOutlined />, path: '/receipts-invoices' },
      { label: '3-Way Match', icon: <SwapOutlined />, path: '/three-way-matching' },
      { label: 'Supplier Pool', icon: <TeamOutlined />, path: '/suppliers' },
      { label: 'Master Data', icon: <DatabaseOutlined />, path: '/master-data' },
    ],
    kpis: [
      {
        label: 'Monthly Spend',
        value: '¥4.286M',
        note: '+12.4% vs last month',
        icon: <ShoppingCartOutlined />,
      },
      {
        label: 'Pending Approval',
        value: '27',
        note: '5 high-priority items',
        icon: <AuditOutlined />,
        tone: 'warn',
      },
      {
        label: 'Active RFQs',
        value: '14',
        note: 'Avg. 2.8 quotes',
        icon: <FileSearchOutlined />,
      },
      {
        label: 'Match Exceptions',
        value: '3',
        note: 'Difference ¥2,300',
        icon: <AlertOutlined />,
        tone: 'danger',
      },
    ],
    purchaseRows: [
      {
        id: 'PR-2026-0518-021',
        category: 'Laptop Computers',
        company: 'Xinghe Digital',
        amount: '¥186,000',
        node: 'Finance Approval',
        status: 'In Approval',
        tone: 'warn',
      },
      {
        id: 'PR-2026-0518-014',
        category: 'Equipment Parts',
        company: 'Xinghe Manufacturing',
        amount: '¥72,400',
        node: 'Production Owner',
        status: 'Pending',
        tone: 'neutral',
      },
      {
        id: 'PR-2026-0517-033',
        category: 'Software Subscription',
        company: 'Xinghe Digital',
        amount: '¥38,000',
        node: 'Buyer RFQ',
        status: 'RFQ',
        tone: 'success',
      },
      {
        id: 'PR-2026-0516-009',
        category: 'Logistics Service',
        company: 'Xinghe Manufacturing',
        amount: '¥24,800',
        node: '3-Way Match',
        status: 'Exception',
        tone: 'danger',
      },
    ],
    flowStages: [
      { title: 'Submit Request', description: 'Draft, submit, budget account', count: '' },
      { title: 'Approval Routing', description: 'Company, amount, category rules', count: '', tone: 'warn' },
      { title: 'RFQ Comparison', description: 'Supplier pool, quote scoring', count: '' },
      { title: 'Order to Invoice', description: 'PO, receiving, invoice, match', count: '', tone: 'danger' },
    ],
    riskItems: [
      { title: 'Invoice Amount Variance', detail: 'PO-2026-088 invoice over by ¥2,300', tone: 'danger' },
      { title: 'Approval Nearing SLA', detail: 'Equipment part request has waited 21 hours', tone: 'warn' },
      { title: 'Supplier Rating Dropped', detail: 'Lanxin Electronics delivery score -6.2', tone: 'neutral' },
    ],
    riskAction: {
      danger: 'Exception',
      review: 'Review',
    },
    boundary: {
      groupShared: 'Group Shared',
      companyIsolated: 'Company Isolated',
    },
    dashboard: {
      dataState: 'Backend dashboard data',
      scope: 'Dashboard Scope',
      groupScope: 'Group Summary',
      loading: 'Loading procurement dashboard',
      unavailable: 'Procurement dashboard is unavailable',
      empty: 'No data',
      spendTrend: 'Spend Trend',
      documentFunnel: 'Procurement Funnel',
      statusDistribution: 'Status Distribution',
      supplierDistribution: 'Supplier Distribution',
      exceptionHighlights: 'Match Exception Highlights',
      noExceptions: 'No three-way matching exceptions',
      noTrend: 'No spend trend data',
      noFunnel: 'No funnel data',
      noStatus: 'No status distribution',
      noSuppliers: 'No supplier distribution',
      viewMatching: 'View Matching',
      generatedAt: 'Generated',
      documentCount: 'Documents',
      issuedPoAmount: 'Issued PO Amount',
      pendingApprovals: 'Pending Approvals',
      activeRfqs: 'Active RFQs',
      issuedPurchaseOrders: 'Issued POs',
      receiptInvoiceFollowUp: 'Receipt/Invoice Follow-up',
      matchingExceptions: 'Match Exceptions',
      quotes: 'Quotes',
      issuedPoCount: 'POs',
      company: 'Company',
      supplier: 'Supplier',
      severity: 'Severity',
      invoiceVariance: 'Invoice Variance',
      lastCalculated: 'Last Calculated',
    },
    foundation: {
      dataState: 'Backend master data',
      loading: 'Loading',
      unavailable: 'Master data unavailable',
      groupContext: 'Group & Company Context',
      companySelector: 'Company Selector',
      supplierPool: 'Group Shared Supplier Pool',
      categories: 'Procurement Categories',
      departmentsUsers: 'Departments & User Roles',
      budgetAccounts: 'Budget Accounts',
      companyScoped: 'Company Data',
      selectedCompany: 'Selected Company',
      serviceScope: 'Service Scope',
      location: 'Location',
      status: 'Status',
      risk: 'Risk',
      category: 'Category',
      department: 'Department',
      user: 'User',
      role: 'Role',
      account: 'Account',
      annualBudget: 'Annual Budget',
      availableBudget: 'Available',
      active: 'Active',
      inactive: 'Inactive',
      groupLevel: 'Group Level',
      shared: 'Shared',
    },
    supplierPool: {
      dataState: 'Backend supplier data',
      loading: 'Loading supplier pool',
      unavailable: 'Supplier pool unavailable',
      empty: 'No suppliers',
      noResults: 'No suppliers match the filters',
      list: 'Supplier List',
      detail: 'Supplier Detail',
      sharedPool: 'Group Shared Supplier Pool',
      filter: 'Filter Suppliers',
      keyword: 'Keyword',
      keywordPlaceholder: 'Search name, service, location, or category',
      category: 'Procurement Category',
      risk: 'Risk Level',
      status: 'Status',
      allCategories: 'All Categories',
      allRisks: 'All Risks',
      allStatuses: 'All Statuses',
      clearFilters: 'Clear Filters',
      resultCount: 'Results',
      visibleSuppliers: 'Visible Suppliers',
      totalSuppliers: 'Total Suppliers',
      coveredCategories: 'Covered Categories',
      selectedCompany: 'Current Company Context',
      companyHint: 'Company switching changes context only; the supplier pool stays group shared',
      groupBoundary: 'Supplier pool is group shared reference data',
      companyBoundary: 'Requests, RFQs, POs, receipts, invoices, and matching remain company isolated',
      serviceScope: 'Service Scope',
      location: 'Location',
      sharedScope: 'Shared Scope',
      supplierId: 'Supplier ID',
      active: 'Active',
      inactive: 'Inactive',
      groupSharedValue: 'Group Shared',
      inspect: 'View',
    },
    purchaseRequest: {
      dataState: 'Backend data',
      unavailable: 'Purchase requests unavailable',
      empty: 'No purchase requests',
      loading: 'Loading',
      companySelector: 'Company selector',
      list: 'Purchase Request List',
      detail: 'Request Detail',
      create: 'New Purchase Request',
      continueEdit: 'Continue Editing',
      saveDraft: 'Save Draft',
      submit: 'Submit',
      requestId: 'Request ID',
      title: 'Title',
      description: 'Need Description',
      requester: 'Requester',
      department: 'Department',
      category: 'Category',
      budgetAccount: 'Budget Account',
      supplier: 'Preferred Supplier',
      expectedDeliveryDate: 'Expected Delivery',
      itemName: 'Item',
      specification: 'Specification',
      quantity: 'Quantity',
      unit: 'Unit',
      estimatedUnitPrice: 'Unit Price',
      totalAmount: 'Estimated Amount',
      status: 'Status',
      createdAt: 'Created',
      submittedAt: 'Submitted',
      lineItems: 'Line Items',
      addLineItem: 'Add Line',
      removeLineItem: 'Remove Line',
      lineSubtotal: 'Subtotal',
      draft: 'Draft',
      submitted: 'Submitted',
      notSubmitted: 'Not submitted',
      upstreamOnly: 'Submitted requests become upstream records for the later approval flow',
      noSupplier: 'No supplier',
      currentStep: 'Current Step',
      intakeStep: 'Request Intake',
      waitingApproval: 'Waiting for approval flow',
      noApproval: 'No approval',
      approvalStatus: 'Approval Status',
      currentApprover: 'Current Approver',
      matchedRule: 'Matched Rule',
      approvalPath: 'Approval Path',
      approvalTimeline: 'Approval Timeline',
      recentFromBackend: 'Backend request data',
      createSuccess: 'Draft saved',
      submitSuccess: 'Request submitted',
      createFailed: 'Save failed',
      submitFailed: 'Submit failed',
      discardTitle: 'Discard edits?',
      discardContent: 'This request has unsaved changes. Closing will discard your edits.',
      discardConfirm: 'Discard',
    },
    approval: {
      dataState: 'Backend approvals',
      unavailable: 'Approval center unavailable',
      loading: 'Loading',
      emptyTasks: 'No active tasks',
      taskList: 'Approval Tasks',
      detail: 'Approval Detail',
      approver: 'Approver',
      activeCompany: 'Active Company',
      requestSummary: 'Request Summary',
      path: 'Approval Path',
      context: 'Approval Context',
      timeline: 'Timeline',
      status: 'Approval Status',
      requester: 'Requester',
      currentApprover: 'Current Approver',
      matchedRule: 'Matched Rule',
      startedAt: 'Started',
      completedAt: 'Completed',
      node: 'Node',
      comment: 'Comment',
      commentPlaceholder: 'Add approval or rejection comments',
      approve: 'Approve',
      reject: 'Reject',
      withdraw: 'Withdraw',
      approveSuccess: 'Approval advanced',
      rejectSuccess: 'Approval rejected',
      withdrawSuccess: 'Approval withdrawn',
      actionFailed: 'Action failed',
      noApprover: 'No approver',
      searchApprover: 'Search approver by name, title, or email',
      discardTitle: 'Discard approval comment?',
      discardContent: 'This approval comment has not been submitted. Closing will discard it.',
      discardConfirm: 'Discard comment',
      approveDisabledReason: 'Current approver or status cannot approve',
      rejectDisabledReason: 'Current approver or status cannot reject',
      withdrawDisabledReason: 'This approval is closed and cannot be withdrawn',
      actionPendingReason: 'Approval action is submitting',
      noDetail: 'Select an approval task',
      terminal: 'Closed',
      inProgress: 'In Progress',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
      pending: 'Pending',
      active: 'Active',
      cancelled: 'Cancelled',
      created: 'Created',
      approvedAction: 'Approved',
      rejectedAction: 'Rejected',
      withdrawnAction: 'Withdrawn',
      unknown: 'Unknown',
    },
    rfq: {
      dataState: 'Backend RFQs',
      unavailable: 'RFQs unavailable',
      loading: 'Loading',
      empty: 'No RFQs',
      list: 'RFQ List',
      detail: 'RFQ Detail',
      create: 'New RFQ',
      createSuccess: 'RFQ created',
      createFailed: 'Create failed',
      quoteSuccess: 'Quote saved',
      quoteFailed: 'Quote failed',
      approvedRequest: 'Approved Request',
      noApprovedRequest: 'No approved requests',
      noAvailableApprovedRequest: 'No approved requests available for a new RFQ',
      procurementUser: 'Buyer',
      suppliers: 'Candidate Suppliers',
      invitedSuppliers: 'Invited Suppliers',
      quoteProgress: 'Quote Progress',
      sourceRequest: 'Source Request',
      comparison: 'Quote Comparison',
      quoteEntry: 'Quote Entry',
      quoteAmount: 'Quote Amount',
      taxRate: 'Tax Rate',
      taxAmount: 'Tax Amount',
      totalAmount: 'Tax-Inclusive Total',
      deliveryDate: 'Delivery Date',
      supplierScore: 'Supplier Score',
      riskNote: 'Risk Note',
      attachmentFile: 'Attachment File',
      attachmentDescription: 'Attachment Note',
      downloadAttachment: 'Download',
      metadataOnlyReason: 'Metadata only; no uploaded file',
      pendingUploadReason: 'Upload on save before download',
      uploadingAttachment: 'Uploading attachment',
      saveQuote: 'Save Quote',
      rank: 'Rank',
      score: 'Score',
      issued: 'Issued',
      quoting: 'Quoting',
      comparisonReady: 'Comparison Ready',
      noQuote: 'No quote',
      noComparison: 'At least two quotes are needed for ranking',
      noPo: 'Create PO in Purchase Orders',
      discardTitle: 'Discard RFQ edits?',
      discardContent: 'This RFQ has not been saved. Closing will discard it.',
      discardConfirm: 'Discard RFQ',
      discardDetailTitle: 'Discard quote edits?',
      discardDetailContent: 'This quote has unsaved changes. Closing will discard your input.',
      discardDetailConfirm: 'Discard quote',
      saveQuotePendingReason: 'Saving quote',
      createPendingReason: 'Creating RFQ',
    },
    purchaseOrder: {
      dataState: 'Backend POs',
      unavailable: 'Purchase orders unavailable',
      loading: 'Loading',
      empty: 'No purchase orders',
      list: 'Purchase Order List',
      detail: 'Purchase Order Detail',
      create: 'New Purchase Order',
      createSuccess: 'Purchase order created',
      createFailed: 'Create failed',
      publishSuccess: 'Purchase order issued',
      cancelSuccess: 'Purchase order cancelled',
      actionFailed: 'Action failed',
      eligibleRfq: 'Eligible RFQ',
      selectedQuote: 'Selected Quote',
      noEligibleRfq: 'No eligible RFQs',
      buyer: 'Buyer',
      plannedDeliveryDate: 'Planned Delivery',
      deliveryLocation: 'Delivery Location',
      contactPerson: 'Contact Person',
      contactPhone: 'Contact Phone',
      deliveryNote: 'Delivery Note',
      sourceRfq: 'Source RFQ',
      supplier: 'Supplier',
      quoteSnapshot: 'Quote Snapshot',
      deliverySchedule: 'Delivery Schedule',
      statusRecords: 'Status Records',
      lineSnapshot: 'Line Snapshot',
      publish: 'Issue PO',
      cancel: 'Cancel PO',
      cancelReason: 'Cancellation Reason',
      cancelPlaceholder: 'Enter cancellation reason',
      draft: 'Draft',
      issued: 'Issued',
      cancelled: 'Cancelled',
      createdAction: 'Created',
      publishedAction: 'Issued',
      cancelledAction: 'Cancelled',
      noQuote: 'Select a valid quote',
      noRecords: 'No status records',
      downstreamBoundary: 'Issuing does not create receipts, invoices, or matching records',
      discardTitle: 'Discard PO edits?',
      discardContent: 'This purchase order has not been saved. Closing will discard your edits.',
      discardConfirm: 'Discard PO',
      discardDetailTitle: 'Discard PO action input?',
      discardDetailContent: 'The detail drawer has an unsubmitted cancellation reason. Closing will discard it.',
      discardDetailConfirm: 'Discard input',
      publishDisabledIssuedReason: 'Issued POs cannot be issued again',
      publishDisabledCancelledReason: 'Cancelled P.O.s cannot be issued',
      publishPendingReason: 'Issuing PO',
      cancelRequiresReason: 'Enter a cancellation reason before cancelling',
      cancelDisabledCancelledReason: 'Cancelled POs cannot be cancelled again',
      cancelPendingReason: 'Cancelling PO',
    },
    receiptInvoice: {
      dataState: 'Backend fulfillment data',
      unavailable: 'Receiving and invoices unavailable',
      loading: 'Loading',
      empty: 'No issued POs',
      list: 'PO Fulfillment List',
      detail: 'Fulfillment Detail',
      receiptList: 'Receipts',
      invoiceList: 'Supplier Invoices',
      createReceipt: 'Record Receipt',
      createInvoice: 'Record Invoice',
      receiptSuccess: 'Receipt recorded',
      invoiceSuccess: 'Invoice recorded',
      actionFailed: 'Action failed',
      orderedQuantity: 'Ordered',
      receivedQuantity: 'Received',
      invoicedQuantity: 'Invoiced',
      invoiceTotal: 'Invoice Total',
      variance: 'Variance',
      receiptSummary: 'Receipt Status',
      invoiceSummary: 'Invoice Status',
      invoiceAmountStatus: 'Amount Status',
      sourcePo: 'Source PO',
      receiver: 'Receiver',
      receivedDate: 'Received Date',
      registeredBy: 'Registered By',
      invoiceNumber: 'Invoice No.',
      invoiceDate: 'Invoice Date',
      untaxedAmount: 'Untaxed Amount',
      note: 'Note',
      attachmentFile: 'Attachment File',
      attachmentDescription: 'Attachment Description',
      attachments: 'Attachment Metadata',
      lineFulfillment: 'Line Fulfillment',
      notReceived: 'Not received',
      partiallyReceived: 'Partially received',
      fullyReceived: 'Fully received',
      notInvoiced: 'Not invoiced',
      partiallyInvoiced: 'Partially invoiced',
      fullyInvoiced: 'Fully invoiced',
      matched: 'Matched',
      amountVariance: 'Variance',
      recorded: 'Recorded',
      noIssuedPo: 'No issued PO available',
      fullyReceivedReason: 'This PO is fully received',
      fullyInvoicedReason: 'This PO is fully invoiced',
      createPendingReason: 'Submitting',
      discardTitle: 'Discard receiving/invoice edits?',
      discardContent: 'This document has not been saved. Closing will discard your input.',
      discardConfirm: 'Discard input',
      boundary: 'Saving receipts or invoices refreshes three-way matching synchronously',
    },
    matching: {
      dataState: 'Backend matching data',
      unavailable: 'Three-way matching unavailable',
      loading: 'Loading',
      empty: 'No matching records',
      list: 'Matching Results',
      exceptions: 'Exception Queue',
      resolvedList: 'Resolved',
      detail: 'Matching Detail',
      allTab: 'All',
      exceptionsTab: 'Exceptions',
      resolvedTab: 'Resolved',
      matched: 'Matched',
      pendingInput: 'Pending Input',
      exception: 'Exception',
      resolved: 'Resolved',
      status: 'Status',
      severity: 'Severity',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      differences: 'Differences',
      handlingRecords: 'Handling Records',
      actionNote: 'Handling Note',
      acknowledge: 'Acknowledge',
      markInProgress: 'Mark In Progress',
      resolve: 'Resolve',
      reopen: 'Reopen',
      recalculate: 'Recalculate',
      actionSuccess: 'Handling record saved',
      recalculateSuccess: 'Matching result refreshed',
      actionFailed: 'Action failed',
      noActor: 'No available actor for this company',
      noteRequired: 'Enter a handling note first',
      exceptionOnly: 'Only exception results allow this action',
      resolvedOnly: 'Only resolved exceptions can be reopened',
      pendingAction: 'Submitting',
      discardTitle: 'Discard matching action input?',
      discardContent: 'The handling note has not been submitted. Closing or switching rows will discard it.',
      discardConfirm: 'Discard input',
      poAmount: 'PO Amount',
      invoiceAmount: 'Invoice Amount',
      invoiceVariance: 'Variance',
      ordered: 'Ordered',
      received: 'Received',
      invoiced: 'Invoiced',
      lastCalculated: 'Last Calculated',
      receiptSummary: 'Receipt Summary',
      invoiceSummary: 'Invoice Summary',
      missingReceipt: 'Missing Receipt',
      missingInvoice: 'Missing Invoice',
      receiptShort: 'Receipt Short',
      invoiceOverReceipt: 'Invoice Over Receipt',
      amountMismatch: 'Amount Mismatch',
      noDifferences: 'No differences',
      noActions: 'No handling records',
    },
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
} as const

type LocalizedMessages = (typeof localizedContent)[Language]
type NotificationItem = LocalizedMessages['notificationCenter']['items'][number]

const englishContext = {
  groupName: 'Xinghe Holdings Group',
  supplierPoolScope: 'Group Shared Supplier Pool',
  companyNames: {
    'company-digital': 'Xinghe Digital Technology Co., Ltd.',
    'company-manufacturing': 'Xinghe Intelligent Manufacturing Co., Ltd.',
  },
  companyScopes: {
    'company-digital': 'IT equipment, software subscriptions, office procurement',
    'company-manufacturing': 'Production consumables, equipment spare parts, logistics services',
  },
  dataBoundary: {
    groupShared: 'Supplier pool, category templates, group-level dashboard summaries',
    companyIsolated: 'Requests, approvals, RFQs, POs, receiving, invoices, and matching results',
  },
} as const

function localizeContext(context: DemoContext, language: Language): DemoContext {
  if (language === 'zh') {
    return context
  }

  const companies = context.companies.map((company) => ({
    ...company,
    companyName:
      englishContext.companyNames[company.companyId as keyof typeof englishContext.companyNames] ??
      company.companyName,
    businessScope:
      englishContext.companyScopes[company.companyId as keyof typeof englishContext.companyScopes] ??
      company.businessScope,
  }))
  const activeCompany =
    companies.find((company) => company.companyId === context.activeCompany.companyId) ??
    companies[0] ??
    context.activeCompany

  return {
    ...context,
    groupName: englishContext.groupName,
    activeCompany,
    companies,
    supplierPoolScope: englishContext.supplierPoolScope,
    dataBoundary: englishContext.dataBoundary,
  }
}

function getInitialLanguage(): Language {
  return new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'zh'
}

function Workspace({
  language,
  onLanguageChange,
}: {
  language: Language
  onLanguageChange: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isFoundationRoute = location.pathname === '/master-data'
  const isSupplierPoolRoute = location.pathname === '/suppliers'
  const isPurchaseRequestRoute = location.pathname === '/purchase-requests'
  const isApprovalRoute = location.pathname === '/approvals'
  const isRfqRoute = location.pathname === '/rfqs'
  const isPurchaseOrderRoute = location.pathname === '/purchase-orders'
  const isReceiptInvoiceRoute = location.pathname === '/receipts-invoices'
  const isThreeWayMatchingRoute = location.pathname === '/three-way-matching'
  const isDashboardRoute =
    !isFoundationRoute &&
    !isSupplierPoolRoute &&
    !isPurchaseRequestRoute &&
    !isApprovalRoute &&
    !isRfqRoute &&
    !isPurchaseOrderRoute &&
    !isReceiptInvoiceRoute &&
    !isThreeWayMatchingRoute
  const [isCreateDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [isRfqCreateDrawerOpen, setRfqCreateDrawerOpen] = useState(false)
  const [isPoCreateDrawerOpen, setPoCreateDrawerOpen] = useState(false)
  const [receiptInvoiceCreateMode, setReceiptInvoiceCreateMode] = useState<ReceiptInvoiceCreateMode | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState(demoContext.activeCompany.companyId)
  const [dashboardScopeValue, setDashboardScopeValue] = useState<ProcurementDashboardScopeValue>('GROUP')
  const [isNotificationOpen, setNotificationOpen] = useState(false)
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([])
  const [modal, modalContextHolder] = Modal.useModal()
  const resetDemoDataMutation = useMutation({
    mutationFn: resetDemoData,
  })
  const { data, isError, isLoading } = useQuery({
    queryKey: ['backend-health'],
    queryFn: fetchHealth,
    retry: 1,
  })
  const masterContextQuery = useQuery({
    queryKey: ['master-data', 'context'],
    queryFn: fetchMasterDataContext,
    retry: 1,
  })
  const companiesQuery = useQuery({
    queryKey: ['master-data', 'companies'],
    queryFn: fetchCompanies,
    retry: 1,
  })
  const departmentsQuery = useQuery({
    queryKey: ['master-data', 'departments', selectedCompanyId],
    queryFn: () => fetchDepartments(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const usersQuery = useQuery({
    queryKey: ['master-data', 'users', selectedCompanyId],
    queryFn: () => fetchUsers(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const suppliersQuery = useQuery({
    queryKey: ['master-data', 'suppliers'],
    queryFn: fetchSuppliers,
    retry: 1,
  })
  const categoriesQuery = useQuery({
    queryKey: ['master-data', 'categories'],
    queryFn: fetchCategories,
    retry: 1,
  })
  const budgetAccountsQuery = useQuery({
    queryKey: ['master-data', 'budget-accounts', selectedCompanyId],
    queryFn: () => fetchBudgetAccounts(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const purchaseRequestsQuery = useQuery({
    queryKey: ['purchase-requests', selectedCompanyId],
    queryFn: () => fetchPurchaseRequests(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const rfqsQuery = useQuery({
    queryKey: ['rfqs', selectedCompanyId],
    queryFn: () => fetchRfqs(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const purchaseOrdersQuery = useQuery({
    queryKey: ['purchase-orders', selectedCompanyId],
    queryFn: () => fetchPurchaseOrders(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const fulfillmentPurchaseOrdersQuery = useQuery({
    queryKey: ['receipts-invoices', 'purchase-orders', selectedCompanyId],
    queryFn: () => fetchFulfillmentPurchaseOrders(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const threeWayMatchesQuery = useQuery({
    queryKey: ['three-way-matching', selectedCompanyId],
    queryFn: () => fetchThreeWayMatches(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const dashboardScope: ProcurementDashboardScope = dashboardScopeValue === 'GROUP' ? 'GROUP' : 'COMPANY'
  const dashboardCompanyId = dashboardScope === 'COMPANY' ? dashboardScopeValue : undefined
  const procurementDashboardQuery = useQuery({
    queryKey: ['procurement-dashboard', dashboardScope, dashboardCompanyId],
    queryFn: () => fetchProcurementDashboard(dashboardScope, dashboardCompanyId),
    enabled: isDashboardRoute,
    retry: 1,
  })

  const messages = localizedContent[language]
  const visibleNotifications = messages.notificationCenter.items.filter(
    (notification) => !dismissedNotificationIds.includes(notification.id),
  )
  const rawContext = masterContextQuery.data?.data ?? data?.data.demoContext ?? demoContext
  const context = localizeContext(rawContext, language)
  const companies = localizeContext(
    {
      ...rawContext,
      companies: companiesQuery.data?.data ?? rawContext.companies,
    },
    language,
  ).companies
  const selectedCompany = companies.find((company) => company.companyId === selectedCompanyId) ?? context.activeCompany
  const healthStatus = data?.data.status ?? (isLoading ? 'CHECKING' : 'OFFLINE')
  const purchaseRequests = purchaseRequestsQuery.data?.data ?? []
  const suppliers = suppliersQuery.data?.data ?? []
  const categories = categoriesQuery.data?.data ?? []
  const departments = departmentsQuery.data?.data ?? []
  const users = usersQuery.data?.data ?? []
  const budgetAccounts = budgetAccountsQuery.data?.data ?? []
  const rfqs = rfqsQuery.data?.data ?? []
  const purchaseOrders = purchaseOrdersQuery.data?.data ?? []
  const fulfillmentPurchaseOrders = fulfillmentPurchaseOrdersQuery.data?.data ?? []
  const threeWayMatches = threeWayMatchesQuery.data?.data ?? []
  const activeApprovalCount = purchaseRequests.filter((request) => request.approval?.status === 'IN_PROGRESS').length
  const masterDataCount =
    companies.length +
    departments.length +
    users.length +
    suppliers.length +
    categories.length +
    budgetAccounts.length
  const dashboardNavCount =
    purchaseRequests.length +
    rfqs.length +
    purchaseOrders.length +
    fulfillmentPurchaseOrders.length +
    threeWayMatches.length
  const navCounts = new Map<string, number>([
    ['/', dashboardNavCount],
    ['/purchase-requests', purchaseRequests.length],
    ['/approvals', activeApprovalCount],
    ['/rfqs', rfqs.length],
    ['/purchase-orders', purchaseOrders.length],
    ['/receipts-invoices', fulfillmentPurchaseOrders.length],
    ['/three-way-matching', threeWayMatches.length],
    ['/suppliers', suppliers.length],
    ['/master-data', masterDataCount],
  ])
  const foundationLoading =
    masterContextQuery.isLoading ||
    companiesQuery.isLoading ||
    suppliersQuery.isLoading ||
    categoriesQuery.isLoading ||
    departmentsQuery.isLoading ||
    usersQuery.isLoading ||
    budgetAccountsQuery.isLoading
  const supplierPoolLoading =
    masterContextQuery.isLoading ||
    companiesQuery.isLoading ||
    suppliersQuery.isLoading ||
    categoriesQuery.isLoading
  const foundationError =
    masterContextQuery.isError ||
    companiesQuery.isError ||
    suppliersQuery.isError ||
    categoriesQuery.isError ||
    departmentsQuery.isError ||
    usersQuery.isError ||
    budgetAccountsQuery.isError
  const supplierPoolError =
    masterContextQuery.isError ||
    companiesQuery.isError ||
    suppliersQuery.isError ||
    categoriesQuery.isError
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <div className="user-menu-profile">
          <strong>{messages.userMenu.name}</strong>
          <span>{messages.userMenu.role}</span>
          <small>{messages.userMenu.email}</small>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'language',
      icon: <TranslationOutlined />,
      label: messages.userMenu.language,
      children: [
        {
          key: 'language:zh',
          label: messages.userMenu.chinese,
          disabled: language === 'zh',
        },
        {
          key: 'language:en',
          label: messages.userMenu.english,
          disabled: language === 'en',
        },
      ],
    },
    {
      key: 'reset-demo-data',
      icon: resetDemoDataMutation.isPending ? <LoadingOutlined /> : <ReloadOutlined />,
      label: resetDemoDataMutation.isPending
        ? messages.userMenu.resetDemoDataRunning
        : messages.userMenu.resetDemoData,
      disabled: resetDemoDataMutation.isPending,
      danger: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: messages.userMenu.logout,
      danger: true,
    },
  ]

  const confirmDemoDataReset = () => {
    modal.confirm({
      title: messages.userMenu.resetDemoDataTitle,
      content: messages.userMenu.resetDemoDataDescription,
      okText: messages.userMenu.resetDemoDataConfirm,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await resetDemoDataMutation.mutateAsync()
          setCreateDrawerOpen(false)
          setRfqCreateDrawerOpen(false)
          setPoCreateDrawerOpen(false)
          setReceiptInvoiceCreateMode(null)
          setDismissedNotificationIds([])
          setNotificationOpen(false)
          navigate('/', { replace: true })
          await queryClient.invalidateQueries()
          modal.success({
            title: messages.userMenu.resetDemoDataSuccess,
            content: `${messages.userMenu.resetDemoDataSuccess} · v${response.data.schemaVersion}`,
          })
        } catch (error) {
          modal.error({
            title: messages.userMenu.resetDemoDataFailure,
            content: error instanceof Error ? error.message : messages.userMenu.resetDemoDataFailure,
          })
          throw error
        }
      },
    })
  }

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'language:zh' && language !== 'zh') {
      onLanguageChange()
    }

    if (key === 'language:en' && language !== 'en') {
      onLanguageChange()
    }

    if (key === 'reset-demo-data') {
      confirmDemoDataReset()
    }
  }

  const handleNewRequestClick = () => {
    if (isReceiptInvoiceRoute) {
      setReceiptInvoiceCreateMode('receipt')
      return
    }

    if (isPurchaseOrderRoute) {
      setPoCreateDrawerOpen(true)
      return
    }

    if (isRfqRoute) {
      setRfqCreateDrawerOpen(true)
      return
    }

    if (isPurchaseRequestRoute) {
      setCreateDrawerOpen(true)
      return
    }

    navigate('/purchase-requests?new=1')
  }

  useEffect(() => {
    if (companies.length === 0) {
      return
    }

    if (!companies.some((company) => company.companyId === selectedCompanyId)) {
      setSelectedCompanyId(context.activeCompany.companyId)
    }
  }, [companies, context.activeCompany.companyId, selectedCompanyId])

  useEffect(() => {
    if (dashboardScopeValue === 'GROUP' || companies.length === 0) {
      return
    }

    if (!companies.some((company) => company.companyId === dashboardScopeValue)) {
      setDashboardScopeValue('GROUP')
    }
  }, [companies, dashboardScopeValue])

  useEffect(() => {
    if (!isPurchaseRequestRoute) {
      return
    }

    if (new URLSearchParams(location.search).get('new') === '1') {
      setCreateDrawerOpen(true)
      navigate('/purchase-requests', { replace: true })
    }
  }, [isPurchaseRequestRoute, location.search, navigate])

  useEffect(() => {
    if (!isRfqRoute) {
      return
    }

    if (new URLSearchParams(location.search).get('new') === '1') {
      setRfqCreateDrawerOpen(true)
      navigate('/rfqs', { replace: true })
    }
  }, [isRfqRoute, location.search, navigate])

  useEffect(() => {
    if (!isPurchaseOrderRoute) {
      return
    }

    if (new URLSearchParams(location.search).get('new') === '1') {
      setPoCreateDrawerOpen(true)
      navigate('/purchase-orders', { replace: true })
    }
  }, [isPurchaseOrderRoute, location.search, navigate])

  useEffect(() => {
    if (!isReceiptInvoiceRoute) {
      return
    }

    const requestedMode = new URLSearchParams(location.search).get('new')
    if (requestedMode === 'receipt' || requestedMode === 'invoice') {
      setReceiptInvoiceCreateMode(requestedMode)
      navigate('/receipts-invoices', { replace: true })
    }
  }, [isReceiptInvoiceRoute, location.search, navigate])

  const primaryActionIcon = isReceiptInvoiceRoute
    ? <InboxOutlined />
    : isPurchaseOrderRoute
      ? <ShoppingCartOutlined />
      : isRfqRoute
        ? <FileSearchOutlined />
        : <FileAddOutlined />
  const primaryActionLabel = isReceiptInvoiceRoute
    ? messages.actions.newReceipt
    : isPurchaseOrderRoute
    ? messages.actions.newPo
    : isRfqRoute
      ? messages.actions.newRfq
      : messages.actions.newRequest
  const dismissNotification = (notificationId: string) => {
    setDismissedNotificationIds((current) =>
      current.includes(notificationId) ? current : [...current, notificationId],
    )
  }

  const openNotificationTarget = (notification: NotificationItem) => {
    setNotificationOpen(false)
    navigate(notification.path)
  }

  return (
    <>
      {modalContextHolder}
      <Layout className="app-shell">
      <Sider className="sidebar" width={244}>
        <div className="brand">
          <div className="brand-icon">
            <ProcureflowMark />
          </div>
          <div>
            <strong>Fox Procureflow</strong>
            <span>{messages.brandSubtitle}</span>
          </div>
        </div>

        <div className="company-card">
          <BankOutlined />
          <div>
            <strong>{context.activeCompany.companyName}</strong>
            <span>{context.groupName}</span>
          </div>
        </div>

        <nav className="nav-list" aria-label={messages.aria.modules}>
          {messages.navItems.map((item) => {
            const count = navCounts.get(item.path) ?? 0

            return (
              <NavLink
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                end={item.path === '/'}
                key={item.label}
                to={item.path}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                <strong aria-label={`${item.label} ${count}`}>{count}</strong>
              </NavLink>
            )
          })}
        </nav>

        <div className="boundary-note">
          <DatabaseOutlined />
          <span>{messages.boundaryNote}</span>
        </div>
      </Sider>

      <Layout className="main-layout">
        <Header className="topbar">
          <div>
            <h1>
              {isFoundationRoute
                ? messages.header.foundationTitle
                : isSupplierPoolRoute
                  ? messages.header.supplierPoolTitle
                : isPurchaseRequestRoute
                  ? messages.header.purchaseRequestsTitle
                  : isApprovalRoute
                    ? messages.header.approvalsTitle
                  : isRfqRoute
                      ? messages.header.rfqTitle
                      : isPurchaseOrderRoute
                        ? messages.header.purchaseOrdersTitle
                        : isReceiptInvoiceRoute
                          ? messages.header.receiptInvoiceTitle
                          : isThreeWayMatchingRoute
                            ? messages.header.matchingTitle
                          : messages.header.title}
            </h1>
          </div>
          <div className={isFoundationRoute || isSupplierPoolRoute ? 'top-actions compact' : 'top-actions'}>
            <Tooltip title={messages.aria.search} trigger={['hover', 'focus']}>
              <button type="button" className="icon-button" aria-label={messages.aria.search}>
                <SearchOutlined />
              </button>
            </Tooltip>
            <Popover
              content={(
                <NotificationPanel
                  messages={messages}
                  notifications={visibleNotifications}
                  onDismiss={dismissNotification}
                  onSelect={openNotificationTarget}
                />
              )}
              onOpenChange={setNotificationOpen}
              open={isNotificationOpen}
              placement="bottomRight"
              rootClassName="notification-popover"
              trigger="click"
            >
              <span className="notification-trigger">
                <Tooltip title={messages.aria.notifications} trigger={['hover', 'focus']}>
                  <button
                    type="button"
                    className="icon-button notification-button"
                    aria-label={`${messages.aria.notifications}: ${visibleNotifications.length}`}
                  >
                    <BellOutlined />
                  </button>
                </Tooltip>
                {visibleNotifications.length > 0 && (
                  <span className="notification-count" aria-label={`${messages.notificationCenter.countLabel}: ${visibleNotifications.length}`}>
                    {visibleNotifications.length}
                  </span>
                )}
              </span>
            </Popover>
            {!isFoundationRoute && !isSupplierPoolRoute && !isThreeWayMatchingRoute && (
              <button className="primary-button" onClick={handleNewRequestClick} type="button">
                {primaryActionIcon}
                <span>{primaryActionLabel}</span>
              </button>
            )}
            <Dropdown
              trigger={['click']}
              placement="bottomRight"
              menu={{ items: userMenuItems, selectable: false, onClick: handleUserMenuClick }}
            >
              <Tooltip title={messages.userMenu.openMenu} trigger={['hover', 'focus']}>
                <button type="button" className="user-menu-button" aria-label={messages.userMenu.openMenu}>
                  <Avatar size={28} className="user-avatar" icon={<UserOutlined />} />
                </button>
              </Tooltip>
            </Dropdown>
          </div>
        </Header>

        <Content className="workspace">
          <section className="status-strip" aria-label={messages.aria.serviceStatus}>
            <span>{context.groupName}</span>
            <span>{context.supplierPoolScope}</span>
            <span>{context.activeCompany.businessScope}</span>
            <StatusPill status={healthStatus} isError={isError} label={messages.status.backend} />
          </section>

          {isSupplierPoolRoute ? (
            <SupplierPoolView
              categories={categories}
              companies={companies}
              context={context}
              isError={supplierPoolError}
              isLoading={supplierPoolLoading}
              language={language}
              messages={messages}
              onCompanyChange={setSelectedCompanyId}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              suppliers={suppliers}
            />
          ) : isFoundationRoute ? (
            <FoundationDataView
              budgetAccounts={budgetAccounts}
              categories={categories}
              companies={companies}
              context={context}
              departments={departments}
              isError={foundationError}
              isLoading={foundationLoading}
              language={language}
              messages={messages}
              onCompanyChange={setSelectedCompanyId}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              suppliers={suppliers}
              users={users}
            />
          ) : isPurchaseRequestRoute ? (
              <PurchaseRequestView
                budgetAccounts={budgetAccounts}
                categories={categories}
                isError={purchaseRequestsQuery.isError}
                isLoading={purchaseRequestsQuery.isLoading}
                language={language}
                messages={messages}
                onRefresh={() => {
                  void queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
                }}
              isCreateOpen={isCreateDrawerOpen}
              onCreateClose={() => setCreateDrawerOpen(false)}
              purchaseRequests={purchaseRequests}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              suppliers={suppliers}
              users={users}
            />
          ) : isApprovalRoute ? (
            <ApprovalCenterView
              categories={categories}
              isError={foundationError}
              isLoading={foundationLoading}
              language={language}
              messages={messages}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              users={users}
            />
          ) : isRfqRoute ? (
            <RfqView
              categories={categories}
              isCreateOpen={isRfqCreateDrawerOpen}
              isError={rfqsQuery.isError || purchaseRequestsQuery.isError}
              isLoading={rfqsQuery.isLoading}
              language={language}
              messages={messages}
              onCreateClose={() => setRfqCreateDrawerOpen(false)}
              onRefresh={() => {
                void queryClient.invalidateQueries({ queryKey: ['rfqs'] })
              }}
              purchaseRequests={purchaseRequests}
              rfqs={rfqs}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              suppliers={suppliers}
              users={users}
            />
          ) : isPurchaseOrderRoute ? (
            <PurchaseOrderView
              categories={categories}
              isCreateOpen={isPoCreateDrawerOpen}
              isError={purchaseOrdersQuery.isError || rfqsQuery.isError}
              isLoading={purchaseOrdersQuery.isLoading}
              language={language}
              messages={messages}
              onCreateClose={() => setPoCreateDrawerOpen(false)}
              onRefresh={() => {
                void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
              }}
              purchaseOrders={purchaseOrders}
              rfqs={rfqs}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              users={users}
            />
          ) : isReceiptInvoiceRoute ? (
            <ReceiptsInvoicesView
              createMode={receiptInvoiceCreateMode}
              language={language}
              messages={messages}
              onCreateModeChange={setReceiptInvoiceCreateMode}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              users={users}
            />
          ) : isThreeWayMatchingRoute ? (
            <ThreeWayMatchingView
              language={language}
              messages={messages}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              users={users}
            />
          ) : (
            <ProcurementDashboardView
              companies={companies}
              dashboard={procurementDashboardQuery.data?.data ?? null}
              errorMessage={procurementDashboardQuery.error instanceof Error ? procurementDashboardQuery.error.message : null}
              isError={procurementDashboardQuery.isError}
              isLoading={procurementDashboardQuery.isLoading}
              language={language}
              messages={messages}
              onScopeChange={setDashboardScopeValue}
              scopeValue={dashboardScopeValue}
            />
          )}
        </Content>
      </Layout>
      </Layout>
    </>
  )
}

function ProcurementDashboardView({
  companies,
  dashboard,
  errorMessage,
  isError,
  isLoading,
  language,
  messages,
  onScopeChange,
  scopeValue,
}: {
  companies: CompanyContext[]
  dashboard: ProcurementDashboard | null
  errorMessage: string | null
  isError: boolean
  isLoading: boolean
  language: Language
  messages: LocalizedMessages
  onScopeChange: (scopeValue: ProcurementDashboardScopeValue) => void
  scopeValue: ProcurementDashboardScopeValue
}) {
  const navigate = useNavigate()
  const metrics = dashboardMetricsInOrder(dashboard?.summary ?? [])

  return (
    <div className="dashboard-page">
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
              <strong>{messages.dashboard.groupScope}</strong>
              <small>{dashboard?.groupName ?? demoContext.groupName}</small>
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
                <strong>{company.companyName}</strong>
                <small>{company.businessScope}</small>
              </span>
              <em>{messages.boundary.companyIsolated}</em>
            </button>
          ))}
        </div>
      </section>

      {isError && <div className="data-alert">{errorMessage ?? messages.dashboard.unavailable}</div>}

      {isLoading && !dashboard ? (
        <section className="panel">
          <div className="empty-state">{messages.dashboard.loading}</div>
        </section>
      ) : dashboard ? (
        <>
          <section className="kpi-grid" aria-label={messages.aria.procurementMetrics}>
            {metrics.map((metric) => (
              <article className="panel kpi" key={metric.key}>
                <div>
                  <span>{dashboardMetricLabel(metric, messages)}</span>
                  {dashboardMetricIcon(metric.key)}
                </div>
                <strong>{formatDashboardMetric(metric, language)}</strong>
                <small className={dashboardMetricTone(metric.key, metric.value)}>
                  {dashboardMetricNote(metric, messages, language)}
                </small>
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <div className="left-column">
              <section className="panel chart-panel">
                <PanelTitle icon={<DashboardOutlined />} title={messages.dashboard.spendTrend} aside={dashboard.scope === 'GROUP' ? messages.dashboard.groupScope : dashboard.companyName ?? ''} />
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
                      <div className="risk-item dashboard-exception" key={exception.matchId}>
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
                            {messages.dashboard.invoiceVariance}: {formatCurrency(exception.invoiceVarianceAmount, exception.currency, language)}
                          </span>
                          <span className="exception-meta">
                            {messages.dashboard.lastCalculated}: {formatDateTime(exception.lastCalculatedAt, language)}
                          </span>
                        </div>
                        <span className={`tag ${exception.severity ? severityToneOf(exception.severity) : 'neutral'}`}>
                          {exception.severity ? formatMatchSeverity(exception.severity, messages) : messages.dashboard.empty}
                        </span>
                      </div>
                    ))}
                    <button className="primary-button dashboard-link-button" onClick={() => navigate('/three-way-matching')} type="button">
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

function PurchaseRequestView({
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
  selectedCompany,
  selectedCompanyId,
  suppliers,
  users,
}: {
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
  selectedCompany: CompanyContext
  selectedCompanyId: string
  suppliers: SupplierSummary[]
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const [modal, modalContextHolder] = Modal.useModal()
  const wasCreateOpen = useRef(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [isCreateDirty, setCreateDirty] = useState(false)
  const [lastDrawerMode, setLastDrawerMode] = useState<PurchaseRequestDrawerMode>('detail')
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const [aiIntent, setAiIntent] = useState('')
  const [aiDraftResponse, setAiDraftResponse] = useState<AiAssistantResponse | null>(null)
  const [aiRiskResponse, setAiRiskResponse] = useState<AiAssistantResponse | null>(null)
  const [form, setForm] = useState<PurchaseRequestFormState>(() =>
    buildPurchaseRequestFormDefaults(selectedCompanyId, users, categories, budgetAccounts, suppliers),
  )

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
      setAiIntent('')
      setAiDraftResponse(null)
      setAiRiskResponse(null)
      setDetailDrawerOpen(false)
      setForm(buildPurchaseRequestFormDefaults(selectedCompanyId, users, categories, budgetAccounts, suppliers))
    }
  }, [budgetAccounts, categories, isCreateOpen, selectedCompanyId, suppliers, users])

  useEffect(() => {
    setForm((current) => {
      const currentRequester = users.find((user) => user.userId === current.requesterId)
      const applicant = users.find((user) => user.roles.some((role) => role.roleId === 'role-applicant'))
      const requester =
        currentRequester?.roles.some((role) => role.roleId === 'role-applicant')
          ? currentRequester
          : applicant ?? users.find((user) => user.active) ?? users[0]
      const currentCategory = categories.find((category) => category.categoryId === current.categoryId)
      const defaultCategory = currentCategory ?? categories[0]
      const budgetForCurrentCategory = budgetAccounts.find(
        (account) =>
          account.budgetAccountId === current.budgetAccountId &&
          account.categoryId === defaultCategory?.categoryId &&
          account.active,
      )
      const budgetAccount =
        budgetForCurrentCategory ??
        budgetAccounts.find((account) => account.categoryId === defaultCategory?.categoryId && account.active) ??
        budgetAccounts.find((account) => account.active) ??
        budgetAccounts[0]
      const categoryId = budgetAccount?.categoryId ?? defaultCategory?.categoryId ?? ''
      const supplier = preferredSupplierForCategory(categoryId, suppliers, current.supplierId)

      return {
        ...current,
        budgetAccountId: budgetAccount?.budgetAccountId ?? '',
        categoryId,
        companyId: selectedCompanyId,
        departmentId: requester?.departmentId ?? '',
        requesterId: requester?.userId ?? '',
        supplierId: supplier?.supplierId ?? '',
      }
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
        supplierId: draft.supplierId ?? current.supplierId,
        title: draft.title || current.title,
        lineItems:
          draft.lineItems && draft.lineItems.length > 0
            ? draft.lineItems.map((line) =>
                createPurchaseRequestFormLine({
                  estimatedUnitPrice: Number(line.estimatedUnitPrice ?? 0),
                  itemName: line.itemName ?? '',
                  quantity: Number(line.quantity ?? 1),
                  specification: line.specification ?? '',
                  unit: line.unit ?? '件',
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
  const drawerExtra =
    renderedDrawerMode === 'create' ? (
      <button
        className="primary-button"
        disabled={createMutation.isPending}
        form="purchase-request-create-form"
        type="submit"
      >
        <FileAddOutlined />
        <span>{messages.purchaseRequest.saveDraft}</span>
      </button>
    ) : selectedDetail?.status === 'DRAFT' ? (
      <button
        className="primary-button"
        disabled={submitMutation.isPending}
        onClick={() => submitMutation.mutate(selectedDetail.requestId)}
        type="button"
      >
        <CheckCircleOutlined />
        <span>{messages.purchaseRequest.submit}</span>
      </button>
    ) : null

  const updateForm = <Key extends keyof PurchaseRequestFormState>(key: Key, value: PurchaseRequestFormState[Key]) => {
    setCreateDirty(true)
    setForm((current) => ({ ...current, [key]: value }))
  }

  const aiDraftDisabledReason = aiDraftMutation.isPending
    ? messages.ai.generating
    : !aiIntent.trim()
      ? messages.ai.disabledNoIntent
      : !form.requesterId
        ? messages.ai.disabledNoActor
        : undefined

  const requestAiDraft = () => {
    if (aiDraftDisabledReason) {
      return
    }
    setAiDraftResponse(null)
    aiDraftMutation.mutate({
      actorId: form.requesterId,
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
    const supplier = preferredSupplierForCategory(categoryId, suppliers)
    setForm((current) => ({
      ...current,
      budgetAccountId: budgetAccount?.budgetAccountId ?? '',
      categoryId,
      supplierId: supplier?.supplierId ?? '',
    }))
  }

  const handleCreateDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.companyId || !form.requesterId || !form.departmentId || !form.categoryId || !form.budgetAccountId) {
      setFeedback({ message: messages.purchaseRequest.unavailable, tone: 'danger' })
      return
    }

    createMutation.mutate({
      budgetAccountId: form.budgetAccountId,
      categoryId: form.categoryId,
      companyId: form.companyId,
      currency: 'CNY',
      departmentId: form.departmentId,
      description: form.description,
      expectedDeliveryDate: form.expectedDeliveryDate,
      requesterId: form.requesterId,
      supplierId: form.supplierId || undefined,
      title: form.title,
      totalAmount,
      lineItems: form.lineItems.map((line) => ({
        estimatedAmount: lineAmountOf(line),
        estimatedUnitPrice: line.estimatedUnitPrice,
        itemName: line.itemName,
        quantity: line.quantity,
        specification: line.specification,
        unit: line.unit,
      })),
    })
  }

  const handleRequestDetailOpen = (requestId: string) => {
    setFeedback(null)
    setAiRiskResponse(null)
    setLastDrawerMode('detail')
    setSelectedRequestId(requestId)
    setDetailDrawerOpen(true)
  }

  const closeCreateDrawer = () => {
    setLastDrawerMode('create')
    setCreateDirty(false)
    setAiIntent('')
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
            aside={selectedCompany.companyName}
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
	                  purchaseRequests.map((request) => (
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
            <DisabledActionTooltip className="form-wide" title={aiDraftDisabledReason}>
              <button
                aria-busy={aiDraftMutation.isPending}
                className="line-add-button"
                disabled={Boolean(aiDraftDisabledReason)}
                onClick={requestAiDraft}
                type="button"
              >
                {aiDraftMutation.isPending ? <LoadingOutlined /> : <ApiOutlined />}
                <span>{aiDraftMutation.isPending ? messages.ai.generating : messages.ai.generateDraft}</span>
              </button>
            </DisabledActionTooltip>
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
              {filteredBudgetAccounts.map((account) => (
                <option key={account.budgetAccountId} value={account.budgetAccountId}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{messages.purchaseRequest.supplier}</span>
            <select value={form.supplierId} onChange={(event) => updateForm('supplierId', event.target.value)}>
              <option value="">{messages.purchaseRequest.noSupplier}</option>
              {filteredSuppliers.map((supplier) => (
                <option key={supplier.supplierId} value={supplier.supplierId}>
                  {supplier.supplierName}
                </option>
              ))}
            </select>
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
                          onChange={(event) => updateLineItem(line.lineKey, 'quantity', Number(event.target.value))}
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
                            updateLineItem(line.lineKey, 'estimatedUnitPrice', Number(event.target.value))
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
		                  <TruncatedText text={supplierNameOf(selectedDetail.supplierId, suppliers, messages)} />
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
		              <div>
		                <dt>{messages.purchaseRequest.matchedRule}</dt>
		                <dd>{selectedDetail.approval?.matchedRuleId ?? messages.purchaseRequest.noApproval}</dd>
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
	              <section className="approval-section">
	                <PanelTitle
	                  icon={<AuditOutlined />}
	                  title={messages.purchaseRequest.approvalPath}
	                  aside={formatApprovalStatus(selectedDetail.approval.status, messages)}
	                />
	                {approvalDetail ? (
	                  <>
	                    <ApprovalPath messages={messages} nodes={approvalDetail.nodes} users={users} />
	                    <ApprovalTimeline
	                      language={language}
	                      messages={messages}
	                      records={approvalDetail.timeline}
	                      users={users}
	                    />
	                  </>
	                ) : (
	                  <ApprovalTimeline
	                    language={language}
	                    messages={messages}
	                    records={selectedDetail.approval.timeline}
	                    users={users}
	                  />
	                )}
	              </section>
	            )}
	          </div>
	        ) : (
	          <div className="empty-state">{isLoading ? messages.purchaseRequest.loading : messages.purchaseRequest.empty}</div>
	        )}
	      </Drawer>
    </>
  )
}

function ApprovalCenterView({
  categories,
  isError,
  isLoading,
  language,
  messages,
  selectedCompany,
  selectedCompanyId,
  users,
}: {
  categories: CategorySummary[]
  isError: boolean
  isLoading: boolean
  language: Language
  messages: LocalizedMessages
  selectedCompany: CompanyContext
  selectedCompanyId: string
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const [modal, modalContextHolder] = Modal.useModal()
  const approvers = users.filter(
    (user) =>
      user.active &&
      user.companyId === selectedCompanyId &&
      user.roles.some((role) => role.roleId === 'role-approver' || role.roleId === 'role-finance'),
  )
  const fallbackApprover = approvers[0]
  const [selectedApproverId, setSelectedApproverId] = useState(fallbackApprover?.userId ?? '')
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const [aiRiskResponse, setAiRiskResponse] = useState<AiAssistantResponse | null>(null)

  useEffect(() => {
    if (approvers.some((user) => user.userId === selectedApproverId)) {
      return
    }

    setSelectedApproverId(fallbackApprover?.userId ?? '')
  }, [approvers, fallbackApprover?.userId, selectedApproverId])

  const tasksQuery = useQuery({
    queryKey: ['approval-tasks', selectedCompanyId, selectedApproverId],
    queryFn: () => fetchApprovalTasks(selectedCompanyId, selectedApproverId),
    enabled: selectedCompanyId.length > 0 && selectedApproverId.length > 0,
    placeholderData: keepPreviousData,
    retry: 1,
  })
  const tasks = tasksQuery.isPlaceholderData ? [] : (tasksQuery.data?.data ?? [])

  const detailQuery = useQuery({
    queryKey: ['approval-detail', selectedApprovalId, selectedCompanyId],
    queryFn: () => fetchApprovalDetail(selectedApprovalId ?? '', selectedCompanyId),
    enabled: Boolean(selectedApprovalId),
    retry: 1,
  })
  const detail = detailQuery.data?.data
  const activeNode = detail?.nodes.find((node) => node.status === 'ACTIVE')
  const canApprove = detail?.status === 'IN_PROGRESS' && activeNode?.approverId === selectedApproverId
  const canWithdraw = detail?.status === 'IN_PROGRESS'
  const approverOptions = approvers.map((user) => ({
    label: `${user.displayName} · ${user.positionTitle}`,
    searchText: `${user.displayName} ${user.positionTitle} ${user.email} ${user.userId}`,
    value: user.userId,
  }))

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
      actorId: action === 'withdraw' ? detail.requesterId : selectedApproverId,
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
      actorId: selectedApproverId || detail.requesterId,
      companyId: detail.companyId,
      requestId: detail.requestId,
    })
  }

  const handleApproverChange = (approverId: string) => {
    setSelectedApproverId(approverId)
    setSelectedApprovalId(undefined)
    setDetailDrawerOpen(false)
    setComment('')
    setFeedback(null)
    setAiRiskResponse(null)
  }

  const closeApprovalDrawer = () => {
    setDetailDrawerOpen(false)
    setComment('')
    setFeedback(null)
    setAiRiskResponse(null)
  }

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
        <PanelTitle icon={<AuditOutlined />} title={messages.approval.taskList} aside={selectedCompany.companyName} />
        <div className="approval-toolbar">
          <label>
            <span>{messages.approval.approver}</span>
            <Select
              aria-label={messages.approval.approver}
              className="approval-approver-select"
              disabled={approvers.length === 0}
              filterOption={(input, option) =>
                String(option?.searchText ?? option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              notFoundContent={messages.approval.noApprover}
              onChange={handleApproverChange}
              optionFilterProp="label"
              options={approverOptions}
              placeholder={messages.approval.searchApprover}
              showSearch
              value={selectedApproverId || undefined}
            />
          </label>
        </div>
        {(isError || tasksQuery.isError) && <div className="data-alert">{messages.approval.unavailable}</div>}
        <div className="table-wrap">
          <table className="request-table approval-task-table">
            <thead>
              <tr>
                <th>{messages.purchaseRequest.requestId}</th>
                <th>{messages.purchaseRequest.title}</th>
                <th>{messages.purchaseRequest.totalAmount}</th>
                <th>{messages.approval.node}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    {isLoading || tasksQuery.isLoading ? messages.approval.loading : messages.approval.emptyTasks}
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
              <dd>{userNameOf(detail.requesterId, users)}</dd>
            </div>
            <div>
              <dt>{messages.purchaseRequest.category}</dt>
              <dd>{categoryNameOf(contextText(detail.contextSnapshot, 'categoryId'), categories)}</dd>
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
              <dd>{activeNode ? userNameOf(activeNode.approverId, users) : messages.approval.terminal}</dd>
            </div>
            <div>
              <dt>{messages.approval.matchedRule}</dt>
              <dd>{detail.matchedRuleId}</dd>
            </div>
            <div>
              <dt>{messages.approval.startedAt}</dt>
              <dd>{formatDateTime(detail.startedAt, language)}</dd>
            </div>
          </dl>

          <section className="approval-context">
            <PanelTitle icon={<ProfileOutlined />} title={messages.approval.requestSummary} />
            <div className="context-grid">
              <span>{contextText(detail.contextSnapshot, 'departmentId')}</span>
              <span>{contextText(detail.contextSnapshot, 'budgetAccountId')}</span>
              <span>{contextText(detail.contextSnapshot, 'supplierId') || messages.purchaseRequest.noSupplier}</span>
              <span>{contextText(detail.contextSnapshot, 'expectedDeliveryDate')}</span>
            </div>
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

          <ApprovalPath messages={messages} nodes={detail.nodes} users={users} />
          <ApprovalTimeline language={language} messages={messages} records={detail.timeline} users={users} />

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

function RfqView({
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
  selectedCompany,
  selectedCompanyId,
  suppliers,
  users,
}: {
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
  selectedCompany: CompanyContext
  selectedCompanyId: string
  suppliers: SupplierSummary[]
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const [modal, modalContextHolder] = Modal.useModal()
  const wasCreateOpen = useRef(false)
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
    (user) => user.active && user.roles.some((role) => role.roleId === 'role-procurement'),
  )
  const [createForm, setCreateForm] = useState<RfqCreateFormState>(() =>
    buildRfqCreateFormDefaults(selectedCompanyId, approvedRequests, suppliers, buyers),
  )
  const [quoteForm, setQuoteForm] = useState<RfqQuoteFormState>(() => buildRfqQuoteFormDefaults())
  const [isQuoteUploading, setQuoteUploading] = useState(false)

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
    setCreateForm(buildRfqCreateFormDefaults(selectedCompanyId, approvedRequests, suppliers, buyers))
  }, [approvedRequests, buyers, isCreateOpen, selectedCompanyId, suppliers])

  useEffect(() => {
    setCreateForm((current) => {
      const currentRequest = approvedRequests.find((request) => request.requestId === current.requestId)
      const request = currentRequest ?? approvedRequests[0]
      const procurementUser =
        buyers.find((buyer) => buyer.userId === current.procurementUserId) ?? buyers[0]
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
  }, [approvedRequests, buyers, suppliers])

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

  const confirmDiscardQuote = (onOk: () => void) => {
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
  }

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

  return (
    <>
      {modalContextHolder}
      <section className="request-grid rfq-grid">
        <section className="panel request-list-panel">
          <PanelTitle icon={<FileSearchOutlined />} title={messages.rfq.list} aside={selectedCompany.companyName} />
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
                  rfqs.map((rfq) => (
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
              <span>{messages.purchaseRequest.title}</span>
              <input required value={createForm.title} onChange={(event) => updateCreateForm('title', event.target.value)} />
            </label>
            <label className="form-wide">
              <span>{messages.rfq.suppliers}</span>
              <Select
                mode="multiple"
                options={selectableSuppliers.map((supplier) => ({
                  label: supplier.supplierName,
                  value: supplier.supplierId,
                }))}
                onChange={(value) => updateCreateForm('supplierIds', value)}
                value={createForm.supplierIds}
              />
            </label>
            {selectedCreateRequest && (
              <dl className="detail-grid form-wide">
                <div>
                  <dt>{messages.purchaseRequest.category}</dt>
                  <dd>{categoryNameOf(selectedCreateRequest.categoryId, categories)}</dd>
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
                <dd>{userNameOf(detail.procurementUserId, users)}</dd>
              </div>
              <div>
                <dt>{messages.purchaseRequest.category}</dt>
                <dd>{categoryNameOf(detail.categoryId, categories)}</dd>
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
              <PanelTitle icon={<TeamOutlined />} title={messages.rfq.invitedSuppliers} aside={messages.rfq.noPo} />
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
                      <strong>{supplier.supplierName}</strong>
                      <span>{quote ? formatCurrency(quote.totalAmount, detail.currency, language) : messages.rfq.noQuote}</span>
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
                  <span>{messages.rfq.attachmentFile}</span>
                  <input
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null
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
                <label className="form-wide">
                  <span>{messages.rfq.riskNote}</span>
                  <textarea value={quoteForm.riskNote} onChange={(event) => updateQuoteForm('riskNote', event.target.value)} />
                </label>
                <label className="form-wide">
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
                  className="form-wide"
                  messages={messages}
                />
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

function PurchaseOrderView({
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
  const [modal, modalContextHolder] = Modal.useModal()
  const wasCreateOpen = useRef(false)
  const [selectedPoId, setSelectedPoId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [isCreateDirty, setCreateDirty] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const buyers = users.filter(
    (user) => user.active && user.roles.some((role) => role.roleId === 'role-procurement'),
  )
  const orderedRfqIds = new Set(purchaseOrders.map((purchaseOrder) => purchaseOrder.rfqId))
  const eligibleRfqs = rfqs.filter((rfq) => rfq.status === 'COMPARISON_READY' && !orderedRfqIds.has(rfq.rfqId))
  const [createForm, setCreateForm] = useState<PurchaseOrderCreateFormState>(() =>
    buildPurchaseOrderCreateFormDefaults(selectedCompanyId, eligibleRfqs, buyers),
  )

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
    setCreateForm(buildPurchaseOrderCreateFormDefaults(selectedCompanyId, eligibleRfqs, buyers))
  }, [buyers, eligibleRfqs, isCreateOpen, selectedCompanyId])

  useEffect(() => {
    setCreateForm((current) => {
      const selectedRfq = eligibleRfqs.find((rfq) => rfq.rfqId === current.rfqId) ?? eligibleRfqs[0]
      const buyer =
        buyers.find((item) => item.userId === current.procurementUserId) ??
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
  }, [buyers, eligibleRfqs, selectedCompanyId])

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
  const createRfqComparisonRows = createRfqComparisonQuery.data?.data ?? []
  const createQuoteBySupplier = new Map(createRfqDetail?.quotes.map((quote) => [quote.supplierId, quote]) ?? [])
  const createSupplierById = new Map(createRfqDetail?.suppliers.map((supplier) => [supplier.supplierId, supplier]) ?? [])
  const quoteOptions = createRfqComparisonRows.length > 0
    ? createRfqComparisonRows
        .map((row) => createQuoteBySupplier.get(row.supplierId))
        .filter((quote): quote is RfqQuote => Boolean(quote))
    : createRfqDetail?.quotes ?? []

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

  const confirmDiscardDetailInput = (onOk: () => void) => {
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
  }

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
                  purchaseOrders.map((purchaseOrder) => (
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

function ThreeWayMatchingView({
  language,
  messages,
  selectedCompany,
  selectedCompanyId,
  users,
}: {
  language: Language
  messages: LocalizedMessages
  selectedCompany: CompanyContext
  selectedCompanyId: string
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const [modal, modalContextHolder] = Modal.useModal()
  const [activeTab, setActiveTab] = useState<ThreeWayMatchTab>('all')
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [actionNote, setActionNote] = useState('')
  const [isActionDirty, setActionDirty] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const [aiMatchingResponse, setAiMatchingResponse] = useState<AiAssistantResponse | null>(null)
  const activeUsers = users.filter((user) => user.active)
  const financeUsers = activeUsers.filter((user) => user.roles.some((role) => role.roleId === 'role-finance'))
  const actionActor = financeUsers[0] ?? activeUsers[0]
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
  const matchingRows = matchesQuery.data?.data ?? []
  const exceptionRows = exceptionsQuery.data?.data ?? []
  const resolvedRows = matchingRows.filter((row) => row.status === 'RESOLVED')
  const tabRows =
    activeTab === 'exceptions'
      ? exceptionRows
      : activeTab === 'resolved'
        ? resolvedRows
        : matchingRows
  const detail = detailQuery.data?.data
  const isError = matchesQuery.isError || exceptionsQuery.isError || detailQuery.isError
  const isLoading = matchesQuery.isLoading || exceptionsQuery.isLoading
  const totals = {
    exception: matchingRows.filter((row) => row.status === 'EXCEPTION').length,
    matched: matchingRows.filter((row) => row.status === 'MATCHED').length,
    pending: matchingRows.filter((row) => row.status === 'PENDING_INPUT').length,
    resolved: matchingRows.filter((row) => row.status === 'RESOLVED').length,
  }

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

  const discardActionInput = (next: () => void) => {
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
  }

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
          <small>{selectedCompany.companyName}</small>
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
          <PanelTitle icon={<SwapOutlined />} title={messages.matching.list} aside={selectedCompany.companyName} />
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
                  tabRows.map((row) => (
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
                <strong>{detail.sourcePo.poId}</strong>
                <span>{detail.sourcePo.title}</span>
              </div>
              <span className={`tag ${matchStatusToneOf(detail.status)}`}>{formatMatchStatus(detail.status, messages)}</span>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>{messages.purchaseOrder.supplier}</dt>
                <dd>{detail.sourcePo.supplierName}</dd>
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
                <dd>{`${detail.receiptSummary.receiptCount} · ${detail.receiptSummary.receivedQuantity}`}</dd>
              </div>
              <div>
                <dt>{messages.matching.invoiceSummary}</dt>
                <dd>{`${detail.invoiceSummary.invoiceCount} · ${detail.invoiceSummary.invoicedQuantity}`}</dd>
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

            <PanelTitle icon={<AuditOutlined />} title={messages.matching.handlingRecords} />
            <div className="timeline-list matching-actions-list">
              {detail.actions.length === 0 ? (
                <div className="empty-state">{messages.matching.noActions}</div>
              ) : (
                detail.actions.map((action) => (
                  <article className="timeline-item" key={action.actionId}>
                    <strong>{formatMatchAction(action.actionType, messages)}</strong>
                    <span>{userNameOf(action.actorId, users)} · {formatDateTime(action.createdAt, language)}</span>
                    <p>{action.note}</p>
                  </article>
                ))
              )}
            </div>

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

export function shouldConfirmReceiptInvoiceDrawerClose(
  drawerMode: ReceiptInvoiceCreateMode | 'detail' | null,
  isCreateDirty: boolean,
) {
  return (drawerMode === 'receipt' || drawerMode === 'invoice') && isCreateDirty
}

function ReceiptsInvoicesView({
  createMode,
  language,
  messages,
  onCreateModeChange,
  selectedCompany,
  selectedCompanyId,
  users,
}: {
  createMode: ReceiptInvoiceCreateMode | null
  language: Language
  messages: LocalizedMessages
  onCreateModeChange: (mode: ReceiptInvoiceCreateMode | null) => void
  selectedCompany: CompanyContext
  selectedCompanyId: string
  users: UserSummary[]
}) {
  const queryClient = useQueryClient()
  const [modal, modalContextHolder] = Modal.useModal()
  const wasCreateOpen = useRef(false)
  const [selectedPoId, setSelectedPoId] = useState<string | undefined>()
  const [isDetailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [isCreateDirty, setCreateDirty] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'danger' } | null>(null)
  const fulfillmentQuery = useQuery({
    queryKey: ['receipts-invoices', 'purchase-orders', selectedCompanyId],
    queryFn: () => fetchFulfillmentPurchaseOrders(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const receiptsQuery = useQuery({
    queryKey: ['receipts', selectedCompanyId],
    queryFn: () => fetchReceipts(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const invoicesQuery = useQuery({
    queryKey: ['invoices', selectedCompanyId],
    queryFn: () => fetchInvoices(selectedCompanyId),
    enabled: selectedCompanyId.length > 0,
    retry: 1,
  })
  const fulfillmentRows = fulfillmentQuery.data?.data ?? []
  const receipts = receiptsQuery.data?.data ?? []
  const invoices = invoicesQuery.data?.data ?? []
  const selectedPo = fulfillmentRows.find((row) => row.poId === selectedPoId)
  const relatedReceipts = selectedPo ? receipts.filter((receipt) => receipt.poId === selectedPo.poId) : []
  const relatedInvoices = selectedPo ? invoices.filter((invoice) => invoice.poId === selectedPo.poId) : []
  const activeUsers = users.filter((user) => user.active)
  const financeUsers = activeUsers.filter((user) => user.roles.some((role) => role.roleId === 'role-finance'))
  const receiptUsers = activeUsers.filter((user) =>
    user.roles.some((role) => role.roleId === 'role-warehouse' || role.roleId === 'role-procurement' || role.roleId === 'role-demo-operator'),
  )
  const [receiptForm, setReceiptForm] = useState<ReceiptCreateFormState>(() =>
    buildReceiptCreateFormDefaults(fulfillmentRows, receiptUsers, selectedCompanyId),
  )
  const [invoiceForm, setInvoiceForm] = useState<InvoiceCreateFormState>(() =>
    buildInvoiceCreateFormDefaults(fulfillmentRows, financeUsers, selectedCompanyId),
  )

  useEffect(() => {
    if (fulfillmentRows.length === 0) {
      setSelectedPoId(undefined)
      setDetailDrawerOpen(false)
      return
    }

    if (selectedPoId && !fulfillmentRows.some((row) => row.poId === selectedPoId)) {
      setSelectedPoId(undefined)
      setDetailDrawerOpen(false)
    }
  }, [fulfillmentRows, selectedPoId])

  useEffect(() => {
    const didOpenCreateDrawer = Boolean(createMode) && !wasCreateOpen.current
    wasCreateOpen.current = Boolean(createMode)
    if (!didOpenCreateDrawer) {
      return
    }

    setCreateDirty(false)
    setFeedback(null)
    setDetailDrawerOpen(false)
    setReceiptForm(buildReceiptCreateFormDefaults(fulfillmentRows, receiptUsers, selectedCompanyId))
    setInvoiceForm(buildInvoiceCreateFormDefaults(fulfillmentRows, financeUsers, selectedCompanyId))
  }, [createMode, financeUsers, fulfillmentRows, receiptUsers, selectedCompanyId])

  const receiptMutation = useMutation({
    mutationFn: createReceipt,
    onError: (error) => {
      setFeedback({
        message: `${messages.receiptInvoice.actionFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: () => {
      setCreateDirty(false)
      setFeedback({ message: messages.receiptInvoice.receiptSuccess, tone: 'success' })
      onCreateModeChange(null)
      void queryClient.invalidateQueries({ queryKey: ['receipts'] })
      void queryClient.invalidateQueries({ queryKey: ['receipts-invoices'] })
      void queryClient.invalidateQueries({ queryKey: ['three-way-matching'] })
    },
  })

  const invoiceMutation = useMutation({
    mutationFn: createInvoice,
    onError: (error) => {
      setFeedback({
        message: `${messages.receiptInvoice.actionFailed}: ${error instanceof Error ? error.message : ''}`,
        tone: 'danger',
      })
    },
    onSuccess: () => {
      setCreateDirty(false)
      setFeedback({ message: messages.receiptInvoice.invoiceSuccess, tone: 'success' })
      onCreateModeChange(null)
      void queryClient.invalidateQueries({ queryKey: ['invoices'] })
      void queryClient.invalidateQueries({ queryKey: ['receipts-invoices'] })
      void queryClient.invalidateQueries({ queryKey: ['three-way-matching'] })
    },
  })

  const isError = fulfillmentQuery.isError || receiptsQuery.isError || invoicesQuery.isError
  const isLoading = fulfillmentQuery.isLoading || receiptsQuery.isLoading || invoicesQuery.isLoading
  const drawerMode = createMode ?? (isDetailDrawerOpen ? 'detail' : null)
  const drawerTitle =
    drawerMode === 'receipt'
      ? messages.receiptInvoice.createReceipt
      : drawerMode === 'invoice'
        ? messages.receiptInvoice.createInvoice
        : messages.receiptInvoice.detail

  const closeCreateDrawer = () => {
    setCreateDirty(false)
    onCreateModeChange(null)
  }

  const closeDetailDrawer = () => {
    setDetailDrawerOpen(false)
    setFeedback(null)
  }

  const handleDrawerClose = () => {
    if (shouldConfirmReceiptInvoiceDrawerClose(drawerMode, isCreateDirty)) {
      modal.confirm({
        mousePosition: getViewportCenter(),
        centered: true,
        cancelText: messages.purchaseRequest.continueEdit,
        content: messages.receiptInvoice.discardContent,
        focusable: { autoFocusButton: 'cancel' },
        okType: 'danger',
        okText: messages.receiptInvoice.discardConfirm,
        onOk: closeCreateDrawer,
        rootClassName: 'procure-confirm-modal',
        title: messages.receiptInvoice.discardTitle,
      })
      return
    }

    if (drawerMode === 'receipt' || drawerMode === 'invoice') {
      closeCreateDrawer()
      return
    }

    closeDetailDrawer()
  }

  const openPoDetail = (poId: string) => {
    setSelectedPoId(poId)
    setDetailDrawerOpen(true)
    setFeedback(null)
  }

  const openCreateMode = (mode: ReceiptInvoiceCreateMode, po?: FulfillmentPurchaseOrder) => {
    const row = po ?? fulfillmentRows[0]
    if (mode === 'receipt') {
      setReceiptForm(buildReceiptCreateFormDefaults(fulfillmentRows, receiptUsers, selectedCompanyId, row?.poId))
    } else {
      setInvoiceForm(buildInvoiceCreateFormDefaults(fulfillmentRows, financeUsers, selectedCompanyId, row?.poId))
    }
    setCreateDirty(false)
    setFeedback(null)
    onCreateModeChange(mode)
  }

  const updateReceiptPo = (poId: string) => {
    setCreateDirty(true)
    setReceiptForm(buildReceiptCreateFormDefaults(fulfillmentRows, receiptUsers, selectedCompanyId, poId))
  }

  const updateInvoicePo = (poId: string) => {
    setCreateDirty(true)
    setInvoiceForm(buildInvoiceCreateFormDefaults(fulfillmentRows, financeUsers, selectedCompanyId, poId))
  }

  const updateReceiptLine = (poLineId: string, receivedQuantity: number) => {
    setCreateDirty(true)
    setReceiptForm((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.poLineId === poLineId ? { ...line, receivedQuantity } : line,
      ),
    }))
  }

  const updateInvoiceLine = (
    poLineId: string,
    key: InvoiceEditableLineKey,
    value: number,
  ) => {
    setCreateDirty(true)
    setInvoiceForm((current) => ({
      ...current,
      lines: current.lines.map((line) => (line.poLineId === poLineId ? { ...line, [key]: value } : line)),
    }))
  }

  const handleCreateReceipt = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void (async () => {
      try {
        let uploadedAttachments = receiptForm.uploadedAttachments
        if (receiptForm.file) {
          const uploadResponse = await uploadAttachment({
            companyId: selectedCompanyId,
            description: receiptForm.fileDescription,
            file: receiptForm.file,
            supplierId: fulfillmentRows.find((row) => row.poId === receiptForm.poId)?.supplierId,
            targetId: receiptForm.poId,
            targetType: 'RECEIPT',
            uploadedBy: receiptForm.receivedBy,
          })
          uploadedAttachments = [uploadResponse.data]
          setReceiptForm((current) => ({
            ...current,
            file: null,
            fileName: uploadResponse.data.originalFileName,
            uploadedAttachments,
          }))
        }
        receiptMutation.mutate({
          attachmentIds: uploadedAttachments.map((attachment) => attachment.attachmentId),
          attachments: uploadedAttachments.length === 0 && receiptForm.fileName.trim()
            ? [{
                contentType: 'image/jpeg',
                description: receiptForm.fileDescription,
                fileName: receiptForm.fileName,
                sizeBytes: 0,
              }]
            : [],
          companyId: selectedCompanyId,
          lines: receiptForm.lines
            .filter((line) => line.receivedQuantity > 0)
            .map((line) => ({
              note: line.note,
              poLineId: line.poLineId,
              receivedQuantity: line.receivedQuantity,
            })),
          note: receiptForm.note,
          poId: receiptForm.poId,
          receivedBy: receiptForm.receivedBy,
          receivedDate: receiptForm.receivedDate,
        })
      } catch (error) {
        setFeedback({
          message: `${messages.receiptInvoice.actionFailed}: ${error instanceof Error ? error.message : ''}`,
          tone: 'danger',
        })
      }
    })()
  }

  const handleCreateInvoice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void (async () => {
      try {
        let uploadedAttachments = invoiceForm.uploadedAttachments
        if (invoiceForm.file) {
          const uploadResponse = await uploadAttachment({
            companyId: selectedCompanyId,
            description: invoiceForm.fileDescription,
            file: invoiceForm.file,
            supplierId: fulfillmentRows.find((row) => row.poId === invoiceForm.poId)?.supplierId,
            targetId: invoiceForm.poId,
            targetType: 'INVOICE',
            uploadedBy: invoiceForm.registeredBy,
          })
          uploadedAttachments = [uploadResponse.data]
          setInvoiceForm((current) => ({
            ...current,
            file: null,
            fileName: uploadResponse.data.originalFileName,
            uploadedAttachments,
          }))
        }
        invoiceMutation.mutate({
          attachmentIds: uploadedAttachments.map((attachment) => attachment.attachmentId),
          attachments: uploadedAttachments.length === 0 && invoiceForm.fileName.trim()
            ? [{
                contentType: 'application/pdf',
                description: invoiceForm.fileDescription,
                fileName: invoiceForm.fileName,
                sizeBytes: 0,
              }]
            : [],
          companyId: selectedCompanyId,
          invoiceDate: invoiceForm.invoiceDate,
          invoiceNumber: invoiceForm.invoiceNumber,
          lines: invoiceForm.lines
            .filter((line) => line.invoicedQuantity > 0)
            .map((line) => ({
              invoicedQuantity: line.invoicedQuantity,
              poLineId: line.poLineId,
              taxAmount: roundAmount(line.taxAmount),
              taxRate: line.taxRate,
              totalAmount: roundAmount(line.totalAmount),
              untaxedAmount: roundAmount(line.untaxedAmount),
            })),
          note: invoiceForm.note,
          poId: invoiceForm.poId,
          registeredBy: invoiceForm.registeredBy,
        })
      } catch (error) {
        setFeedback({
          message: `${messages.receiptInvoice.actionFailed}: ${error instanceof Error ? error.message : ''}`,
          tone: 'danger',
        })
      }
    })()
  }

  return (
    <>
      {modalContextHolder}
      <section className="request-grid rfq-grid">
        <section className="panel request-list-panel">
          <PanelTitle icon={<InboxOutlined />} title={messages.receiptInvoice.list} aside={selectedCompany.companyName} />
          {isError && <div className="data-alert">{messages.receiptInvoice.unavailable}</div>}
          {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
          <div className="action-row">
            <DisabledActionTooltip title={fulfillmentRows.length === 0 ? messages.receiptInvoice.noIssuedPo : undefined}>
              <button
                className="primary-button"
                disabled={fulfillmentRows.length === 0}
                onClick={() => openCreateMode('receipt')}
                type="button"
              >
                <InboxOutlined />
                <span>{messages.receiptInvoice.createReceipt}</span>
              </button>
            </DisabledActionTooltip>
            <DisabledActionTooltip title={fulfillmentRows.length === 0 ? messages.receiptInvoice.noIssuedPo : undefined}>
              <button
                className="secondary-button"
                disabled={fulfillmentRows.length === 0}
                onClick={() => openCreateMode('invoice')}
                type="button"
              >
                <ProfileOutlined />
                <span>{messages.receiptInvoice.createInvoice}</span>
              </button>
            </DisabledActionTooltip>
          </div>
          <div className="table-wrap">
            <table className="request-table">
              <thead>
                <tr>
                  <th>PO</th>
                  <th>{messages.purchaseOrder.supplier}</th>
                  <th>{messages.rfq.totalAmount}</th>
                  <th>{messages.receiptInvoice.receivedQuantity}</th>
                  <th>{messages.receiptInvoice.invoicedQuantity}</th>
                  <th>{messages.receiptInvoice.variance}</th>
                  <th>{messages.purchaseRequest.status}</th>
                </tr>
              </thead>
              <tbody>
                {fulfillmentRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>{isLoading ? messages.receiptInvoice.loading : messages.receiptInvoice.empty}</td>
                  </tr>
                ) : (
                  fulfillmentRows.map((row) => (
                    <tr key={row.poId}>
                      <td>
                        <button
                          className={row.poId === selectedPoId ? 'row-link active' : 'row-link'}
                          onClick={() => openPoDetail(row.poId)}
                          type="button"
                        >
                          <TruncatedText text={row.poId} />
                        </button>
                      </td>
                      <td>
                        <TruncatedText text={row.supplierName} />
                      </td>
                      <td>{formatCurrency(row.poTotalAmount, row.currency, language)}</td>
                      <td>{`${row.receivedQuantity} / ${row.orderedQuantity}`}</td>
                      <td>{`${row.invoicedQuantity} / ${row.orderedQuantity}`}</td>
                      <td className={row.invoiceAmountStatus === 'VARIANCE' ? 'amount-danger' : undefined}>
                        {formatCurrency(row.invoiceAmountVariance, row.currency, language)}
                      </td>
                      <td>
                        <span className={`tag ${receiptProgressToneOf(row.receiptSummary)}`}>
                          {formatReceiptProgress(row.receiptSummary, messages)}
                        </span>
                        <span className={`tag ${invoiceProgressToneOf(row.invoiceSummary)}`}>
                          {formatInvoiceProgress(row.invoiceSummary, messages)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
        size={980}
      >
        {drawerMode === 'receipt' ? (
          <form className="request-form rfq-form" onSubmit={handleCreateReceipt}>
            <ReceiptInvoicePoSelect
              fulfillmentRows={fulfillmentRows}
              label={messages.receiptInvoice.sourcePo}
              messages={messages}
              onChange={updateReceiptPo}
              value={receiptForm.poId}
            />
            <label>
              <span>{messages.receiptInvoice.receiver}</span>
              <select
                required
                value={receiptForm.receivedBy}
                onChange={(event) => {
                  setCreateDirty(true)
                  setReceiptForm((current) => ({ ...current, receivedBy: event.target.value }))
                }}
              >
                {receiptUsers.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{messages.receiptInvoice.receivedDate}</span>
              <input
                required
                type="date"
                value={receiptForm.receivedDate}
                onChange={(event) => {
                  setCreateDirty(true)
                  setReceiptForm((current) => ({ ...current, receivedDate: event.target.value }))
                }}
              />
            </label>
            <ReceiptFormLines
              form={receiptForm}
              language={language}
              messages={messages}
              onQuantityChange={updateReceiptLine}
              po={fulfillmentRows.find((row) => row.poId === receiptForm.poId)}
            />
            <ReceiptInvoiceAttachmentFields
              description={receiptForm.fileDescription}
              file={receiptForm.file}
              fileName={receiptForm.fileName}
              messages={messages}
              onDescriptionChange={(value) => {
                setCreateDirty(true)
                setReceiptForm((current) => ({ ...current, fileDescription: value }))
              }}
              onFileChange={(file) => {
                setCreateDirty(true)
                setReceiptForm((current) => ({
                  ...current,
                  file,
                  fileName: file?.name ?? current.fileName,
                  uploadedAttachments: file ? [] : current.uploadedAttachments,
                }))
              }}
              pendingAttachment={receiptForm.uploadedAttachments[0] ?? (receiptForm.fileName
                ? {
                    attachmentId: '',
                    contentType: receiptForm.file?.type || 'image/jpeg',
                    description: receiptForm.fileDescription || null,
                    downloadable: false,
                    downloadDisabledReason: receiptForm.file
                      ? messages.rfq.pendingUploadReason
                      : messages.rfq.metadataOnlyReason,
                    downloadUrl: null,
                    originalFileName: receiptForm.fileName,
                    sizeBytes: receiptForm.file?.size ?? 0,
                    storageStatus: receiptForm.file ? 'PENDING' : 'METADATA_ONLY',
                  }
                : undefined)}
            />
            <label className="form-wide">
              <span>{messages.receiptInvoice.note}</span>
              <textarea
                value={receiptForm.note}
                onChange={(event) => {
                  setCreateDirty(true)
                  setReceiptForm((current) => ({ ...current, note: event.target.value }))
                }}
              />
            </label>
            <button className="primary-button form-wide" disabled={receiptMutation.isPending} type="submit">
              <InboxOutlined />
              <span>{messages.receiptInvoice.createReceipt}</span>
            </button>
          </form>
        ) : drawerMode === 'invoice' ? (
          <form className="request-form rfq-form" onSubmit={handleCreateInvoice}>
            <ReceiptInvoicePoSelect
              fulfillmentRows={fulfillmentRows}
              label={messages.receiptInvoice.sourcePo}
              messages={messages}
              onChange={updateInvoicePo}
              value={invoiceForm.poId}
            />
            <label>
              <span>{messages.receiptInvoice.invoiceNumber}</span>
              <input
                required
                value={invoiceForm.invoiceNumber}
                onChange={(event) => {
                  setCreateDirty(true)
                  setInvoiceForm((current) => ({ ...current, invoiceNumber: event.target.value }))
                }}
              />
            </label>
            <label>
              <span>{messages.receiptInvoice.invoiceDate}</span>
              <input
                required
                type="date"
                value={invoiceForm.invoiceDate}
                onChange={(event) => {
                  setCreateDirty(true)
                  setInvoiceForm((current) => ({ ...current, invoiceDate: event.target.value }))
                }}
              />
            </label>
            <label>
              <span>{messages.receiptInvoice.registeredBy}</span>
              <select
                required
                value={invoiceForm.registeredBy}
                onChange={(event) => {
                  setCreateDirty(true)
                  setInvoiceForm((current) => ({ ...current, registeredBy: event.target.value }))
                }}
              >
                {financeUsers.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </label>
            <InvoiceFormLines
              form={invoiceForm}
              language={language}
              messages={messages}
              onLineChange={updateInvoiceLine}
              po={fulfillmentRows.find((row) => row.poId === invoiceForm.poId)}
            />
            <ReceiptInvoiceAttachmentFields
              description={invoiceForm.fileDescription}
              file={invoiceForm.file}
              fileName={invoiceForm.fileName}
              messages={messages}
              onDescriptionChange={(value) => {
                setCreateDirty(true)
                setInvoiceForm((current) => ({ ...current, fileDescription: value }))
              }}
              onFileChange={(file) => {
                setCreateDirty(true)
                setInvoiceForm((current) => ({
                  ...current,
                  file,
                  fileName: file?.name ?? current.fileName,
                  uploadedAttachments: file ? [] : current.uploadedAttachments,
                }))
              }}
              pendingAttachment={invoiceForm.uploadedAttachments[0] ?? (invoiceForm.fileName
                ? {
                    attachmentId: '',
                    contentType: invoiceForm.file?.type || 'application/pdf',
                    description: invoiceForm.fileDescription || null,
                    downloadable: false,
                    downloadDisabledReason: invoiceForm.file
                      ? messages.rfq.pendingUploadReason
                      : messages.rfq.metadataOnlyReason,
                    downloadUrl: null,
                    originalFileName: invoiceForm.fileName,
                    sizeBytes: invoiceForm.file?.size ?? 0,
                    storageStatus: invoiceForm.file ? 'PENDING' : 'METADATA_ONLY',
                  }
                : undefined)}
            />
            <label className="form-wide">
              <span>{messages.receiptInvoice.note}</span>
              <textarea
                value={invoiceForm.note}
                onChange={(event) => {
                  setCreateDirty(true)
                  setInvoiceForm((current) => ({ ...current, note: event.target.value }))
                }}
              />
            </label>
            <button className="primary-button form-wide" disabled={invoiceMutation.isPending} type="submit">
              <ProfileOutlined />
              <span>{messages.receiptInvoice.createInvoice}</span>
            </button>
          </form>
        ) : selectedPo ? (
          <FulfillmentDetail
            invoices={relatedInvoices}
            language={language}
            messages={messages}
            onCreateInvoice={() => openCreateMode('invoice', selectedPo)}
            onCreateReceipt={() => openCreateMode('receipt', selectedPo)}
            po={selectedPo}
            receipts={relatedReceipts}
            users={users}
          />
        ) : (
          <div className="empty-state">{isLoading ? messages.receiptInvoice.loading : messages.receiptInvoice.empty}</div>
        )}
      </Drawer>
    </>
  )
}

function ReceiptInvoicePoSelect({
  fulfillmentRows,
  label,
  messages,
  onChange,
  value,
}: {
  fulfillmentRows: FulfillmentPurchaseOrder[]
  label: string
  messages: LocalizedMessages
  onChange: (poId: string) => void
  value: string
}) {
  return (
    <label className="form-wide">
      <span>{label}</span>
      <select disabled={fulfillmentRows.length === 0} required value={value} onChange={(event) => onChange(event.target.value)}>
        {fulfillmentRows.length === 0 ? (
          <option value="">{messages.receiptInvoice.noIssuedPo}</option>
        ) : (
          fulfillmentRows.map((row) => (
            <option key={row.poId} value={row.poId}>
              {row.poId} · {row.supplierName}
            </option>
          ))
        )}
      </select>
    </label>
  )
}

function ReceiptFormLines({
  form,
  language,
  messages,
  onQuantityChange,
  po,
}: {
  form: ReceiptCreateFormState
  language: Language
  messages: LocalizedMessages
  onQuantityChange: (poLineId: string, value: number) => void
  po?: FulfillmentPurchaseOrder
}) {
  if (!po) {
    return null
  }

  return (
    <section className="approval-section form-wide">
      <PanelTitle icon={<InboxOutlined />} title={messages.receiptInvoice.lineFulfillment} aside={messages.receiptInvoice.boundary} />
      <div className="table-wrap">
        <table className="request-table">
          <thead>
            <tr>
              <th>{messages.purchaseRequest.itemName}</th>
              <th>{messages.receiptInvoice.orderedQuantity}</th>
              <th>{messages.receiptInvoice.receivedQuantity}</th>
              <th>{messages.purchaseRequest.quantity}</th>
            </tr>
          </thead>
          <tbody>
            {po.lines.map((line) => {
              const formLine = form.lines.find((item) => item.poLineId === line.poLineId)
              const remaining = Math.max(0, roundAmount(line.orderedQuantity - line.receivedQuantity))
              return (
                <tr key={line.poLineId}>
                  <td>
                    <TruncatedText className="text-strong" text={line.itemName} />
                    {line.specification && <TruncatedText className="text-small" text={line.specification} />}
                  </td>
                  <td>{`${line.orderedQuantity} ${line.unit}`}</td>
                  <td>{`${line.receivedQuantity} ${line.unit}`}</td>
                  <td>
                    <input
                      className="inline-input"
                      min={0}
                      max={remaining}
                      step="0.01"
                      type="number"
                      value={formLine?.receivedQuantity ?? 0}
                      onChange={(event) => onQuantityChange(line.poLineId, Number(event.target.value))}
                    />
                    <small>{formatCurrency(line.confirmedAmount, po.currency, language)}</small>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function InvoiceFormLines({
  form,
  language,
  messages,
  onLineChange,
  po,
}: {
  form: InvoiceCreateFormState
  language: Language
  messages: LocalizedMessages
  onLineChange: (poLineId: string, key: InvoiceEditableLineKey, value: number) => void
  po?: FulfillmentPurchaseOrder
}) {
  if (!po) {
    return null
  }

  return (
    <section className="approval-section form-wide">
      <PanelTitle icon={<ProfileOutlined />} title={messages.receiptInvoice.lineFulfillment} aside={messages.receiptInvoice.boundary} />
      <div className="table-wrap">
        <table className="request-table">
          <thead>
            <tr>
              <th>{messages.purchaseRequest.itemName}</th>
              <th>{messages.receiptInvoice.invoicedQuantity}</th>
              <th>{messages.receiptInvoice.untaxedAmount}</th>
              <th>{messages.rfq.taxAmount}</th>
              <th>{messages.rfq.totalAmount}</th>
            </tr>
          </thead>
          <tbody>
            {po.lines.map((line) => {
              const formLine = form.lines.find((item) => item.poLineId === line.poLineId)
              const remaining = Math.max(0, roundAmount(line.orderedQuantity - line.invoicedQuantity))
              return (
                <tr key={line.poLineId}>
                  <td>
                    <TruncatedText className="text-strong" text={line.itemName} />
                    {line.specification && <TruncatedText className="text-small" text={line.specification} />}
                  </td>
                  <td>
                    <input
                      className="inline-input"
                      min={0}
                      max={remaining}
                      step="0.01"
                      type="number"
                      value={formLine?.invoicedQuantity ?? 0}
                      onChange={(event) => onLineChange(line.poLineId, 'invoicedQuantity', Number(event.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      className="inline-input"
                      min={0}
                      step="0.01"
                      type="number"
                      value={formLine?.untaxedAmount ?? 0}
                      onChange={(event) => onLineChange(line.poLineId, 'untaxedAmount', Number(event.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      className="inline-input"
                      min={0}
                      step="0.01"
                      type="number"
                      value={formLine?.taxAmount ?? 0}
                      onChange={(event) => onLineChange(line.poLineId, 'taxAmount', Number(event.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      className="inline-input"
                      min={0}
                      step="0.01"
                      type="number"
                      value={formLine?.totalAmount ?? 0}
                      onChange={(event) => onLineChange(line.poLineId, 'totalAmount', Number(event.target.value))}
                    />
                    <small>{formatCurrency(line.confirmedAmount, po.currency, language)}</small>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function ReceiptInvoiceAttachmentFields({
  description,
  file,
  fileName,
  messages,
  onDescriptionChange,
  onFileChange,
  pendingAttachment,
}: {
  description: string
  file: File | null
  fileName: string
  messages: LocalizedMessages
  onDescriptionChange: (value: string) => void
  onFileChange: (file: File | null) => void
  pendingAttachment?: UploadedAttachment
}) {
  return (
    <>
      <label>
        <span>{messages.receiptInvoice.attachmentFile}</span>
        <input
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
          type="file"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        {fileName && <small>{file?.name ?? fileName}</small>}
      </label>
      <label>
        <span>{messages.receiptInvoice.attachmentDescription}</span>
        <input value={description} onChange={(event) => onDescriptionChange(event.target.value)} />
      </label>
      {pendingAttachment && (
        <AttachmentList attachments={[pendingAttachment]} className="form-wide" messages={messages} />
      )}
    </>
  )
}

function FulfillmentDetail({
  invoices,
  language,
  messages,
  onCreateInvoice,
  onCreateReceipt,
  po,
  receipts,
  users,
}: {
  invoices: InvoiceListItem[]
  language: Language
  messages: LocalizedMessages
  onCreateInvoice: () => void
  onCreateReceipt: () => void
  po: FulfillmentPurchaseOrder
  receipts: ReceiptListItem[]
  users: UserSummary[]
}) {
  const receiptDisabledReason = po.receiptSummary === 'FULLY_RECEIVED' ? messages.receiptInvoice.fullyReceivedReason : undefined
  const invoiceDisabledReason = po.invoiceSummary === 'FULLY_INVOICED' ? messages.receiptInvoice.fullyInvoicedReason : undefined

  return (
    <div className="request-detail rfq-detail">
      <div className="detail-heading">
        <div>
          <TruncatedText className="text-strong" text={po.title} />
          <TruncatedText className="text-small" text={`${po.poId} · ${po.supplierName}`} />
        </div>
        <span className={`tag ${invoiceAmountToneOf(po.invoiceAmountStatus)}`}>
          {formatInvoiceAmountStatus(po.invoiceAmountStatus, messages)}
        </span>
      </div>
      <dl className="detail-grid">
        <div>
          <dt>{messages.purchaseOrder.supplier}</dt>
          <dd>{po.supplierName}</dd>
        </div>
        <div>
          <dt>{messages.rfq.totalAmount}</dt>
          <dd>{formatCurrency(po.poTotalAmount, po.currency, language)}</dd>
        </div>
        <div>
          <dt>{messages.receiptInvoice.receiptSummary}</dt>
          <dd>{formatReceiptProgress(po.receiptSummary, messages)}</dd>
        </div>
        <div>
          <dt>{messages.receiptInvoice.invoiceSummary}</dt>
          <dd>{formatInvoiceProgress(po.invoiceSummary, messages)}</dd>
        </div>
        <div>
          <dt>{messages.receiptInvoice.invoiceTotal}</dt>
          <dd>{formatCurrency(po.invoiceTotalAmount, po.currency, language)}</dd>
        </div>
        <div>
          <dt>{messages.receiptInvoice.variance}</dt>
          <dd>{formatCurrency(po.invoiceAmountVariance, po.currency, language)}</dd>
        </div>
        <div>
          <dt>{messages.receiptInvoice.attachments}</dt>
          <dd>{po.attachmentCount}</dd>
        </div>
      </dl>
      <div className="action-row">
        <DisabledActionTooltip title={receiptDisabledReason}>
          <button className="primary-button" disabled={Boolean(receiptDisabledReason)} onClick={onCreateReceipt} type="button">
            <InboxOutlined />
            <span>{messages.receiptInvoice.createReceipt}</span>
          </button>
        </DisabledActionTooltip>
        <DisabledActionTooltip title={invoiceDisabledReason}>
          <button className="secondary-button" disabled={Boolean(invoiceDisabledReason)} onClick={onCreateInvoice} type="button">
            <ProfileOutlined />
            <span>{messages.receiptInvoice.createInvoice}</span>
          </button>
        </DisabledActionTooltip>
      </div>
      <section className="approval-section">
        <PanelTitle icon={<ShoppingCartOutlined />} title={messages.receiptInvoice.lineFulfillment} />
        <div className="table-wrap">
          <table className="request-table">
            <thead>
              <tr>
                <th>{messages.purchaseRequest.itemName}</th>
                <th>{messages.receiptInvoice.orderedQuantity}</th>
                <th>{messages.receiptInvoice.receivedQuantity}</th>
                <th>{messages.receiptInvoice.invoicedQuantity}</th>
                <th>{messages.purchaseRequest.totalAmount}</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((line) => (
                <tr key={line.poLineId}>
                  <td>
                    <TruncatedText className="text-strong" text={line.itemName} />
                    {line.specification && <TruncatedText className="text-small" text={line.specification} />}
                  </td>
                  <td>{`${line.orderedQuantity} ${line.unit}`}</td>
                  <td>{`${line.receivedQuantity} ${line.unit}`}</td>
                  <td>{`${line.invoicedQuantity} ${line.unit}`}</td>
                  <td>{formatCurrency(line.confirmedAmount, po.currency, language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <ReceiptInvoiceRelatedTables invoices={invoices} language={language} messages={messages} receipts={receipts} users={users} />
    </div>
  )
}

function ReceiptInvoiceRelatedTables({
  invoices,
  language,
  messages,
  receipts,
  users,
}: {
  invoices: InvoiceListItem[]
  language: Language
  messages: LocalizedMessages
  receipts: ReceiptListItem[]
  users: UserSummary[]
}) {
  return (
    <>
      <section className="approval-section">
        <PanelTitle icon={<InboxOutlined />} title={messages.receiptInvoice.receiptList} />
        <div className="table-wrap">
          <table className="request-table">
            <thead>
              <tr>
                <th>{messages.receiptInvoice.receivedDate}</th>
                <th>{messages.receiptInvoice.receiver}</th>
                <th>{messages.receiptInvoice.receivedQuantity}</th>
                <th>{messages.receiptInvoice.attachments}</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={4}>{messages.receiptInvoice.notReceived}</td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.receiptId}>
                    <td>{formatDate(receipt.receivedDate, language)}</td>
                    <td>{userNameOf(receipt.receivedBy, users)}</td>
                    <td>{receipt.receivedQuantity}</td>
                    <td>
                      <AttachmentInlineList attachments={receipt.attachments} messages={messages} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="approval-section">
        <PanelTitle icon={<ProfileOutlined />} title={messages.receiptInvoice.invoiceList} />
        <div className="table-wrap">
          <table className="request-table">
            <thead>
              <tr>
                <th>{messages.receiptInvoice.invoiceNumber}</th>
                <th>{messages.receiptInvoice.invoiceDate}</th>
                <th>{messages.receiptInvoice.registeredBy}</th>
                <th>{messages.rfq.totalAmount}</th>
                <th>{messages.receiptInvoice.attachments}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5}>{messages.receiptInvoice.notInvoiced}</td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.invoiceId}>
                    <td>{invoice.invoiceNumber}</td>
                    <td>{formatDate(invoice.invoiceDate, language)}</td>
                    <td>{userNameOf(invoice.registeredBy, users)}</td>
                    <td>{formatCurrency(invoice.totalAmount, invoice.currency, language)}</td>
                    <td>
                      <AttachmentInlineList attachments={invoice.attachments} messages={messages} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export function AttachmentList({
  attachments,
  className,
  messages,
}: {
  attachments: UploadedAttachment[]
  className?: string
  messages: LocalizedMessages
}) {
  if (attachments.length === 0) {
    return null
  }

  return (
    <div className={`attachment-list ${className ?? ''}`.trim()}>
      {attachments.map((attachment, index) => {
        const disabledReason = attachment.downloadable ? undefined : attachment.downloadDisabledReason ?? messages.rfq.metadataOnlyReason
        return (
          <div className="attachment-row" key={attachment.attachmentId || `${attachment.originalFileName}-${index}`}>
            <FileAddOutlined />
            <span>{attachment.originalFileName}</span>
            <small>{attachment.storageStatus}</small>
            <DisabledActionTooltip title={disabledReason}>
              <button
                className="icon-action"
                disabled={Boolean(disabledReason)}
                onClick={() => openAttachmentDownload(attachment)}
                type="button"
              >
                <FileSearchOutlined />
                <span>{messages.rfq.downloadAttachment}</span>
              </button>
            </DisabledActionTooltip>
          </div>
        )
      })}
    </div>
  )
}

function AttachmentInlineList({
  attachments,
  messages,
}: {
  attachments: ReceiptInvoiceAttachment[]
  messages: LocalizedMessages
}) {
  if (attachments.length === 0) {
    return <>-</>
  }
  return (
    <div className="attachment-inline-list">
      {attachments.map((attachment) => (
        <AttachmentInlineAction attachment={attachment} key={attachment.attachmentId} messages={messages} />
      ))}
    </div>
  )
}

export function AttachmentInlineAction({
  attachment,
  messages,
}: {
  attachment: RfqQuoteAttachment | ReceiptInvoiceAttachment
  messages: LocalizedMessages
}) {
  const disabledReason = attachment.downloadable ? undefined : attachment.downloadDisabledReason ?? messages.rfq.metadataOnlyReason
  return (
    <DisabledActionTooltip title={disabledReason}>
      <button
        className="attachment-link"
        disabled={Boolean(disabledReason)}
        onClick={() => openAttachmentDownload(attachment)}
        type="button"
      >
        <FileAddOutlined />
        <span>{attachment.fileName}</span>
      </button>
    </DisabledActionTooltip>
  )
}

function ApprovalPath({
  messages,
  nodes,
  users,
}: {
  messages: LocalizedMessages
  nodes: ApprovalNode[]
  users: UserSummary[]
}) {
  return (
    <section className="approval-section">
      <PanelTitle icon={<NodeIndexOutlined />} title={messages.approval.path} />
      <div className="approval-path">
        {nodes.map((node) => (
          <div className={`approval-step ${approvalNodeToneOf(node.status)}`} key={node.nodeId}>
            <span>{node.stepOrder}</span>
            <div>
              <TruncatedText className="text-strong" text={node.nodeName} />
              <TruncatedText className="text-small" text={userNameOf(node.approverId, users)} />
            </div>
            <strong>{formatApprovalNodeStatus(node.status, messages)}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function ApprovalTimeline({
  language,
  messages,
  records,
  users,
}: {
  language: Language
  messages: LocalizedMessages
  records: ApprovalRecord[]
  users: UserSummary[]
}) {
  return (
    <section className="approval-section">
      <PanelTitle icon={<ProfileOutlined />} title={messages.approval.timeline} />
      <div className="timeline-list">
        {records.map((record) => (
          <div className="timeline-item" key={record.recordId}>
            <span className={`tag ${approvalActionToneOf(record.action)}`}>
              {formatApprovalAction(record.action, messages)}
            </span>
            <div>
              <TruncatedText className="text-strong" text={userNameOf(record.actorId, users)} />
              <TruncatedText
                className="text-small"
                text={`${formatDateTime(record.createdAt, language)}${record.comment ? ` · ${record.comment}` : ''}`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SupplierPoolView({
  categories,
  companies,
  context,
  isError,
  isLoading,
  language,
  messages,
  onCompanyChange,
  selectedCompany,
  selectedCompanyId,
  suppliers,
}: {
  categories: CategorySummary[]
  companies: CompanyContext[]
  context: DemoContext
  isError: boolean
  isLoading: boolean
  language: Language
  messages: LocalizedMessages
  onCompanyChange: (companyId: string) => void
  selectedCompany: CompanyContext
  selectedCompanyId: string
  suppliers: SupplierSummary[]
}) {
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [riskLevel, setRiskLevel] = useState('')
  const [supplierStatus, setSupplierStatus] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null)
  const normalizedKeyword = keyword.trim().toLowerCase()
  const riskLevels = Array.from(new Set(suppliers.map((supplier) => supplier.riskLevel))).sort()
  const supplierStatuses = Array.from(new Set(suppliers.map((supplier) => supplier.status))).sort()
  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchableText = [
      supplier.supplierName,
      supplier.serviceScope,
      supplier.location,
      supplier.riskLevel,
      supplier.status,
      supplier.sharedScope,
      ...supplier.categories.flatMap((category) => [category.categoryName, category.businessScope]),
    ]
      .join(' ')
      .toLowerCase()

    const matchesKeyword = normalizedKeyword.length === 0 || searchableText.includes(normalizedKeyword)
    const matchesCategory =
      categoryId.length === 0 || supplier.categories.some((category) => category.categoryId === categoryId)
    const matchesRisk = riskLevel.length === 0 || supplier.riskLevel === riskLevel
    const matchesStatus = supplierStatus.length === 0 || supplier.status === supplierStatus

    return matchesKeyword && matchesCategory && matchesRisk && matchesStatus
  })
  const hasFilters =
    normalizedKeyword.length > 0 ||
    categoryId.length > 0 ||
    riskLevel.length > 0 ||
    supplierStatus.length > 0
  const selectedSupplier = selectedSupplierId
    ? suppliers.find((supplier) => supplier.supplierId === selectedSupplierId) ?? null
    : null
  const emptyText = isLoading
    ? messages.supplierPool.loading
    : isError
      ? messages.supplierPool.unavailable
      : suppliers.length === 0
        ? messages.supplierPool.empty
        : messages.supplierPool.noResults

  const clearFilters = () => {
    setKeyword('')
    setCategoryId('')
    setRiskLevel('')
    setSupplierStatus('')
  }

  return (
    <section className="supplier-pool-page">
      <section className="panel supplier-pool-overview">
        <PanelTitle icon={<TeamOutlined />} title={messages.supplierPool.sharedPool} aside={messages.supplierPool.dataState} />
        <div className="foundation-summary supplier-pool-summary">
          <div className="summary-block">
            <span>{messages.boundary.groupShared}</span>
            <strong>{context.groupName}</strong>
            <small>{messages.supplierPool.groupBoundary}</small>
          </div>
          <div className="summary-block">
            <span>{messages.supplierPool.selectedCompany}</span>
            <strong>{selectedCompany.companyName}</strong>
            <small>{messages.supplierPool.companyHint}</small>
          </div>
          <div className="summary-block">
            <span>{messages.supplierPool.visibleSuppliers}</span>
            <strong>{filteredSuppliers.length}</strong>
            <small>{`${messages.supplierPool.totalSuppliers}: ${suppliers.length}`}</small>
          </div>
          <div className="summary-block">
            <span>{messages.supplierPool.coveredCategories}</span>
            <strong>{categories.length}</strong>
            <small>{context.supplierPoolScope}</small>
          </div>
        </div>

        <div className="company-switch" aria-label={messages.foundation.companySelector}>
          {companies.map((company) => (
            <button
              className={company.companyId === selectedCompanyId ? 'company-option active' : 'company-option'}
              key={company.companyId}
              onClick={() => onCompanyChange(company.companyId)}
              type="button"
            >
              <BankOutlined />
              <span>
                <strong>{company.companyName}</strong>
                <small>{company.businessScope}</small>
              </span>
              <em>{company.active ? messages.foundation.active : messages.foundation.inactive}</em>
            </button>
          ))}
        </div>

        <div className="boundary-matrix">
          <div>
            <span>{messages.boundary.groupShared}</span>
            <strong>{messages.supplierPool.groupBoundary}</strong>
          </div>
          <div>
            <span>{messages.boundary.companyIsolated}</span>
            <strong>{messages.supplierPool.companyBoundary}</strong>
          </div>
        </div>
        {isError && <div className="data-alert">{messages.supplierPool.unavailable}</div>}
      </section>

      <section className="panel supplier-pool-list-panel">
        <PanelTitle
          icon={<ProfileOutlined />}
          title={messages.supplierPool.list}
          aside={`${messages.supplierPool.resultCount}: ${filteredSuppliers.length}/${suppliers.length}`}
        />
        <div className="supplier-filter-bar" aria-label={messages.supplierPool.filter}>
          <label className="supplier-filter-keyword">
            <span>{messages.supplierPool.keyword}</span>
            <input
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={messages.supplierPool.keywordPlaceholder}
              type="search"
              value={keyword}
            />
          </label>
          <label>
            <span>{messages.supplierPool.category}</span>
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">{messages.supplierPool.allCategories}</option>
              {categories.map((category) => (
                <option key={category.categoryId} value={category.categoryId}>
                  {category.categoryName}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{messages.supplierPool.risk}</span>
            <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}>
              <option value="">{messages.supplierPool.allRisks}</option>
              {riskLevels.map((value) => (
                <option key={value} value={value}>
                  {formatRiskLevel(value, language)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{messages.supplierPool.status}</span>
            <select value={supplierStatus} onChange={(event) => setSupplierStatus(event.target.value)}>
              <option value="">{messages.supplierPool.allStatuses}</option>
              {supplierStatuses.map((value) => (
                <option key={value} value={value}>
                  {formatSupplierStatus(value, messages)}
                </option>
              ))}
            </select>
          </label>
          <button className="secondary-button" disabled={!hasFilters} onClick={clearFilters} type="button">
            <DeleteOutlined />
            <span>{messages.supplierPool.clearFilters}</span>
          </button>
        </div>

        <div className="table-wrap">
          <table className="foundation-table supplier-pool-table">
            <thead>
              <tr>
                <th>{messages.foundation.supplierPool}</th>
                <th>{messages.supplierPool.serviceScope}</th>
                <th>{messages.supplierPool.location}</th>
                <th>{messages.supplierPool.risk}</th>
                <th>{messages.supplierPool.status}</th>
                <th>{messages.supplierPool.coveredCategories}</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6}>{emptyText}</td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.supplierId}>
                    <td>
                      <button
                        className={supplier.supplierId === selectedSupplierId ? 'row-link active' : 'row-link'}
                        onClick={() => setSelectedSupplierId(supplier.supplierId)}
                        type="button"
                      >
                        <span>{supplier.supplierName}</span>
                      </button>
                      <small>{supplier.supplierId}</small>
                    </td>
                    <td>{supplier.serviceScope}</td>
                    <td>{supplier.location}</td>
                    <td>
                      <span className={`tag ${riskToneOf(supplier.riskLevel)}`}>
                        {formatRiskLevel(supplier.riskLevel, language)}
                      </span>
                    </td>
                    <td>
                      <span className="tag neutral">{formatSupplierStatus(supplier.status, messages)}</span>
                    </td>
                    <td>{supplier.categories.map((category) => category.categoryName).join(' / ')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Drawer
        className="request-drawer supplier-detail-drawer"
        destroyOnClose={false}
        onClose={() => setSelectedSupplierId(null)}
        open={selectedSupplier !== null}
        size="large"
        title={messages.supplierPool.detail}
      >
        {selectedSupplier && (
          <div className="request-detail">
            <div className="detail-heading">
              <div>
                <strong>{selectedSupplier.supplierName}</strong>
                <span>{selectedSupplier.supplierId}</span>
              </div>
              <span className={`tag ${riskToneOf(selectedSupplier.riskLevel)}`}>
                {formatRiskLevel(selectedSupplier.riskLevel, language)}
              </span>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>{messages.supplierPool.serviceScope}</dt>
                <dd>{selectedSupplier.serviceScope}</dd>
              </div>
              <div>
                <dt>{messages.supplierPool.location}</dt>
                <dd>{selectedSupplier.location}</dd>
              </div>
              <div>
                <dt>{messages.supplierPool.status}</dt>
                <dd>{formatSupplierStatus(selectedSupplier.status, messages)}</dd>
              </div>
              <div>
                <dt>{messages.supplierPool.sharedScope}</dt>
                <dd>{formatSupplierSharedScope(selectedSupplier.sharedScope, messages)}</dd>
              </div>
            </dl>
            <section className="line-items-card supplier-category-card">
              <div className="line-items-heading">
                <span>{messages.supplierPool.coveredCategories}</span>
                <strong>{selectedSupplier.categories.length}</strong>
              </div>
              <div className="supplier-category-tags">
                {selectedSupplier.categories.map((category) => (
                  <span className="tag" key={category.categoryId}>
                    {category.categoryName}
                  </span>
                ))}
              </div>
            </section>
            <div className="boundary-matrix supplier-detail-boundary">
              <div>
                <span>{messages.boundary.groupShared}</span>
                <strong>{messages.supplierPool.groupBoundary}</strong>
              </div>
              <div>
                <span>{messages.boundary.companyIsolated}</span>
                <strong>{messages.supplierPool.companyBoundary}</strong>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </section>
  )
}

function FoundationDataView({
  budgetAccounts,
  categories,
  companies,
  context,
  departments,
  isError,
  isLoading,
  language,
  messages,
  onCompanyChange,
  selectedCompany,
  selectedCompanyId,
  suppliers,
  users,
}: {
  budgetAccounts: BudgetAccountSummary[]
  categories: CategorySummary[]
  companies: CompanyContext[]
  context: DemoContext
  departments: DepartmentSummary[]
  isError: boolean
  isLoading: boolean
  language: Language
  messages: LocalizedMessages
  onCompanyChange: (companyId: string) => void
  selectedCompany: CompanyContext
  selectedCompanyId: string
  suppliers: SupplierSummary[]
  users: UserSummary[]
}) {
  const emptyText = isLoading ? messages.foundation.loading : messages.foundation.unavailable

  return (
    <section className="foundation-grid">
      <section className="panel foundation-overview">
        <PanelTitle icon={<DatabaseOutlined />} title={messages.foundation.groupContext} aside={messages.foundation.dataState} />
        <div className="foundation-summary">
          <div className="summary-block">
            <span>{messages.boundary.groupShared}</span>
            <strong>{context.groupName}</strong>
            <small>{context.supplierPoolScope}</small>
          </div>
          <div className="summary-block">
            <span>{messages.foundation.selectedCompany}</span>
            <strong>{selectedCompany.companyName}</strong>
            <small>{selectedCompany.businessScope}</small>
          </div>
        </div>

        <div className="company-switch" aria-label={messages.foundation.companySelector}>
          {companies.map((company) => (
            <button
              className={company.companyId === selectedCompanyId ? 'company-option active' : 'company-option'}
              key={company.companyId}
              onClick={() => onCompanyChange(company.companyId)}
              type="button"
            >
              <BankOutlined />
              <span>
                <strong>{company.companyName}</strong>
                <small>{company.businessScope}</small>
              </span>
              <em>{company.active ? messages.foundation.active : messages.foundation.inactive}</em>
            </button>
          ))}
        </div>

        <div className="boundary-matrix">
          <div>
            <span>{messages.boundary.groupShared}</span>
            <strong>{context.dataBoundary.groupShared}</strong>
          </div>
          <div>
            <span>{messages.foundation.companyScoped}</span>
            <strong>{context.dataBoundary.companyIsolated}</strong>
          </div>
        </div>
        {isError && <div className="data-alert">{messages.foundation.unavailable}</div>}
      </section>

      <section className="panel supplier-panel">
        <PanelTitle icon={<TeamOutlined />} title={messages.foundation.supplierPool} aside={messages.foundation.shared} />
        <div className="table-wrap">
          <table className="foundation-table">
            <thead>
              <tr>
                <th>{messages.foundation.supplierPool}</th>
                <th>{messages.foundation.serviceScope}</th>
                <th>{messages.foundation.location}</th>
                <th>{messages.foundation.risk}</th>
                <th>{messages.foundation.category}</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5}>{emptyText}</td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.supplierId}>
                    <td>
                      <strong>{supplier.supplierName}</strong>
                    </td>
                    <td>{supplier.serviceScope}</td>
                    <td>{supplier.location}</td>
                    <td>
                      <span className={`tag ${riskToneOf(supplier.riskLevel)}`}>
                        {formatRiskLevel(supplier.riskLevel, language)}
                      </span>
                    </td>
                    <td>{supplier.categories.map((category) => category.categoryName).join(' / ')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <PanelTitle icon={<ProfileOutlined />} title={messages.foundation.departmentsUsers} aside={selectedCompany.companyName} />
        <div className="foundation-columns">
          <div className="reference-list">
            {departments.length === 0 ? (
              <div className="reference-row">{emptyText}</div>
            ) : (
              departments.map((department) => (
                <div className="reference-row" key={department.departmentId}>
                  <strong>{department.departmentName}</strong>
                  <span>{department.functionScope}</span>
                </div>
              ))
            )}
          </div>
          <div className="table-wrap">
            <table className="foundation-table">
              <thead>
                <tr>
                  <th>{messages.foundation.user}</th>
                  <th>{messages.foundation.department}</th>
                  <th>{messages.foundation.role}</th>
                  <th>{messages.foundation.status}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4}>{emptyText}</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <strong>{user.displayName}</strong>
                        <small>{user.positionTitle}</small>
                      </td>
                      <td>{user.departmentName}</td>
                      <td>{user.roles.map((role) => role.roleName).join(' / ')}</td>
                      <td>
                        <span className="tag">{user.active ? messages.foundation.active : messages.foundation.inactive}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="panel reference-panel">
        <PanelTitle icon={<ApiOutlined />} title={messages.foundation.categories} aside={messages.foundation.groupLevel} />
        <div className="reference-list category-list">
          {categories.length === 0 ? (
            <div className="reference-row">{emptyText}</div>
          ) : (
            categories.map((category) => (
              <div className="reference-row" key={category.categoryId}>
                <strong>{category.categoryName}</strong>
                <span>{category.businessScope}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel budget-panel">
        <PanelTitle icon={<SafetyCertificateOutlined />} title={messages.foundation.budgetAccounts} aside={messages.foundation.companyScoped} />
        <div className="table-wrap">
          <table className="foundation-table">
            <thead>
              <tr>
                <th>{messages.foundation.account}</th>
                <th>{messages.foundation.category}</th>
                <th>{messages.foundation.annualBudget}</th>
                <th>{messages.foundation.availableBudget}</th>
                <th>{messages.foundation.status}</th>
              </tr>
            </thead>
            <tbody>
              {budgetAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5}>{emptyText}</td>
                </tr>
              ) : (
                budgetAccounts.map((account) => (
                  <tr key={account.budgetAccountId}>
                    <td>
                      <strong>{account.accountName}</strong>
                    </td>
                    <td>{account.categoryName}</td>
                    <td>{formatCurrency(account.annualBudgetAmount, account.currency, language)}</td>
                    <td>{formatCurrency(account.availableAmount, account.currency, language)}</td>
                    <td>
                      <span className="tag">{account.active ? messages.foundation.active : messages.foundation.inactive}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function StatusPill({
  status,
  isError,
  label,
}: {
  status: string
  isError: boolean
  label: string
}) {
  const state = isError ? 'OFFLINE' : status

  return (
    <span className={state === 'UP' ? 'status-pill online' : 'status-pill'}>
      <CheckCircleOutlined />
      {label} {state}
    </span>
  )
}

function TruncatedText({ className = '', text }: { className?: string; text: string }) {
  const textRef = useRef<HTMLSpanElement>(null)
  const [isTruncated, setTruncated] = useState(false)

  useEffect(() => {
    const element = textRef.current
    if (!element) {
      return
    }

    const updateTruncation = () => {
      setTruncated(element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)
    }

    updateTruncation()
    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(updateTruncation)
    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [text])

  return (
    <span
      className={className ? `truncated-text ${className}` : 'truncated-text'}
      ref={textRef}
      title={isTruncated ? text : undefined}
    >
      {text}
    </span>
  )
}

function DisabledActionTooltip({
  children,
  className = '',
  title,
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  if (!title) {
    return <>{children}</>
  }

  return (
    <Tooltip title={title} trigger={['hover', 'focus']}>
      <span className={className ? `disabled-tooltip-wrap ${className}` : 'disabled-tooltip-wrap'} title={title}>{children}</span>
    </Tooltip>
  )
}

function AiResultPanel({
  isLoading = false,
  language,
  messages,
  response,
  title,
}: {
  isLoading?: boolean
  language: Language
  messages: LocalizedMessages
  response: AiAssistantResponse | null
  title?: string
}) {
  if (!response && !isLoading) {
    return null
  }

  return (
    <section aria-busy={isLoading} className="ai-result-panel">
      <PanelTitle icon={<ApiOutlined />} title={title ?? messages.ai.result} aside={messages.ai.dataState} />
      {isLoading ? (
        <div className="ai-loading-state" role="status">
          <LoadingOutlined className="ai-loading-icon" />
          <div>
            <strong>{messages.ai.generating}</strong>
            <span>{messages.ai.generatingDescription}</span>
          </div>
        </div>
      ) : null}
      {response ? (
        <>
          <dl className="ai-meta">
            <div>
              <dt>{messages.ai.invocation}</dt>
              <dd>{response.invocationId}</dd>
            </div>
            <div>
              <dt>{messages.ai.model}</dt>
              <dd>{response.model}</dd>
            </div>
            <div>
              <dt>{messages.ai.generatedAt}</dt>
              <dd>{formatDateTime(response.generatedAt, language)}</dd>
            </div>
          </dl>
          <AiResultBody language={language} messages={messages} response={response} />
        </>
      ) : null}
    </section>
  )
}

function AiResultBody({
  language,
  messages,
  response,
}: {
  language: Language
  messages: LocalizedMessages
  response: AiAssistantResponse
}) {
  if (response.scenario === 'PURCHASE_REQUEST_DRAFT') {
    const result = response.result as AiDraftPreviewResult
    return (
      <div className="ai-result-content">
        <AiSummaryLine label={messages.purchaseRequest.title} value={result.title} />
        <AiSummaryLine label={messages.ai.businessPurpose} value={result.businessPurpose} />
        <AiSummaryLine label={messages.purchaseRequest.totalAmount} value={formatOptionalCurrency(result.totalAmount, result.currency, language)} />
        <AiListBlock title={messages.ai.missingFields} values={result.missingFields} />
        <AiListBlock title={messages.ai.confidenceNotes} values={result.confidenceNotes} />
      </div>
    )
  }

  if (response.scenario === 'PURCHASE_REQUEST_RISK') {
    const result = response.result as AiRiskReviewResult
    return (
      <div className="ai-result-content">
        <AiSummaryLine label={messages.ai.riskLevel} value={result.riskLevel} />
        <AiSummaryLine
          label={messages.ai.continueRecommended}
          value={typeof result.continueRecommended === 'boolean' ? String(result.continueRecommended) : undefined}
        />
        <AiObjectListBlock
          title={messages.ai.riskItems}
          values={result.riskItems?.map((item) => ({
            title: item.title ?? item.severity ?? '',
            description: item.evidence ?? '',
          }))}
        />
        <AiListBlock title={messages.ai.suggestedActions} values={result.suggestedActions} />
        <AiListBlock title={messages.ai.followUpQuestions} values={result.followUpQuestions} />
      </div>
    )
  }

  if (response.scenario === 'RFQ_QUOTE_EXPLANATION') {
    const result = response.result as AiRfqExplanationResult
    return (
      <div className="ai-result-content">
        <AiSummaryLine label={messages.ai.result} value={result.summary} />
        <AiSummaryLine label={messages.ai.confidence} value={result.confidenceLevel} />
        <AiObjectListBlock
          title={messages.ai.supplierInsights}
          values={result.supplierInsights?.map((item) => ({
            title: item.supplierId ?? '',
            description: item.assessment ?? '',
          }))}
        />
        <AiListBlock title={messages.ai.keyDifferences} values={result.keyDifferences} />
        <AiListBlock title={messages.ai.riskNotes} values={result.riskNotes} />
        <AiListBlock title={messages.ai.followUpQuestions} values={result.questionsToConfirm} />
      </div>
    )
  }

  const result = response.result as AiMatchingExplanationResult
  return (
    <div className="ai-result-content">
      <AiSummaryLine label={messages.ai.result} value={result.summary} />
      <AiSummaryLine label={messages.ai.confidence} value={result.confidenceLevel} />
      <AiObjectListBlock
        title={messages.ai.differenceInsights}
        values={result.differenceInsights?.map((item) => ({
          title: item.differenceId ?? '',
          description: item.assessment ?? item.suggestedManualAction ?? '',
        }))}
      />
      <AiListBlock title={messages.ai.likelyCauses} values={result.likelyCauses} />
      <AiListBlock title={messages.ai.suggestedActions} values={result.suggestedActions} />
      <AiListBlock title={messages.ai.requiredFollowUpData} values={result.requiredFollowUpData} />
    </div>
  )
}

function AiSummaryLine({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null
  }

  return (
    <div className="ai-summary-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function AiListBlock({ title, values }: { title: string; values?: string[] }) {
  const visible = values?.filter(Boolean) ?? []
  if (visible.length === 0) {
    return null
  }

  return (
    <div className="ai-list-block">
      <strong>{title}</strong>
      <ul>
        {visible.map((value, index) => (
          <li key={`${title}-${index}`}>{value}</li>
        ))}
      </ul>
    </div>
  )
}

function AiObjectListBlock({ title, values }: { title: string; values?: Array<{ title: string; description: string }> }) {
  const visible = values?.filter((value) => value.title || value.description) ?? []
  if (visible.length === 0) {
    return null
  }

  return (
    <div className="ai-list-block">
      <strong>{title}</strong>
      <ul>
        {visible.map((value, index) => (
          <li key={`${title}-${index}`}>
            {value.title && <b>{value.title}</b>}
            {value.description && <span>{value.title ? `: ${value.description}` : value.description}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatOptionalCurrency(value: number | undefined, currency: string | undefined, language: Language) {
  return typeof value === 'number' ? formatCurrency(value, currency ?? 'CNY', language) : undefined
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

export function NotificationPanel({
  messages,
  notifications,
  onDismiss,
  onSelect,
}: {
  messages: LocalizedMessages
  notifications: readonly NotificationItem[]
  onDismiss: (notificationId: string) => void
  onSelect: (notification: NotificationItem) => void
}) {
  return (
    <section className="notification-panel" aria-label={messages.notificationCenter.title}>
      <div className="notification-panel-header">
        <strong>{messages.notificationCenter.title}</strong>
        <span>{notifications.length}</span>
      </div>
      {notifications.length === 0 ? (
        <div className="notification-empty">{messages.notificationCenter.empty}</div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article className={`notification-item ${notification.tone}`} key={notification.id}>
              <button
                aria-label={`${notification.title}: ${notification.description}`}
                className="notification-open"
                onClick={() => {
                  onDismiss(notification.id)
                  onSelect(notification)
                }}
                type="button"
              >
                <span className="notification-item-icon">{notificationIconOf(notification.tone)}</span>
                <span className="notification-item-body">
                  <strong>{notification.title}</strong>
                  <p>{notification.description}</p>
                  <small>{notification.time}</small>
                </span>
              </button>
              <button
                aria-label={`${messages.notificationCenter.dismiss}: ${notification.title}`}
                className="notification-dismiss"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onDismiss(notification.id)
                }}
                type="button"
              >
                <CloseOutlined />
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function notificationIconOf(tone: NotificationItem['tone']) {
  if (tone === 'warning') {
    return <AlertOutlined />
  }
  if (tone === 'success') {
    return <CheckCircleOutlined />
  }

  return <AuditOutlined />
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

function formatCurrency(value: number, currency: string, language: Language) {
  return new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    currency,
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function formatRiskLevel(riskLevel: string, language: Language) {
  const labels =
    language === 'zh'
      ? { high: '高', low: '低', medium: '中' }
      : { high: 'High', low: 'Low', medium: 'Medium' }

  return labels[riskLevel as keyof typeof labels] ?? riskLevel
}

function riskToneOf(riskLevel: string) {
  if (riskLevel === 'high') {
    return 'danger'
  }

  return riskLevel === 'medium' ? 'warn' : ''
}

function formatSupplierStatus(status: string, messages: LocalizedMessages) {
  if (status === 'active') {
    return messages.supplierPool.active
  }
  if (status === 'inactive') {
    return messages.supplierPool.inactive
  }
  return status
}

function formatSupplierSharedScope(sharedScope: string, messages: LocalizedMessages) {
  return sharedScope === 'group-shared' ? messages.supplierPool.groupSharedValue : sharedScope
}

function createLineKey() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getViewportCenter() {
  return {
    x: window.scrollX + window.innerWidth / 2,
    y: window.scrollY + window.innerHeight / 2,
  }
}

function createPurchaseRequestFormLine(
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

function lineAmountOf(line: PurchaseRequestFormLine) {
  const quantity = Number.isFinite(line.quantity) ? line.quantity : 0
  const unitPrice = Number.isFinite(line.estimatedUnitPrice) ? line.estimatedUnitPrice : 0

  return roundAmount(quantity * unitPrice)
}

function buildPurchaseRequestFormDefaults(
  selectedCompanyId: string,
  users: UserSummary[],
  categories: CategorySummary[],
  budgetAccounts: BudgetAccountSummary[],
  suppliers: SupplierSummary[],
): PurchaseRequestFormState {
  const requester =
    users.find((user) => user.roles.some((role) => role.roleId === 'role-applicant')) ??
    users.find((user) => user.active) ??
    users[0]
  const defaultCategory = categories[0]
  const budgetAccount =
    budgetAccounts.find((account) => account.categoryId === defaultCategory?.categoryId && account.active) ??
    budgetAccounts.find((account) => account.active) ??
    budgetAccounts[0]
  const categoryId = budgetAccount?.categoryId ?? defaultCategory?.categoryId ?? ''
  const supplier = preferredSupplierForCategory(categoryId, suppliers)

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
    supplierId: supplier?.supplierId ?? '',
    title: '20 台笔记本采购',
  }
}

function formatPurchaseRequestStatus(status: PurchaseRequestStatus, messages: LocalizedMessages) {
  return status === 'SUBMITTED' ? messages.purchaseRequest.submitted : messages.purchaseRequest.draft
}

function statusToneOf(status: PurchaseRequestStatus) {
  return status === 'SUBMITTED' ? 'success' : 'warn'
}

function currentStepOf(
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

function formatApprovalStatus(status: ApprovalInstanceStatus, messages: LocalizedMessages) {
  const labels = {
    APPROVED: messages.approval.approved,
    IN_PROGRESS: messages.approval.inProgress,
    REJECTED: messages.approval.rejected,
    WITHDRAWN: messages.approval.withdrawn,
  }

  return labels[status] ?? messages.approval.unknown
}

function approvalStatusToneOf(status: ApprovalInstanceStatus) {
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

function formatApprovalNodeStatus(status: ApprovalNodeStatus, messages: LocalizedMessages) {
  const labels = {
    ACTIVE: messages.approval.active,
    APPROVED: messages.approval.approved,
    CANCELLED: messages.approval.cancelled,
    PENDING: messages.approval.pending,
    REJECTED: messages.approval.rejected,
  }

  return labels[status] ?? messages.approval.unknown
}

function approvalNodeToneOf(status: ApprovalNodeStatus) {
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

function formatApprovalAction(action: ApprovalAction, messages: LocalizedMessages) {
  const labels = {
    APPROVED: messages.approval.approvedAction,
    CREATED: messages.approval.created,
    REJECTED: messages.approval.rejectedAction,
    WITHDRAWN: messages.approval.withdrawnAction,
  }

  return labels[action] ?? messages.approval.unknown
}

function approvalActionToneOf(action: ApprovalAction) {
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

function contextText(snapshot: Record<string, unknown>, key: string) {
  const value = snapshot[key]
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

function contextAmount(snapshot: Record<string, unknown>, key: string) {
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

function categoryNameOf(categoryId: string, categories: CategorySummary[]) {
  return categories.find((category) => category.categoryId === categoryId)?.categoryName ?? categoryId
}

function budgetNameOf(budgetAccountId: string, budgetAccounts: BudgetAccountSummary[]) {
  return budgetAccounts.find((account) => account.budgetAccountId === budgetAccountId)?.accountName ?? budgetAccountId
}

function userNameOf(userId: string, users: UserSummary[]) {
  return users.find((user) => user.userId === userId)?.displayName ?? userId
}

function supplierNameOf(supplierId: string | null, suppliers: SupplierSummary[], messages: LocalizedMessages) {
  if (!supplierId) {
    return messages.purchaseRequest.noSupplier
  }

  return suppliers.find((supplier) => supplier.supplierId === supplierId)?.supplierName ?? supplierId
}

function preferredSupplierForCategory(categoryId: string, suppliers: SupplierSummary[], currentSupplierId?: string) {
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

function suppliersForCategory(categoryId: string, suppliers: SupplierSummary[]) {
  return suppliers.filter((supplier) => supplier.categories.some((category) => category.categoryId === categoryId))
}

function uploadedFromRfqAttachment(attachment: RfqQuoteAttachment): UploadedAttachment {
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

function attachmentDownloadUrl(attachment: {
  attachmentId: string
  downloadable?: boolean | null
  downloadUrl?: string | null
}) {
  if (attachment.downloadUrl) {
    return attachment.downloadUrl.startsWith('http') ? attachment.downloadUrl : `${apiBaseUrl}${attachment.downloadUrl}`
  }
  return attachment.downloadable ? `${apiBaseUrl}/api/attachments/${encodeURIComponent(attachment.attachmentId)}/download` : null
}

function openAttachmentDownload(attachment: {
  attachmentId: string
  downloadable?: boolean | null
  downloadUrl?: string | null
}) {
  const url = attachmentDownloadUrl(attachment)
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

function buildRfqCreateFormDefaults(
  selectedCompanyId: string,
  approvedRequests: PurchaseRequestListItem[],
  suppliers: SupplierSummary[],
  buyers: UserSummary[],
): RfqCreateFormState {
  const request = approvedRequests.find((item) => item.companyId === selectedCompanyId) ?? approvedRequests[0]
  const candidateSuppliers = suppliersForCategory(request?.categoryId ?? '', suppliers)
  const buyer =
    buyers.find((user) => user.companyId === selectedCompanyId) ??
    buyers[0]

  return {
    procurementUserId: buyer?.userId ?? '',
    requestId: request?.requestId ?? '',
    supplierIds: candidateSuppliers.slice(0, 3).map((supplier) => supplier.supplierId),
    title: request ? defaultRfqTitle(request.title) : '',
  }
}

function defaultRfqTitle(requestTitle: string): string {
  const normalizedTitle = requestTitle.trim()
  return normalizedTitle.endsWith('询价') ? normalizedTitle : `${normalizedTitle}询价`
}

function buildRfqQuoteFormDefaults(detail?: RfqDetail, preferredSupplierId?: string): RfqQuoteFormState {
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

function buildPurchaseOrderCreateFormDefaults(
  selectedCompanyId: string,
  eligibleRfqs: RfqListItem[],
  buyers: UserSummary[],
): PurchaseOrderCreateFormState {
  const rfq = eligibleRfqs.find((item) => item.companyId === selectedCompanyId) ?? eligibleRfqs[0]
  const buyer =
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

function buildReceiptCreateFormDefaults(
  fulfillmentRows: FulfillmentPurchaseOrder[],
  users: UserSummary[],
  selectedCompanyId: string,
  preferredPoId?: string,
): ReceiptCreateFormState {
  const po =
    fulfillmentRows.find((row) => row.poId === preferredPoId) ??
    fulfillmentRows.find((row) => row.receiptSummary !== 'FULLY_RECEIVED') ??
    fulfillmentRows[0]
  const receiver =
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

function buildInvoiceCreateFormDefaults(
  fulfillmentRows: FulfillmentPurchaseOrder[],
  users: UserSummary[],
  selectedCompanyId: string,
  preferredPoId?: string,
): InvoiceCreateFormState {
  const po =
    fulfillmentRows.find((row) => row.poId === preferredPoId) ??
    fulfillmentRows.find((row) => row.invoiceSummary !== 'FULLY_INVOICED') ??
    fulfillmentRows[0]
  const registeredUser =
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

function nextDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatRfqStatus(status: RfqStatus, messages: LocalizedMessages) {
  const labels = {
    COMPARISON_READY: messages.rfq.comparisonReady,
    ISSUED: messages.rfq.issued,
    QUOTING: messages.rfq.quoting,
  }

  return labels[status] ?? status
}

function rfqStatusToneOf(status: RfqStatus) {
  if (status === 'COMPARISON_READY') {
    return 'success'
  }
  if (status === 'QUOTING') {
    return 'warn'
  }
  return 'neutral'
}

function formatPurchaseOrderStatus(status: PurchaseOrderStatus, messages: LocalizedMessages) {
  const labels = {
    CANCELLED: messages.purchaseOrder.cancelled,
    DRAFT: messages.purchaseOrder.draft,
    ISSUED: messages.purchaseOrder.issued,
  }

  return labels[status] ?? status
}

function purchaseOrderStatusToneOf(status: PurchaseOrderStatus) {
  if (status === 'ISSUED') {
    return 'success'
  }
  if (status === 'CANCELLED') {
    return 'danger'
  }
  return 'neutral'
}

function formatPurchaseOrderAction(action: PurchaseOrderAction, messages: LocalizedMessages) {
  const labels = {
    CANCELLED: messages.purchaseOrder.cancelledAction,
    CREATED: messages.purchaseOrder.createdAction,
    PUBLISHED: messages.purchaseOrder.publishedAction,
  }

  return labels[action] ?? action
}

function formatReceiptProgress(status: ReceiptProgressStatus, messages: LocalizedMessages) {
  const labels = {
    FULLY_RECEIVED: messages.receiptInvoice.fullyReceived,
    NOT_RECEIVED: messages.receiptInvoice.notReceived,
    PARTIALLY_RECEIVED: messages.receiptInvoice.partiallyReceived,
  }

  return labels[status] ?? status
}

function receiptProgressToneOf(status: ReceiptProgressStatus) {
  if (status === 'FULLY_RECEIVED') {
    return 'success'
  }
  if (status === 'PARTIALLY_RECEIVED') {
    return 'warn'
  }
  return 'neutral'
}

function formatInvoiceProgress(status: InvoiceProgressStatus, messages: LocalizedMessages) {
  const labels = {
    FULLY_INVOICED: messages.receiptInvoice.fullyInvoiced,
    NOT_INVOICED: messages.receiptInvoice.notInvoiced,
    PARTIALLY_INVOICED: messages.receiptInvoice.partiallyInvoiced,
  }

  return labels[status] ?? status
}

function invoiceProgressToneOf(status: InvoiceProgressStatus) {
  if (status === 'FULLY_INVOICED') {
    return 'success'
  }
  if (status === 'PARTIALLY_INVOICED') {
    return 'warn'
  }
  return 'neutral'
}

function formatInvoiceAmountStatus(status: InvoiceAmountStatus, messages: LocalizedMessages) {
  const labels = {
    MATCHED: messages.receiptInvoice.matched,
    NOT_INVOICED: messages.receiptInvoice.notInvoiced,
    VARIANCE: messages.receiptInvoice.amountVariance,
  }

  return labels[status] ?? status
}

function invoiceAmountToneOf(status: InvoiceAmountStatus) {
  if (status === 'VARIANCE') {
    return 'danger'
  }
  if (status === 'MATCHED') {
    return 'success'
  }
  return 'neutral'
}

function formatMatchStatus(status: ThreeWayMatchStatus, messages: LocalizedMessages) {
  const labels = {
    EXCEPTION: messages.matching.exception,
    MATCHED: messages.matching.matched,
    PENDING_INPUT: messages.matching.pendingInput,
    RESOLVED: messages.matching.resolved,
  }

  return labels[status] ?? status
}

function matchStatusToneOf(status: ThreeWayMatchStatus) {
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

function formatMatchSeverity(severity: ThreeWayMatchSeverity, messages: LocalizedMessages) {
  const labels = {
    HIGH: messages.matching.high,
    LOW: messages.matching.low,
    MEDIUM: messages.matching.medium,
  }

  return labels[severity] ?? severity
}

function severityToneOf(severity: ThreeWayMatchSeverity) {
  if (severity === 'HIGH') {
    return 'danger'
  }
  if (severity === 'MEDIUM') {
    return 'warn'
  }
  return 'neutral'
}

function formatDifferenceType(type: ThreeWayMatchDifferenceType, messages: LocalizedMessages) {
  const labels = {
    INVOICE_AMOUNT_MISMATCH: messages.matching.amountMismatch,
    INVOICE_QUANTITY_OVER_RECEIPT: messages.matching.invoiceOverReceipt,
    MISSING_INVOICE: messages.matching.missingInvoice,
    MISSING_RECEIPT: messages.matching.missingReceipt,
    RECEIPT_QUANTITY_SHORT: messages.matching.receiptShort,
  }

  return labels[type] ?? type
}

function formatMatchAction(action: ThreeWayMatchActionType, messages: LocalizedMessages) {
  const labels = {
    ACKNOWLEDGE: messages.matching.acknowledge,
    MARK_IN_PROGRESS: messages.matching.markInProgress,
    REOPEN: messages.matching.reopen,
    RESOLVE: messages.matching.resolve,
  }

  return labels[action] ?? action
}

function formatDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatDateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function roundAmount(value: number) {
  return Math.round(value * 100) / 100
}

function ProcureflowMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" focusable="false">
      <path d="M16 4.5 25 9.7v10.4l-9 5.2-9-5.2V9.7L16 4.5Z" />
      <path d="M7 9.7 16 14.9l9-5.2M16 14.9v10.4" />
      <path d="M11.5 7.1 20.5 12.3M20.5 7.1 11.5 12.3" />
    </svg>
  )
}

function PanelTitle({
  icon,
  title,
  aside,
}: {
  icon: ReactNode
  title: string
  aside?: string
}) {
  return (
    <div className="panel-title">
      <strong>
        {icon}
        {title}
      </strong>
      {aside && <span>{aside}</span>}
    </div>
  )
}

function App() {
  const [language, setLanguage] = useState<Language>(getInitialLanguage)
  const toggleLanguage = () => {
    setLanguage((current) => (current === 'zh' ? 'en' : 'zh'))
  }

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  return (
    <ConfigProvider theme={themeConfig} locale={antdLocales[language]}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
            />
            <Route
              path="/master-data"
              element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
            />
            <Route
              path="/suppliers"
              element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
            />
            <Route
              path="/purchase-requests"
              element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
            />
            <Route
              path="/approvals"
              element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
            />
            <Route
              path="/rfqs"
              element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
            />
            <Route
              path="/purchase-orders"
              element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
            />
            <Route
              path="/receipts-invoices"
              element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
            />
            <Route
              path="/three-way-matching"
              element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  )
}

export default App
