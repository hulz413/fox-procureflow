import { DeleteOutlined, ProfileOutlined, TeamOutlined } from '@ant-design/icons'
import { Drawer } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { Language, DemoContext, CompanyContext, CategorySummary, SupplierSummary } from '../../domain/types'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { useListPagination } from '../../shared/hooks/useListPagination'
import { routeParam } from '../../shared/utils/route'
import { formatRiskLevel, riskToneOf, formatSupplierStatus, formatSupplierSharedScope } from '../../shared/utils/procurement'
import { ListPagination, PanelTitle } from '../../shared/ui/common'
import { CompanyContextSelector } from '../../shared/ui/procurementWidgets'

export function SupplierPoolView({
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
  const location = useLocation()
  const handledRouteSupplierKey = useRef('')
  const routeSupplierId = routeParam(location.search, 'supplierId')
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
  const supplierPagination = useListPagination(
    filteredSuppliers,
    `${selectedCompanyId}:${normalizedKeyword}:${categoryId}:${riskLevel}:${supplierStatus}`,
  )
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

  useEffect(() => {
    if (!routeSupplierId) {
      return
    }

    const routeKey = `${location.key}:${routeSupplierId}`
    if (handledRouteSupplierKey.current === routeKey) {
      return
    }

    if (!suppliers.some((supplier) => supplier.supplierId === routeSupplierId)) {
      return
    }

    handledRouteSupplierKey.current = routeKey
    setSelectedSupplierId(routeSupplierId)
  }, [location.key, routeSupplierId, suppliers])

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
          <CompanyContextSelector
            companies={companies}
            label={messages.supplierPool.selectedCompany}
            onCompanyChange={onCompanyChange}
            selectedCompany={selectedCompany}
            selectedCompanyId={selectedCompanyId}
            statusLabel={(company) => company.active ? messages.foundation.active : messages.foundation.inactive}
          />
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
                supplierPagination.pageItems.map((supplier) => (
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
        <ListPagination
          currentPage={supplierPagination.currentPage}
          messages={messages}
          onPageChange={supplierPagination.setPage}
          onPageSizeChange={supplierPagination.setPageSize}
          pageSize={supplierPagination.pageSize}
          totalItems={supplierPagination.totalItems}
          totalPages={supplierPagination.totalPages}
        />
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
