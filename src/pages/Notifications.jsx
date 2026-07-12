import { Bell } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader.jsx'
import { api } from '../api/client.js'

export default function Notifications() {
  const queryClient = useQueryClient()

  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: api.notifications.list,
    refetchInterval: 30_000 // poll every 30s
  })

  const { data: activityLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => api.logs.activity()
  })

  const markReadMutation = useMutation({
    mutationFn: api.notifications.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  })

  const notifications = notifData?.notifications || []
  const unreadCount = notifData?.unreadCount || 0

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
              {unreadCount > 0 && (
                <span className="text-xs bg-status-lost/10 text-status-lost px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          {notifLoading && <p className="text-sm text-ink/60">Loading...</p>}
          <div className="space-y-2">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md border ${n.isRead ? 'border-line' : 'border-accent/40 bg-accent/5'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-ink">{n.type}</p>
                  <p className="text-xs text-ink/40 font-mono-tag">
                    {new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <p className="text-xs text-ink/60 mt-0.5">{n.message}</p>
              </button>
            ))}
            {!notifLoading && notifications.length === 0 && (
              <p className="text-sm text-ink/40 text-center py-4">No notifications yet.</p>
            )}
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
                <tr><td colSpan="4" className="p-4 text-center text-ink/60 text-sm">Loading...</td></tr>
              )}
              {activityLogs.map((log) => (
                <tr key={log.id} className="border-t border-line">
                  <td className="px-4 py-2.5 text-ink">{log.user?.name || `#${log.userId}`}</td>
                  <td className="px-4 py-2.5 text-ink/70">{log.action}</td>
                  <td className="px-4 py-2.5 font-mono-tag text-accent">#{log.entityId}</td>
                  <td className="px-4 py-2.5 text-ink/50 font-mono-tag text-xs">
                    {new Date(log.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
              {!logsLoading && activityLogs.length === 0 && (
                <tr><td colSpan="4" className="p-4 text-center text-ink/40 text-sm">No activity yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
