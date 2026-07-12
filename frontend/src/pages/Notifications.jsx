import { Bell } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { api } from '../api/index.js'

export default function Notifications() {
  const qc = useQueryClient()

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.getNotifications(),
  })
  const notifications = notificationsData?.notifications ?? []
  const unreadCount = notificationsData?.unreadCount ?? notifications.filter((n) => !n.isRead).length

  const markRead = useMutation({
    mutationFn: (id) => api.notifications.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => api.logs.getActivityLogs(),
  })
  const logs = logsData ?? []

  return (
    <>
      <PageHeader
        title="Notifications and activity"
        subtitle="Keep every role informed without digging for updates."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-panel border border-line rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-ink flex items-center gap-2">
              <Bell size={14} /> Notifications
              {unreadCount > 0 && <span className="text-xs bg-status-lost/10 text-status-lost px-2 py-0.5 rounded-full">{unreadCount} unread</span>}
            </p>
          </div>
          <div className="space-y-2">
            {notificationsLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-full h-[52px] rounded-md border border-line bg-surface animate-pulse" />
              ))}
            {!notificationsLoading && notifications.length === 0 && (
              <p className="text-sm text-ink/50 px-3 py-6 text-center">No notifications yet.</p>
            )}
            {!notificationsLoading &&
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markRead.mutate(n.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md border ${n.isRead ? 'border-line' : 'border-accent/40 bg-accent/5'}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-ink">{n.type}</p>
                    <p className="text-xs text-ink/40 font-mono-tag">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-ink/60 mt-0.5">{n.message}</p>
                </button>
              ))}
          </div>
        </div>

        <div className="bg-panel border border-line rounded-lg overflow-hidden h-fit">
          <div className="px-4 py-3 border-b border-line">
            <p className="text-sm font-medium text-ink">Activity log</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface text-ink/60 text-xs">
              <tr>
                <th className="text-left px-4 py-2 font-medium">User</th>
                <th className="text-left px-4 py-2 font-medium">Action</th>
                <th className="text-left px-4 py-2 font-medium">Entity</th>
                <th className="text-left px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ink/50">Loading activity…</td>
                </tr>
              )}
              {!logsLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ink/50">No activity yet.</td>
                </tr>
              )}
              {!logsLoading &&
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-line">
                    <td className="px-4 py-2.5 text-ink">{log.user?.name || 'system'}</td>
                    <td className="px-4 py-2.5 text-ink/70">{log.action}</td>
                    <td className="px-4 py-2.5 font-mono-tag text-accent">{log.entityType}</td>
                    <td className="px-4 py-2.5 text-ink/50 font-mono-tag text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
