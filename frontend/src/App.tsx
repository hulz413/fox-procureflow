import {
  AlertOutlined,
  ApiOutlined,
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  FileAddOutlined,
  FileSearchOutlined,
  InboxOutlined,
  LogoutOutlined,
  NodeIndexOutlined,
  PlusOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  SwapOutlined,
  TeamOutlined,
  TranslationOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { keepPreviousData, QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, ConfigProvider, Drawer, Dropdown, Layout, Modal, Select, Tooltip } from 'antd'
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

const demoContext: DemoContext = {
  groupId: 'group-xinghe',
  groupName: '星河控股集团',
  activeCompany: {
    companyId: 'company-digital',
    companyName: '星河数字科技有限公司',
    businessScope: 'IT 设备、软件订阅、办公采购',
    active: true,
  },
  companies: [
    {
      companyId: 'company-digital',
      companyName: '星河数字科技有限公司',
      businessScope: 'IT 设备、软件订阅、办公采购',
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
    companyIsolated: '采购申请、审批实例、RFQ、PO、收货、发票、三单匹配结果',
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

const localizedContent = {
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
      title: '采购工作台',
      foundationTitle: '组织与主数据',
      purchaseRequestsTitle: '采购申请',
      approvalsTitle: '审批中心',
    },
    actions: {
      newRequest: '新建申请',
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
      { label: '采购工作台', icon: <DashboardOutlined />, path: '/' },
      { label: '采购申请', icon: <FileAddOutlined />, path: '/purchase-requests' },
      { label: '审批中心', icon: <AuditOutlined />, path: '/approvals' },
      { label: '询报价', icon: <FileSearchOutlined /> },
      { label: '采购订单', icon: <ShoppingCartOutlined /> },
      { label: '收货发票', icon: <InboxOutlined /> },
      { label: '三单匹配', icon: <SwapOutlined /> },
      { label: '供应商池', icon: <TeamOutlined />, count: '5' },
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
      title: 'Procurement Workspace',
      foundationTitle: 'Organization & Master Data',
      purchaseRequestsTitle: 'Purchase Requests',
      approvalsTitle: 'Approval Center',
    },
    actions: {
      newRequest: 'New Request',
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
      { label: 'RFQ', icon: <FileSearchOutlined /> },
      { label: 'Purchase Orders', icon: <ShoppingCartOutlined /> },
      { label: 'Receiving & Invoices', icon: <InboxOutlined /> },
      { label: '3-Way Match', icon: <SwapOutlined /> },
      { label: 'Supplier Pool', icon: <TeamOutlined />, count: '5' },
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
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
} as const

type LocalizedMessages = (typeof localizedContent)[Language]

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

function toneOf(item: object) {
  return 'tone' in item && typeof item.tone === 'string' ? item.tone : 'success'
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
  const isPurchaseRequestRoute = location.pathname === '/purchase-requests'
  const isApprovalRoute = location.pathname === '/approvals'
  const [isCreateDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState(demoContext.activeCompany.companyId)
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

  const messages = localizedContent[language]
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
  const supplierCount = suppliersQuery.data?.data.length ?? 0
  const dashboardKpis = getDashboardKpis(language, purchaseRequests, supplierCount)
  const foundationLoading =
    masterContextQuery.isLoading ||
    companiesQuery.isLoading ||
    suppliersQuery.isLoading ||
    categoriesQuery.isLoading ||
    departmentsQuery.isLoading ||
    usersQuery.isLoading ||
    budgetAccountsQuery.isLoading
  const foundationError =
    masterContextQuery.isError ||
    companiesQuery.isError ||
    suppliersQuery.isError ||
    categoriesQuery.isError ||
    departmentsQuery.isError ||
    usersQuery.isError ||
    budgetAccountsQuery.isError
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
      key: 'logout',
      icon: <LogoutOutlined />,
      label: messages.userMenu.logout,
      danger: true,
    },
  ]

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'language:zh' && language !== 'zh') {
      onLanguageChange()
    }

    if (key === 'language:en' && language !== 'en') {
      onLanguageChange()
    }
  }

  const handleNewRequestClick = () => {
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
    if (!isPurchaseRequestRoute) {
      return
    }

    if (new URLSearchParams(location.search).get('new') === '1') {
      setCreateDrawerOpen(true)
      navigate('/purchase-requests', { replace: true })
    }
  }, [isPurchaseRequestRoute, location.search, navigate])

  return (
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
          {messages.navItems.map((item) =>
            'path' in item ? (
              <NavLink
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                end={item.path === '/'}
                key={item.label}
                to={item.path}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {'count' in item && <strong>{String(item.count)}</strong>}
              </NavLink>
            ) : (
              <div className="nav-item" key={item.label}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {'count' in item && <strong>{String(item.count)}</strong>}
              </div>
            ),
          )}
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
                : isPurchaseRequestRoute
                  ? messages.header.purchaseRequestsTitle
                  : isApprovalRoute
                    ? messages.header.approvalsTitle
                    : messages.header.title}
            </h1>
          </div>
          <div className={isFoundationRoute ? 'top-actions compact' : 'top-actions'}>
            <Tooltip title={messages.aria.search} trigger={['hover', 'focus']}>
              <button type="button" className="icon-button" aria-label={messages.aria.search}>
                <SearchOutlined />
              </button>
            </Tooltip>
            <Tooltip title={messages.aria.notifications} trigger={['hover', 'focus']}>
              <button type="button" className="icon-button" aria-label={messages.aria.notifications}>
                <BellOutlined />
              </button>
            </Tooltip>
            {!isFoundationRoute && (
              <button className="primary-button" onClick={handleNewRequestClick} type="button">
                <FileAddOutlined />
                <span>{messages.actions.newRequest}</span>
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

          {isFoundationRoute ? (
            <FoundationDataView
              budgetAccounts={budgetAccountsQuery.data?.data ?? []}
              categories={categoriesQuery.data?.data ?? []}
              companies={companies}
              context={context}
              departments={departmentsQuery.data?.data ?? []}
              isError={foundationError}
              isLoading={foundationLoading}
              language={language}
              messages={messages}
              onCompanyChange={setSelectedCompanyId}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              suppliers={suppliersQuery.data?.data ?? []}
              users={usersQuery.data?.data ?? []}
            />
          ) : isPurchaseRequestRoute ? (
              <PurchaseRequestView
                budgetAccounts={budgetAccountsQuery.data?.data ?? []}
                categories={categoriesQuery.data?.data ?? []}
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
              suppliers={suppliersQuery.data?.data ?? []}
              users={usersQuery.data?.data ?? []}
            />
          ) : isApprovalRoute ? (
            <ApprovalCenterView
              categories={categoriesQuery.data?.data ?? []}
              isError={foundationError}
              isLoading={foundationLoading}
              language={language}
              messages={messages}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              users={usersQuery.data?.data ?? []}
            />
          ) : (
            <>
              <section className="kpi-grid" aria-label={messages.aria.procurementMetrics}>
                {dashboardKpis.map((kpi) => (
                  <article className="panel kpi" key={kpi.label}>
                    <div>
                      <span>{kpi.label}</span>
                      {kpi.icon}
                    </div>
                    <strong>{kpi.value}</strong>
                    <small className={toneOf(kpi)}>{kpi.note}</small>
                  </article>
                ))}
              </section>

              <section className="dashboard-grid">
                <div className="left-column">
                  <section className="panel chart-panel">
                    <PanelTitle
                      icon={<DashboardOutlined />}
                      title={messages.panels.spendTrend}
                      aside={messages.panels.companyView}
                    />
                    <ReactECharts option={getChartOption(messages.months)} style={{ height: 256 }} />
                  </section>

                  <section className="panel">
                    <PanelTitle
                      icon={<ProfileOutlined />}
                      title={messages.panels.recentRequests}
                      aside={messages.purchaseRequest.recentFromBackend}
                    />
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>{messages.table.request}</th>
                            <th>{messages.table.category}</th>
                            <th>{messages.table.company}</th>
                            <th>{messages.table.amount}</th>
                            <th>{messages.table.currentStep}</th>
                            <th>{messages.table.status}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseRequests.length === 0 ? (
                            <tr>
                              <td colSpan={6}>
                                {purchaseRequestsQuery.isLoading ? messages.purchaseRequest.loading : messages.purchaseRequest.empty}
                              </td>
                            </tr>
                          ) : (
                            purchaseRequests.slice(0, 5).map((row) => (
	                            <tr key={row.requestId}>
	                              <td>
	                                <TruncatedText className="text-strong" text={row.requestId} />
	                              </td>
	                              <td>
	                                <TruncatedText text={categoryNameOf(row.categoryId, categoriesQuery.data?.data ?? [])} />
	                              </td>
	                              <td>
	                                <TruncatedText text={companyNameOf(row.companyId, companies)} />
	                              </td>
	                              <td>{formatCurrency(row.totalAmount, row.currency, language)}</td>
	                              <td>{currentStepOf(row.status, messages, row.approval)}</td>
	                              <td>
	                                <span
	                                  className={`tag ${statusToneOf(row.status)}`}
	                                >
	                                  {formatPurchaseRequestStatus(row.status, messages)}
	                                </span>
                              </td>
                            </tr>
                          ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>

                <aside className="right-column">
                  <section className="panel">
                    <PanelTitle icon={<NodeIndexOutlined />} title={messages.panels.procurementFlow} />
                    <div className="flow-list">
                      {messages.flowStages.map((stage, index) => (
                        <div className="flow-item" key={stage.title}>
                          <span className="stage-index">{index + 1}</span>
                          <div>
	                            <TruncatedText className="text-strong" text={stage.title} />
	                            <TruncatedText className="text-small" text={stage.description} />
                          </div>
                          {stage.count && <span className={`tag ${toneOf(stage)}`}>{stage.count}</span>}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="panel">
                    <PanelTitle icon={<AlertOutlined />} title={messages.panels.risks} aside={messages.panels.today} />
                    <div className="risk-list">
                      {messages.riskItems.map((item) => (
                        <div className="risk-item" key={item.title}>
                          <span className="risk-icon">
                            <SafetyCertificateOutlined />
                          </span>
                          <div>
	                            <TruncatedText className="text-strong" text={item.title} />
	                            <TruncatedText className="text-small" text={item.detail} />
	                          </div>
	                          <span className={`tag ${item.tone}`}>
                            {item.tone === 'danger' ? messages.riskAction.danger : messages.riskAction.review}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="panel boundary-panel">
                    <PanelTitle
                      icon={<ApiOutlined />}
                      title={messages.panels.dataBoundary}
                      aside={messages.panels.skeletonRule}
                    />
                    <dl>
                      <dt>{messages.boundary.groupShared}</dt>
                      <dd>{context.dataBoundary.groupShared}</dd>
                      <dt>{messages.boundary.companyIsolated}</dt>
                      <dd>{context.dataBoundary.companyIsolated}</dd>
                    </dl>
                  </section>
                </aside>
              </section>
            </>
          )}
        </Content>
      </Layout>
    </Layout>
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
    setLastDrawerMode('detail')
    setSelectedRequestId(requestId)
    setDetailDrawerOpen(true)
  }

  const closeCreateDrawer = () => {
    setLastDrawerMode('create')
    setCreateDirty(false)
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

  const handleApproverChange = (approverId: string) => {
    setSelectedApproverId(approverId)
    setSelectedApprovalId(undefined)
    setDetailDrawerOpen(false)
    setComment('')
    setFeedback(null)
  }

  const closeApprovalDrawer = () => {
    setDetailDrawerOpen(false)
    setComment('')
    setFeedback(null)
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
          <div>
            <span>{messages.approval.activeCompany}</span>
            <strong>{selectedCompany.companyName}</strong>
          </div>
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
              <button
                className="primary-button"
                disabled={!canApprove || actionMutation.isPending}
                onClick={() => runApprovalAction('approve')}
                type="button"
              >
                <CheckCircleOutlined />
                <span>{messages.approval.approve}</span>
              </button>
              <button
                className="line-add-button danger-action"
                disabled={!canApprove || actionMutation.isPending}
                onClick={() => runApprovalAction('reject')}
                type="button"
              >
                <AlertOutlined />
                <span>{messages.approval.reject}</span>
              </button>
              <button
                className="line-add-button"
                disabled={!canWithdraw || actionMutation.isPending}
                onClick={() => runApprovalAction('withdraw')}
                type="button"
              >
                <SwapOutlined />
                <span>{messages.approval.withdraw}</span>
              </button>
            </div>
          </div>
          {feedback && <div className={`data-alert ${feedback.tone === 'success' ? 'success' : ''}`}>{feedback.message}</div>}
        </div>
      )}
    </Drawer>
    </>
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

function getDashboardKpis(language: Language, requests: PurchaseRequestListItem[], supplierCount: number) {
  const draftCount = requests.filter((request) => request.status === 'DRAFT').length
  const submittedCount = requests.filter((request) => request.status === 'SUBMITTED').length
  const totalAmount = requests.reduce((sum, request) => sum + Number(request.totalAmount), 0)

  if (language === 'zh') {
    return [
      {
        label: '采购申请',
        value: String(requests.length),
        note: '当前公司真实单据',
        icon: <FileAddOutlined />,
      },
      {
        label: '草稿待完善',
        value: String(draftCount),
        note: '申请人待提交',
        icon: <ProfileOutlined />,
        tone: draftCount > 0 ? 'warn' : 'success',
      },
      {
        label: '已提交',
        value: String(submittedCount),
        note: '等待后续审批流',
        icon: <AuditOutlined />,
      },
      {
        label: '申请金额',
        value: formatCurrency(totalAmount, 'CNY', language),
        note: `供应商池 ${supplierCount}`,
        icon: <ShoppingCartOutlined />,
      },
    ]
  }

  return [
    {
      label: 'Requests',
      value: String(requests.length),
      note: 'Backend records',
      icon: <FileAddOutlined />,
    },
    {
      label: 'Drafts',
      value: String(draftCount),
      note: 'Waiting for submit',
      icon: <ProfileOutlined />,
      tone: draftCount > 0 ? 'warn' : 'success',
    },
    {
      label: 'Submitted',
      value: String(submittedCount),
      note: 'Ready for approval flow',
      icon: <AuditOutlined />,
    },
    {
      label: 'Request Amount',
      value: formatCurrency(totalAmount, 'CNY', language),
      note: `Supplier pool ${supplierCount}`,
      icon: <ShoppingCartOutlined />,
    },
  ]
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

function companyNameOf(companyId: string, companies: CompanyContext[]) {
  return companies.find((company) => company.companyId === companyId)?.companyName ?? companyId
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

function getChartOption(months: readonly string[]) {
  return {
    color: ['#2f7a4d'],
    grid: { left: 42, right: 24, top: 18, bottom: 28 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: months,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#dde2dc' } },
      axisLabel: { color: '#707771' },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#edf0ec' } },
      axisLabel: { color: '#707771' },
    },
    series: [
      {
        type: 'bar',
        barWidth: 30,
        data: [182, 205, 176, 286, 252, 312, 276, 346, 328, 398, 366, 412],
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  }
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
              path="/purchase-requests"
              element={<Workspace language={language} onLanguageChange={toggleLanguage} />}
            />
            <Route
              path="/approvals"
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
