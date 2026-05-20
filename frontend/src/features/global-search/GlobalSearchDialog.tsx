import { AuditOutlined, DatabaseOutlined, FileAddOutlined, FileSearchOutlined, InboxOutlined, LoadingOutlined, SearchOutlined, ShoppingCartOutlined, SwapOutlined, TeamOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Modal } from 'antd'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Language, GlobalSearchResultType, GlobalSearchResult, GlobalSearchGroup } from '../../domain/types'
import { fetchGlobalSearch } from '../../api/client'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { formatCurrency, getViewportCenter } from '../../shared/utils/procurement'

export function GlobalSearchDialog({
  companyId,
  language,
  messages,
  onClose,
  onOpenResult,
  open,
}: {
  companyId: string
  language: Language
  messages: LocalizedMessages
  onClose: () => void
  onOpenResult: (result: GlobalSearchResult) => void
  open: boolean
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedQuery = query.trim()
  const canSearch = open && companyId.length > 0 && normalizedQuery.length >= 2
  const searchQuery = useQuery({
    queryKey: ['global-search', companyId, normalizedQuery],
    queryFn: () => fetchGlobalSearch(companyId, normalizedQuery),
    enabled: canSearch,
    retry: 1,
  })
  const groups = canSearch ? (searchQuery.data?.data.groups ?? []) : []
  const flattenedResults = groups.flatMap((group) => group.results)
  const groupsWithOffsets = groups.reduce<Array<{ group: GlobalSearchGroup; start: number }>>((current, group) => {
    const start = current.reduce((sum, item) => sum + item.group.results.length, 0)
    return [...current, { group, start }]
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    setSelectedIndex(null)
  }, [normalizedQuery, open])

  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= flattenedResults.length) {
      setSelectedIndex(flattenedResults.length > 0 ? flattenedResults.length - 1 : null)
    }
  }, [flattenedResults.length, selectedIndex])

  const openSelectedResult = () => {
    const result = selectedIndex === null ? null : flattenedResults[selectedIndex]
    if (result) {
      onOpenResult(result)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (flattenedResults.length === 0) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((current) => (current === null ? 0 : (current + 1) % flattenedResults.length))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((current) =>
        current === null
          ? flattenedResults.length - 1
          : (current - 1 + flattenedResults.length) % flattenedResults.length,
      )
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      openSelectedResult()
    }
  }

  return (
    <Modal
      centered
      className="global-search-modal"
      destroyOnClose={false}
      footer={null}
      mousePosition={open ? getViewportCenter() : undefined}
      onCancel={onClose}
      open={open}
      title={null}
      width={680}
    >
      <div className="global-search" onKeyDown={handleKeyDown}>
        <div className="global-search-box">
          <SearchOutlined />
          <input
            aria-label={messages.globalSearch.title}
            className="global-search-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={messages.globalSearch.placeholder}
            ref={inputRef}
            type="search"
            value={query}
          />
          <kbd>{messages.globalSearch.shortcut}</kbd>
        </div>
        <div className="global-search-scope">
          <span>{messages.globalSearch.scope}</span>
        </div>

        <div className="global-search-results">
          {normalizedQuery.length < 2 ? (
            <div className="empty-state compact">{messages.globalSearch.minQuery}</div>
          ) : searchQuery.isLoading ? (
            <div className="empty-state compact">
              <LoadingOutlined />
              {messages.globalSearch.loading}
            </div>
          ) : searchQuery.isError ? (
            <div className="data-alert">{messages.globalSearch.error}</div>
          ) : groups.length === 0 ? (
            <div className="empty-state compact">{messages.globalSearch.empty}</div>
          ) : (
            groupsWithOffsets.map(({ group, start }) => (
              <section className="global-search-group" key={group.type}>
                <div className="global-search-group-title">
                  {globalSearchResultTypeIcon(group.type)}
                  <span>{messages.globalSearch.types[group.type]}</span>
                  <strong>{group.results.length}</strong>
                </div>
                {group.results.map((result, index) => {
                  const globalIndex = start + index
                  const isSelected = selectedIndex !== null && globalIndex === selectedIndex

                  return (
                    <button
                      aria-label={`${messages.globalSearch.openResult}: ${result.title}`}
                      className={isSelected ? 'global-search-result active' : 'global-search-result'}
                      key={`${result.type}-${result.id}`}
                      onFocus={() => setSelectedIndex(globalIndex)}
                      onClick={() => onOpenResult(result)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      type="button"
                    >
                      <span className="global-search-result-icon">
                        {globalSearchResultTypeIcon(result.type)}
                      </span>
                      <span className="global-search-result-main">
                        <strong>{result.title}</strong>
                        <small>{globalSearchResultMeta(result, messages, language).join(' · ')}</small>
                        {result.matchedFields.length > 0 && (
                          <em>
                            {messages.globalSearch.matchedFields}: {result.matchedFields.slice(0, 2).join(' / ')}
                          </em>
                        )}
                      </span>
                    </button>
                  )
                })}
              </section>
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}

function globalSearchResultTypeIcon(type: GlobalSearchResultType) {
  if (type === 'PURCHASE_REQUEST') {
    return <FileAddOutlined />
  }
  if (type === 'APPROVAL') {
    return <AuditOutlined />
  }
  if (type === 'RFQ') {
    return <FileSearchOutlined />
  }
  if (type === 'PURCHASE_ORDER') {
    return <ShoppingCartOutlined />
  }
  if (type === 'RECEIPT' || type === 'INVOICE') {
    return <InboxOutlined />
  }
  if (type === 'THREE_WAY_MATCH') {
    return <SwapOutlined />
  }
  if (type === 'SUPPLIER') {
    return <TeamOutlined />
  }
  return <DatabaseOutlined />
}

function formatSearchStatus(status: string, messages: LocalizedMessages) {
  const labels: Record<string, string> = {
    ACTIVE: messages.foundation.active,
    APPROVED: messages.approval.approved,
    CANCELLED: messages.purchaseOrder.cancelled,
    COMPARISON_READY: messages.rfq.comparisonReady,
    DRAFT: messages.purchaseRequest.draft,
    EXCEPTION: messages.matching.exception,
    FULLY_INVOICED: messages.receiptInvoice.fullyInvoiced,
    FULLY_RECEIVED: messages.receiptInvoice.fullyReceived,
    IN_PROGRESS: messages.approval.inProgress,
    ISSUED: messages.purchaseOrder.issued,
    MATCHED: messages.matching.matched,
    NOT_INVOICED: messages.receiptInvoice.notInvoiced,
    NOT_RECEIVED: messages.receiptInvoice.notReceived,
    PARTIALLY_INVOICED: messages.receiptInvoice.partiallyInvoiced,
    PARTIALLY_RECEIVED: messages.receiptInvoice.partiallyReceived,
    PENDING: messages.approval.pending,
    PENDING_INPUT: messages.matching.pendingInput,
    QUOTING: messages.rfq.quoting,
    RECORDED: messages.receiptInvoice.recorded,
    REJECTED: messages.approval.rejected,
    RESOLVED: messages.matching.resolved,
    SUBMITTED: messages.purchaseRequest.submitted,
    WITHDRAWN: messages.approval.withdrawn,
    active: messages.supplierPool.active,
    inactive: messages.supplierPool.inactive,
  }

  return labels[status] ?? status
}

function globalSearchResultMeta(
  result: GlobalSearchResult,
  messages: LocalizedMessages,
  language: Language,
) {
  const meta = [
    result.id,
    result.status ? formatSearchStatus(result.status, messages) : '',
    result.ownershipScope === 'GROUP_SHARED'
      ? messages.globalSearch.groupShared
      : messages.globalSearch.companyOwned,
    result.companyName,
    result.supplierName,
    result.amount !== null && result.currency
      ? formatCurrency(result.amount, result.currency, language)
      : '',
  ]

  return meta.filter((item): item is string => Boolean(item))
}
