import {
  AlertOutlined,
  ApiOutlined,
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileAddOutlined,
  FileSearchOutlined,
  InboxOutlined,
  LogoutOutlined,
  NodeIndexOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  SwapOutlined,
  TeamOutlined,
  TranslationOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { Avatar, ConfigProvider, Dropdown, Layout, Tooltip } from 'antd'
import type { MenuProps, ThemeConfig } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import ReactECharts from 'echarts-for-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
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
  const response = await fetch(`${apiBaseUrl}${path}`)

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
      { label: '采购申请', icon: <FileAddOutlined /> },
      { label: '审批中心', icon: <AuditOutlined /> },
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
      { title: '申请提交', description: '动态字段、预算科目、附件', count: '27' },
      { title: '审批流转', description: '公司、金额、品类规则', count: '5', tone: 'warn' },
      { title: '询价比价', description: '供应商池、报价评分', count: '14' },
      { title: '订单到票', description: 'PO、收货、发票、匹配', count: '3', tone: 'danger' },
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
      { label: 'Requests', icon: <FileAddOutlined /> },
      { label: 'Approvals', icon: <AuditOutlined /> },
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
      { title: 'Submit Request', description: 'Dynamic fields, budget account, attachments', count: '27' },
      { title: 'Approval Routing', description: 'Company, amount, category rules', count: '5', tone: 'warn' },
      { title: 'RFQ Comparison', description: 'Supplier pool, quote scoring', count: '14' },
      { title: 'Order to Invoice', description: 'PO, receiving, invoice, match', count: '3', tone: 'danger' },
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
  const isFoundationRoute = location.pathname === '/master-data'
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

  useEffect(() => {
    if (companies.length === 0) {
      return
    }

    if (!companies.some((company) => company.companyId === selectedCompanyId)) {
      setSelectedCompanyId(context.activeCompany.companyId)
    }
  }, [companies, context.activeCompany.companyId, selectedCompanyId])

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
            <h1>{isFoundationRoute ? messages.header.foundationTitle : messages.header.title}</h1>
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
              <Tooltip title={messages.actions.newRequest} trigger={['hover', 'focus']}>
                <button type="button" className="primary-button">
                  <FileAddOutlined />
                  <span>{messages.actions.newRequest}</span>
                </button>
              </Tooltip>
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
          ) : (
            <>
              <section className="kpi-grid" aria-label={messages.aria.procurementMetrics}>
                {messages.kpis.map((kpi) => (
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
                      aside={context.activeCompany.companyName}
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
                          {messages.purchaseRows.map((row) => (
                            <tr key={row.id}>
                              <td>
                                <strong>{row.id}</strong>
                              </td>
                              <td>{row.category}</td>
                              <td>{row.company}</td>
                              <td>{row.amount}</td>
                              <td>{row.node}</td>
                              <td>
                                <span className={`tag ${row.tone}`}>{row.status}</span>
                              </td>
                            </tr>
                          ))}
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
                            <strong>{stage.title}</strong>
                            <small>{stage.description}</small>
                          </div>
                          <span className={`tag ${toneOf(stage)}`}>{stage.count}</span>
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
                            <strong>{item.title}</strong>
                            <small>{item.detail}</small>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  )
}

export default App
