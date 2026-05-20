import { ApiOutlined, DatabaseOutlined, ProfileOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons'
import type { Language, DemoContext, CompanyContext, DepartmentSummary, UserSummary, CategorySummary, SupplierSummary, BudgetAccountSummary } from '../../domain/types'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { formatCurrency, formatRiskLevel, riskToneOf } from '../../shared/utils/procurement'
import { PanelTitle } from '../../shared/ui/common'
import { CompanyContextSelector } from '../../shared/ui/procurementWidgets'

export function FoundationDataView({
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
          <CompanyContextSelector
            companies={companies}
            label={messages.foundation.selectedCompany}
            onCompanyChange={onCompanyChange}
            selectedCompany={selectedCompany}
            selectedCompanyId={selectedCompanyId}
          />
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
                      <small>{supplier.supplierId}</small>
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
