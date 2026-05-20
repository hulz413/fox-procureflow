import { FileAddOutlined, FileSearchOutlined, InboxOutlined, NodeIndexOutlined, ProfileOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { Select } from 'antd'
import type { Language, CompanyContext, UserSummary, ApprovalRecord, ApprovalNode, RfqQuoteAttachment, UploadedAttachment, ReceiptInvoiceAttachment, FulfillmentPurchaseOrder, ReceiptListItem, InvoiceListItem, ReceiptCreateFormState, InvoiceCreateFormState, InvoiceEditableLineKey } from '../../domain/types'
import type { LocalizedMessages } from '../../i18n/localizedContent'
import { formatCurrency, formatApprovalNodeStatus, approvalNodeToneOf, formatApprovalAction, approvalActionToneOf, userNameOf, openAttachmentDownload, formatReceiptProgress, formatInvoiceProgress, formatInvoiceAmountStatus, invoiceAmountToneOf, formatDate, formatDateTime, roundAmount } from '../utils/procurement'
import { TruncatedText, DisabledActionTooltip, PanelTitle } from './common'

export function ReceiptInvoicePoSelect({
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

export function ReceiptFormLines({
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

export function InvoiceFormLines({
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

export function FilePicker({
  accept,
  ariaLabel,
  chooseLabel,
  noFileLabel,
  onFileChange,
  selectedLabel,
}: {
  accept: string
  ariaLabel: string
  chooseLabel: string
  noFileLabel: string
  onFileChange: (file: File | null) => void
  selectedLabel?: string
}) {
  return (
    <span className="file-picker">
      <input
        accept={accept}
        aria-label={ariaLabel}
        className="file-picker-input"
        type="file"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      <span className="file-picker-button">{chooseLabel}</span>
      <span className={selectedLabel ? 'file-picker-name' : 'file-picker-name muted'}>
        {selectedLabel || noFileLabel}
      </span>
    </span>
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
        <FilePicker
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt"
          ariaLabel={messages.receiptInvoice.attachmentFile}
          chooseLabel={messages.receiptInvoice.chooseAttachment}
          noFileLabel={messages.receiptInvoice.noAttachmentSelected}
          selectedLabel={file?.name ?? fileName}
          onFileChange={onFileChange}
        />
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

export function FulfillmentDetail({
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
    <div className="request-detail rfq-detail fulfillment-detail">
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
      <div className="action-row button-action-row">
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

export function ReceiptInvoiceRelatedTables({
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

export function ApprovalPath({
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

export function ApprovalTimeline({
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

export function CompanyContextSelector({
  companies,
  label,
  onCompanyChange,
  selectedCompany,
  selectedCompanyId,
}: {
  companies: CompanyContext[]
  label: string
  onCompanyChange: (companyId: string) => void
  selectedCompany: CompanyContext
  selectedCompanyId: string
}) {
  const companyOptions = companies.map((company) => ({
    businessScope: company.businessScope,
    companyId: company.companyId,
    companyName: company.companyName,
    label: company.companyName,
    value: company.companyId,
  }))

  return (
    <div className="summary-block company-context-block">
      <span>{label}</span>
      <Select
        className="company-context-select"
        options={companyOptions}
        optionFilterProp="label"
        optionRender={(option) => {
          const company = option.data as (typeof companyOptions)[number]
          return (
            <div className="company-select-option">
              <strong>{company.label}</strong>
              <span>{company.businessScope}</span>
            </div>
          )
        }}
        popupClassName="company-context-dropdown"
        showSearch
        value={selectedCompanyId}
        onChange={onCompanyChange}
      />
      <small>{selectedCompany.businessScope}</small>
    </div>
  )
}
