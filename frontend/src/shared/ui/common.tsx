import { AlertOutlined, ApiOutlined, LeftOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons'
import { Select, Tooltip } from 'antd'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_LIST_PAGE_SIZE, LIST_PAGE_SIZE_OPTIONS } from '../../domain/types'
import type { Language, AiAssistantResponse, AiDraftPreviewResult, AiRiskReviewResult, AiRfqExplanationResult, AiMatchingExplanationResult } from '../../domain/types'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { formatOptionalCurrency, formatDateTime } from '../utils/procurement'

export function ListPagination({
  currentPage,
  messages,
  onPageChange,
  onPageSizeChange,
  pageSize,
  totalItems,
  totalPages,
}: {
  currentPage: number
  messages: LocalizedMessages
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSize: number
  totalItems: number
  totalPages: number
}) {
  if (totalItems <= DEFAULT_LIST_PAGE_SIZE) {
    return null
  }

  const pageItems =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_item, index) => index + 1)
      : compactPaginationItems(currentPage, totalPages)
  const totalText = messages.pagination.total.replace('{totalItems}', String(totalItems))

  return (
    <nav aria-label={messages.pagination.label} className="list-pagination">
      <span className="list-pagination-total">{totalText}</span>
      <div className="list-pagination-controls">
        <button
          aria-label={messages.pagination.previous}
          className="icon-button list-page-button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title={messages.pagination.previous}
          type="button"
        >
          <LeftOutlined />
        </button>
        {pageItems.map((item) =>
          typeof item === 'number' ? (
            <button
              aria-label={messages.pagination.page.replace('{page}', String(item))}
              className={item === currentPage ? 'list-page-number active' : 'list-page-number'}
              key={item}
              onClick={() => onPageChange(item)}
              type="button"
            >
              {item}
            </button>
          ) : (
            <span aria-hidden="true" className="list-page-ellipsis" key={item}>
              ...
            </span>
          ),
        )}
        <button
          aria-label={messages.pagination.next}
          className="icon-button list-page-button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title={messages.pagination.next}
          type="button"
        >
          <RightOutlined />
        </button>
        <Select
          aria-label={messages.pagination.pageSizeSelect}
          className="list-page-size-select"
          options={LIST_PAGE_SIZE_OPTIONS.map((item) => ({
            label: messages.pagination.pageSize.replace('{pageSize}', String(item)),
            value: item,
          }))}
          popupClassName="list-page-size-dropdown"
          value={pageSize}
          onChange={onPageSizeChange}
        />
      </div>
    </nav>
  )
}

function compactPaginationItems(currentPage: number, totalPages: number) {
  const pageSet = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])

  if (currentPage <= 3) {
    pageSet.add(2)
    pageSet.add(3)
    pageSet.add(4)
  }

  if (currentPage >= totalPages - 2) {
    pageSet.add(totalPages - 3)
    pageSet.add(totalPages - 2)
    pageSet.add(totalPages - 1)
  }

  const pages = Array.from(pageSet)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right)

  return pages.reduce<Array<number | string>>((items, page, index) => {
    const previousPage = pages[index - 1]
    if (previousPage && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`)
    }
    items.push(page)
    return items
  }, [])
}

export function StatusPill({
  status,
  isError,
  label,
}: {
  status: string
  isError: boolean
  label: string
}) {
  const state = isError ? 'OFFLINE' : status
  if (state === 'UP' || state === 'CHECKING') {
    return null
  }

  return (
    <span aria-label={`${label} ${state}`} className="status-pill" role="status">
      <AlertOutlined />
      {label} {state}
    </span>
  )
}

export function TruncatedText({ className = '', text }: { className?: string; text: string }) {
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

export function DisabledActionTooltip({
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

export function AiResultPanel({
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
      <PanelTitle icon={<ApiOutlined />} title={title ?? messages.ai.result} />
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


export function ProcureflowMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" focusable="false">
      <path d="M16 4.5 25 9.7v10.4l-9 5.2-9-5.2V9.7L16 4.5Z" />
      <path d="M7 9.7 16 14.9l9-5.2M16 14.9v10.4" />
      <path d="M11.5 7.1 20.5 12.3M20.5 7.1 11.5 12.3" />
    </svg>
  )
}

export function PanelTitle({
  actions,
  icon,
  title,
  aside,
}: {
  actions?: ReactNode
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
      {actions ?? (aside && <span title={aside}>{aside}</span>)}
    </div>
  )
}
