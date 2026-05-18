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
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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

type HealthEnvelope = {
  success: boolean
  data: {
    status: string
    application: string
    checkedAt: string
    demoContext: DemoContext
  }
  timestamp: string
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

async function fetchHealth(): Promise<HealthEnvelope> {
  const response = await fetch(`${apiBaseUrl}/api/health`)

  if (!response.ok) {
    throw new Error(`Health check failed with ${response.status}`)
  }

  return response.json() as Promise<HealthEnvelope>
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
      { label: '采购工作台', icon: <DashboardOutlined />, active: true, count: '12' },
      { label: '采购申请', icon: <FileAddOutlined />, count: '8' },
      { label: '审批中心', icon: <AuditOutlined />, count: '5' },
      { label: '询报价', icon: <FileSearchOutlined />, count: '6' },
      { label: '采购订单', icon: <ShoppingCartOutlined />, count: '18' },
      { label: '收货发票', icon: <InboxOutlined />, count: '9' },
      { label: '三单匹配', icon: <SwapOutlined />, count: '3' },
      { label: '供应商池', icon: <TeamOutlined />, count: '42' },
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
      { label: 'Dashboard', icon: <DashboardOutlined />, active: true, count: '12' },
      { label: 'Requests', icon: <FileAddOutlined />, count: '8' },
      { label: 'Approvals', icon: <AuditOutlined />, count: '5' },
      { label: 'RFQ', icon: <FileSearchOutlined />, count: '6' },
      { label: 'Purchase Orders', icon: <ShoppingCartOutlined />, count: '18' },
      { label: 'Receiving & Invoices', icon: <InboxOutlined />, count: '9' },
      { label: '3-Way Match', icon: <SwapOutlined />, count: '3' },
      { label: 'Supplier Pool', icon: <TeamOutlined />, count: '42' },
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
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  },
} as const

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

function isActive(item: object) {
  return 'active' in item && item.active === true
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
  const { data, isError, isLoading } = useQuery({
    queryKey: ['backend-health'],
    queryFn: fetchHealth,
    retry: 1,
  })

  const messages = localizedContent[language]
  const context = localizeContext(data?.data.demoContext ?? demoContext, language)
  const healthStatus = data?.data.status ?? (isLoading ? 'CHECKING' : 'OFFLINE')
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
          {messages.navItems.map((item) => (
            <div className={isActive(item) ? 'nav-item active' : 'nav-item'} key={item.label}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </nav>

        <div className="boundary-note">
          <DatabaseOutlined />
          <span>{messages.boundaryNote}</span>
        </div>
      </Sider>

      <Layout className="main-layout">
        <Header className="topbar">
          <div>
            <h1>{messages.header.title}</h1>
          </div>
          <div className="top-actions">
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
            <Tooltip title={messages.actions.newRequest} trigger={['hover', 'focus']}>
              <button type="button" className="primary-button">
                <FileAddOutlined />
                <span>{messages.actions.newRequest}</span>
              </button>
            </Tooltip>
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
            <StatusPill status={healthStatus} isError={isError} label={messages.status.backend} />
            <span>{context.groupName}</span>
            <span>{context.supplierPoolScope}</span>
            <span>{context.activeCompany.businessScope}</span>
          </section>

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
                <PanelTitle icon={<NodeIndexOutlined />} title={messages.panels.procurementFlow} aside="P0" />
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
        </Content>
      </Layout>
    </Layout>
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
  aside: string
}) {
  return (
    <div className="panel-title">
      <strong>
        {icon}
        {title}
      </strong>
      <span>{aside}</span>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  )
}

export default App
