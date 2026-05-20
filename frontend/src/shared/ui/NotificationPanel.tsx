import { AlertOutlined, AuditOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons'
import type { LocalizedMessages, NotificationItem } from '../../i18n/localizedContent'

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
