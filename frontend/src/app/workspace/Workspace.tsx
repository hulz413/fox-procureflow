import { BankOutlined, BellOutlined, DatabaseOutlined, FileAddOutlined, FileSearchOutlined, InboxOutlined, LogoutOutlined, LoadingOutlined, ProfileOutlined, ReloadOutlined, SearchOutlined, ShoppingCartOutlined, TranslationOutlined, UserOutlined } from '@ant-design/icons'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Dropdown, Layout, Modal, Popover, Tooltip } from 'antd'
import type { MenuProps } from 'antd'
import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { canDemoPersonaUsePrimaryAction, demoUserCanViewDashboard } from '../../demoRoleCapabilities'
import { demoPersonaMenuOrder, demoPersonas, demoContext } from '../../domain/types'
import type { Language, DemoPersonaKey, ReceiptInvoiceCreateMode, ProcurementDashboardScope, ProcurementDashboardScopeValue, GlobalSearchResult } from '../../domain/types'
import { fetchHealth, fetchMasterDataContext, fetchCompanies, fetchDepartments, fetchUsers, fetchSuppliers, fetchCategories, fetchBudgetAccounts, resetDemoData, fetchPurchaseRequests, fetchRfqs, fetchPurchaseOrders, fetchProcurementDashboard } from '../../api/client'
import { localizedContent } from '../../i18n/localizedContent'
import type { NotificationItem } from '../../i18n/localizedContent'
import { localizeContext } from '../../i18n/context'
import { userForDemoPersona } from '../../shared/utils/procurement'
import { StatusPill, ProcureflowMark } from '../../shared/ui/common'
import { NotificationPanel } from '../../shared/ui/NotificationPanel'
import { ProcurementDashboardView } from '../../features/dashboard/ProcurementDashboardView'
import { PurchaseRequestView } from '../../features/purchase-requests/PurchaseRequestView'
import { ApprovalCenterView } from '../../features/approvals/ApprovalCenterView'
import { RfqView } from '../../features/rfq/RfqView'
import { PurchaseOrderView } from '../../features/purchase-orders/PurchaseOrderView'
import { ReceiptsInvoicesView } from '../../features/receipts-invoices/ReceiptsInvoicesView'
import { ThreeWayMatchingView } from '../../features/three-way-matching/ThreeWayMatchingView'
import { SupplierPoolView } from '../../features/supplier-pool/SupplierPoolView'
import { FoundationDataView } from '../../features/master-data/FoundationDataView'
import { GlobalSearchDialog } from '../../features/global-search/GlobalSearchDialog'

const { Header, Sider, Content } = Layout

export function Workspace({
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
  const [selectedDemoPersonaKey, setSelectedDemoPersonaKey] = useState<DemoPersonaKey>('admin')
  const [dashboardScopeValue, setDashboardScopeValue] = useState<ProcurementDashboardScopeValue>('GROUP')
  const [isNotificationOpen, setNotificationOpen] = useState(false)
  const [isGlobalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([])
  const searchButtonRef = useRef<HTMLButtonElement>(null)
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
  const dashboardScope: ProcurementDashboardScope = dashboardScopeValue === 'GROUP' ? 'GROUP' : 'COMPANY'
  const dashboardCompanyId = dashboardScope === 'COMPANY' ? dashboardScopeValue : undefined

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
  const allCompanyUsersQueries = useQueries({
    queries: companies.map((company) => ({
      queryKey: ['master-data', 'users', company.companyId],
      queryFn: () => fetchUsers(company.companyId),
      enabled: company.companyId.length > 0,
      retry: 1,
    })),
  })
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
  const allDemoUsers = Array.from(
    new Map(
      [
        ...users,
        ...allCompanyUsersQueries.flatMap((query) => query.data?.data ?? []),
      ].map((user) => [user.userId, user]),
    ).values(),
  ).filter((user) => user.active)
  const demoUsersKey = allDemoUsers.map((user) => `${user.userId}:${user.companyId}`).join('|')
  const selectedDemoPersona =
    demoPersonas.find((persona) => persona.key === selectedDemoPersonaKey) ?? demoPersonas[2]
  const selectedDemoUser =
    userForDemoPersona(selectedDemoPersona, allDemoUsers, selectedCompanyId) ??
    allDemoUsers.find((user) => user.companyId === selectedCompanyId) ??
    allDemoUsers[0]
  const selectedDemoUserId = selectedDemoUser?.userId
  const canViewDashboard = demoUserCanViewDashboard(selectedDemoUser)
  const procurementDashboardQuery = useQuery({
    queryKey: ['procurement-dashboard', dashboardScope, dashboardCompanyId, selectedDemoUserId],
    queryFn: () => fetchProcurementDashboard(dashboardScope, selectedDemoUserId ?? '', dashboardCompanyId),
    enabled: isDashboardRoute && Boolean(selectedDemoUserId) && canViewDashboard,
    retry: 1,
  })
  const selectedDemoRoleLabel = selectedDemoUser
    ? selectedDemoUser.roles.map((role) => role.roleName).join(' / ')
    : messages.userMenu.role
  const currentRoutePath = isDashboardRoute ? '/' : location.pathname
  const canAccessMasterData = selectedDemoPersona.key === 'admin'
  const canResetDemoData = selectedDemoPersona.key === 'admin'
  const visibleNavItems =
    selectedDemoPersona.key === 'admin'
      ? messages.navItems
      : messages.navItems.filter((item) => selectedDemoPersona.allowedPaths.includes(item.path))
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
  const demoRoleMenuItems: MenuProps['items'] =
    allDemoUsers.length > 0
      ? demoPersonaMenuOrder.flatMap((personaKey) => {
          const persona = demoPersonas.find((item) => item.key === personaKey)
          if (!persona) {
            return []
          }

          const user = userForDemoPersona(persona, allDemoUsers, selectedCompanyId)
          if (!user) {
            return []
          }

          const company = companies.find((item) => item.companyId === user.companyId)
          const roleLabel = user.roles.map((role) => role.roleName).join(' / ')
          const isCurrentPersona = persona.key === selectedDemoPersona.key
          return [{
            key: `demo-persona:${persona.key}`,
            label: (
              <div className={isCurrentPersona ? 'user-menu-option active' : 'user-menu-option'}>
                <strong>
                  {messages.userMenu.demoRoles[persona.key]}
                  {isCurrentPersona && <em>{messages.userMenu.current}</em>}
                </strong>
                <span>{user.displayName} · {roleLabel || user.positionTitle}</span>
                <small>{company?.companyName ?? user.companyId}</small>
              </div>
            ),
          }]
        })
      : [
          {
            key: 'demo-user:none',
            label: messages.userMenu.demoRoleUnavailable,
            disabled: true,
          },
        ]
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <div className="user-menu-profile">
          <strong>{selectedDemoUser?.displayName ?? messages.userMenu.name}</strong>
          <span>{selectedDemoRoleLabel}</span>
          <small>{selectedDemoUser?.email ?? messages.userMenu.email}</small>
        </div>
      ),
    },
    { type: 'divider' },
    ...(canAccessMasterData
      ? [{
          key: 'master-data',
          icon: <DatabaseOutlined />,
          label: messages.userMenu.masterDataManagement,
        }]
      : []),
    {
      key: 'demo-role',
      icon: <UserOutlined />,
      label: messages.userMenu.demoRole,
      children: demoRoleMenuItems,
    },
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
    ...(canResetDemoData
      ? [{
          key: 'reset-demo-data',
          icon: resetDemoDataMutation.isPending ? <LoadingOutlined /> : <ReloadOutlined />,
          label: resetDemoDataMutation.isPending
            ? messages.userMenu.resetDemoDataRunning
            : messages.userMenu.resetDemoData,
          disabled: resetDemoDataMutation.isPending,
          danger: true,
        }]
      : []),
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
    const keyText = String(key)

    if (keyText === 'master-data') {
      navigate('/master-data')
      return
    }

    if (keyText.startsWith('demo-persona:')) {
      const nextPersonaKey = keyText.replace('demo-persona:', '') as DemoPersonaKey
      const nextPersona = demoPersonas.find((persona) => persona.key === nextPersonaKey)
      const nextUser = nextPersona ? userForDemoPersona(nextPersona, allDemoUsers, selectedCompanyId) : undefined
      if (nextUser) {
        setSelectedDemoPersonaKey(nextPersonaKey)
        if (nextUser.companyId !== selectedCompanyId) {
          setSelectedCompanyId(nextUser.companyId)
        }
        if (nextPersona && nextPersona.key !== 'admin' && !nextPersona.allowedPaths.includes(currentRoutePath)) {
          navigate(nextPersona.defaultPath)
        }
      }
      return
    }

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
      setReceiptInvoiceCreateMode(selectedDemoPersona.key === 'finance' ? 'invoice' : 'receipt')
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
    const personaUserInCompany = userForDemoPersona(selectedDemoPersona, allDemoUsers, selectedCompanyId)
    const personaFallbackUser = userForDemoPersona(selectedDemoPersona, allDemoUsers)
    if (!personaUserInCompany && personaFallbackUser && personaFallbackUser.companyId !== selectedCompanyId) {
      setSelectedCompanyId(personaFallbackUser.companyId)
    }
  }, [allDemoUsers, demoUsersKey, selectedCompanyId, selectedDemoPersona])

  useEffect(() => {
    const canAccessCurrentRoute =
      selectedDemoPersona.key === 'admin' || selectedDemoPersona.allowedPaths.includes(currentRoutePath)
    if (!canAccessCurrentRoute) {
      navigate(selectedDemoPersona.defaultPath, { replace: true })
    }
  }, [currentRoutePath, navigate, selectedDemoPersona])

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

  useEffect(() => {
    if (!isThreeWayMatchingRoute) {
      return
    }

    const routeCompanyId = new URLSearchParams(location.search).get('companyId')
    if (!routeCompanyId || routeCompanyId === selectedCompanyId) {
      return
    }

    if (companies.some((company) => company.companyId === routeCompanyId)) {
      setSelectedCompanyId(routeCompanyId)
    }
  }, [companies, isThreeWayMatchingRoute, location.search, selectedCompanyId])

  const dismissSearchTooltip = useCallback(() => {
    setSearchTooltipOpen(false)
    searchButtonRef.current?.blur()
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }, [])

  const openGlobalSearch = useCallback(() => {
    dismissSearchTooltip()
    setGlobalSearchOpen(true)
  }, [dismissSearchTooltip])

  const closeGlobalSearch = useCallback(() => {
    dismissSearchTooltip()
    setGlobalSearchOpen(false)
  }, [dismissSearchTooltip])

  const openGlobalSearchResult = useCallback((result: GlobalSearchResult) => {
    const params = new URLSearchParams(result.targetParams)
    dismissSearchTooltip()
    setCreateDrawerOpen(false)
    setRfqCreateDrawerOpen(false)
    setPoCreateDrawerOpen(false)
    setReceiptInvoiceCreateMode(null)
    setGlobalSearchOpen(false)
    navigate(params.size > 0 ? `${result.targetPath}?${params.toString()}` : result.targetPath)
  }, [dismissSearchTooltip, navigate])

  useEffect(() => {
    const handleGlobalSearchShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openGlobalSearch()
      }
    }

    window.addEventListener('keydown', handleGlobalSearchShortcut)
    return () => window.removeEventListener('keydown', handleGlobalSearchShortcut)
  }, [openGlobalSearch])

  const canUsePrimaryAction =
    canDemoPersonaUsePrimaryAction(selectedDemoPersona.key, {
      isDashboardRoute,
      isPurchaseOrderRoute,
      isPurchaseRequestRoute,
      isReceiptInvoiceRoute,
      isRfqRoute,
    })
  const primaryActionIcon = isReceiptInvoiceRoute
    ? selectedDemoPersona.key === 'finance'
      ? <ProfileOutlined />
      : <InboxOutlined />
    : isPurchaseOrderRoute
      ? <ShoppingCartOutlined />
      : isRfqRoute
        ? <FileSearchOutlined />
        : <FileAddOutlined />
  const primaryActionLabel = isReceiptInvoiceRoute
    ? selectedDemoPersona.key === 'finance'
      ? messages.actions.newInvoice
      : messages.actions.newReceipt
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
      <GlobalSearchDialog
        companyId={selectedCompanyId}
        language={language}
        messages={messages}
        onClose={closeGlobalSearch}
        onOpenResult={openGlobalSearchResult}
        open={isGlobalSearchOpen}
      />
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
            <strong>{selectedCompany.companyName}</strong>
            <span>{context.groupName}</span>
          </div>
        </div>

        <nav className="nav-list" aria-label={messages.aria.modules}>
          {visibleNavItems.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              end={item.path === '/'}
              key={item.label}
              to={item.path}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
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
            <Tooltip
              open={isSearchTooltipOpen && !isGlobalSearchOpen}
              onOpenChange={(open) => setSearchTooltipOpen(open && !isGlobalSearchOpen)}
              title={messages.aria.search}
              trigger={['hover', 'focus']}
            >
              <button
                type="button"
                className="icon-button"
                aria-label={messages.globalSearch.open}
                onClick={openGlobalSearch}
                ref={searchButtonRef}
              >
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
            {canUsePrimaryAction && (
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
            <span>{selectedCompany.businessScope}</span>
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
                activeDemoUser={selectedDemoUser}
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
              activeDemoUser={selectedDemoUser}
              categories={categories}
              isError={foundationError}
              isLoading={foundationLoading}
              language={language}
              messages={messages}
              selectedCompany={selectedCompany}
              selectedCompanyId={selectedCompanyId}
              suppliers={suppliers}
              users={users}
            />
          ) : isRfqRoute ? (
            <RfqView
              activeDemoUser={selectedDemoUser}
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
              activeDemoUser={selectedDemoUser}
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
              activeDemoUser={selectedDemoUser}
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
              activeDemoUser={selectedDemoUser}
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
              onCompanyChange={setSelectedCompanyId}
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
