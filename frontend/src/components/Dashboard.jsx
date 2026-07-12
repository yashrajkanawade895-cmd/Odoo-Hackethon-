import * as Icons from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import PageHeader from './PageHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../api/index.js'
import { overdueItems, upcomingItems, quickActions } from '../data/mockData.js'

function ActivityRow({ item, overdue }) {
  return (
    <div
      className={`flex items-start gap-3 py-3 px-3 rounded-md transition-colors duration-150 hover:bg-surface border-b border-line last:border-0`}
    >
      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${overdue ? 'bg-status-lost' : 'bg-accent'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink">{item.detail}</p>
        <p className="text-xs text-ink/50 mt-1">
          {item.type} · <span className="font-mono-tag text-[10px]">{item.id}</span>
        </p>
      </div>
      <p className={`text-xs font-mono-tag ${overdue ? 'text-status-lost' : 'text-ink/60'}`}>{item.dueDate}</p>
    </div>
  )
}

function StatusDot({ status }) {
  const colors = {
    available: 'bg-[#2B6E5E]',
    focus_time: 'bg-[#3D5A8A]',
    in_meeting: 'bg-[#8A6D3D]',
    wfh: 'bg-[#A13D3D]',
    away: 'bg-[#8B8680]',
  }
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-line'} border border-panel shrink-0`} title={status.replace('_', ' ')} />
}

export default function Workspace() {
  const { user } = useAuth()
  const role = user?.role || 'admin'
  
  const { data: bookings = [] } = useQuery({ queryKey: ['my-bookings'], queryFn: api.bookings.getMyBookings })
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: api.employees.getEmployees })
  
  // Find team members (same department or project)
  const myTeam = employees.filter(e => 
    e.id !== user.id && 
    (e.departmentId === user.departmentId || e.project?.name === user.project?.name)
  ).slice(0, 5)

  const focusCounts = employees.reduce((acc, emp) => {
    acc[emp.focusStatus] = (acc[emp.focusStatus] || 0) + 1
    return acc
  }, {})

  const todayBookings = bookings.filter(b => b.status === 'upcoming' || b.status === 'ongoing').slice(0, 3)
  const myProject = user?.project

  return (
    <>
      <PageHeader title={`Good morning, ${user?.name?.split(' ')[0] || 'User'}`} subtitle="Here's what's happening in your workspace today." />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* Left Column: My Day (Meetings, Project, Team) */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-panel border border-line rounded-lg p-4 lift-on-hover">
              <div className="flex items-center gap-2 mb-3 text-ink/70">
                <Icons.Calendar size={16} />
                <h3 className="text-sm font-medium">Today's Meetings</h3>
              </div>
              {todayBookings.length === 0 ? (
                <p className="text-sm text-ink/50">No meetings today.</p>
              ) : (
                <div className="space-y-1">
                  {todayBookings.map(b => {
                    const purposeConfig = {
                      internal: { color: 'bg-[#2B6E5E]', label: 'Internal' },
                      client: { color: 'bg-[#3D5A8A]', label: 'Client' },
                      training: { color: 'bg-[#8A6D3D]', label: 'Training' },
                      interview: { color: 'bg-[#B8863B]', label: 'Interview' },
                      town_hall: { color: 'bg-[#A13D3D]', label: 'Town Hall' },
                    }
                    const cfg = purposeConfig[b.purpose] || { color: 'bg-line', label: b.purpose || 'Meeting' }
                    return (
                      <div key={b.id} className="flex items-start gap-2.5 py-2 border-b border-line/50 last:border-0">
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-ink truncate">{b.asset?.name || b.resource}</span>
                            <span className="font-mono-tag text-[11px] text-ink/50">{new Date(b.startTs).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[10px] leading-none px-1.5 py-0.5 rounded-full text-white ${cfg.color}`}>{cfg.label}</span>
                            {b.bookedFor && <span className="text-[11px] text-ink/50 truncate">{b.bookedFor}</span>}
                            {b.attendees && (
                              <span className="text-[11px] text-ink/40 flex items-center gap-0.5 ml-auto">
                                <Icons.Users size={10} /> {b.attendees}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="bg-panel border border-line rounded-lg p-4 lift-on-hover">
              <div className="flex items-center gap-2 mb-3 text-ink/70">
                <Icons.Briefcase size={16} />
                <h3 className="text-sm font-medium">Current Project</h3>
              </div>
              {myProject ? (
                <div>
                  <p className="text-sm font-medium text-ink mb-1">{myProject.name}</p>
                  <p className="text-xs text-ink/60">{myProject.description || 'Active development'}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink/60">
                    <Icons.MapPin size={12} /> {myProject.meetingLocation || 'Virtual'}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink/50">No active project.</p>
              )}
            </div>

            <div className="bg-panel border border-line rounded-lg p-4 lift-on-hover">
              <div className="flex items-center gap-2 mb-3 text-ink/70">
                <Icons.Package size={16} />
                <h3 className="text-sm font-medium">My Assets</h3>
              </div>
              <p className="text-2xl font-semibold font-mono-tag text-ink">2</p>
              <p className="text-xs text-ink/50 mt-1">MacBook, Monitor</p>
            </div>
          </div>

          <div className="bg-panel border border-line rounded-lg p-4">
            <h2 className="text-sm font-medium text-ink mb-3">Operations Feed</h2>
            <div className="space-y-1">
              {overdueItems.map(item => <ActivityRow key={item.id} item={item} overdue />)}
              {upcomingItems.map(item => <ActivityRow key={item.id} item={item} />)}
            </div>
          </div>
        </div>

        {/* Right Column: Pulse, Team */}
        <div className="lg:col-span-4 space-y-6">
          
          {(role === 'dept_head' || role === 'admin') && (
            <div className="bg-panel border border-line rounded-lg p-4">
              <h2 className="text-sm font-medium text-ink mb-4">Department Pulse</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-ink/80"><StatusDot status="available" /> {focusCounts['available'] || 0} Available</div>
                <div className="flex items-center gap-2 text-sm text-ink/80"><StatusDot status="focus_time" /> {focusCounts['focus_time'] || 0} Focus Time</div>
                <div className="flex items-center gap-2 text-sm text-ink/80"><StatusDot status="in_meeting" /> {focusCounts['in_meeting'] || 0} In Meeting</div>
                <div className="flex items-center gap-2 text-sm text-ink/80"><StatusDot status="away" /> {(focusCounts['away'] || 0) + (focusCounts['wfh'] || 0)} Away/WFH</div>
              </div>
            </div>
          )}

          <div className="bg-panel border border-line rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-ink">My Team</h2>
              <Link to="/directory" className="text-xs text-accent hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {myTeam.length === 0 ? <p className="text-xs text-ink/50">No team members found.</p> : myTeam.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 group relative cursor-pointer">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-xs font-medium text-ink border border-line">
                      {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <StatusDot status={emp.focusStatus} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate group-hover:text-accent transition-colors">{emp.name}</p>
                    <p className="text-[11px] text-ink/50 truncate">{emp.project?.name || emp.department?.name}</p>
                  </div>
                  <Icons.MessageSquare size={14} className="text-ink/20 group-hover:text-accent transition-colors" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-panel border border-line rounded-lg p-4 h-fit">
            <h2 className="text-sm font-medium text-ink mb-3">Quick actions</h2>
            <div className="flex flex-col gap-2">
              {quickActions.map((action) => {
                const Icon = Icons[action.key === 'register' ? 'Package' : action.key === 'book' ? 'Calendar' : 'Wrench']
                const path = action.key === 'register' ? '/assets' : action.key === 'book' ? '/meetings' : '/maintenance'
                return (
                  <Link to={path} key={action.key} className="lift-on-hover flex items-center gap-3 text-left px-3 py-2.5 rounded-md border border-line hover:border-accent group">
                    <span className="w-8 h-8 rounded-md bg-status-available/10 flex items-center justify-center text-status-available shrink-0">
                      <Icon size={16} />
                    </span>
                    <span className="text-sm text-ink group-hover:text-accent">{action.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
