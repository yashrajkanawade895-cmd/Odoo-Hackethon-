import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as Icons from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { api } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'

function StatusDot({ status, size = 'w-2.5 h-2.5' }) {
  const colors = {
    available: 'bg-[#2B6E5E]',
    focus_time: 'bg-[#3D5A8A]',
    in_meeting: 'bg-[#8A6D3D]',
    wfh: 'bg-[#A13D3D]',
    away: 'bg-[#8B8680]',
  }
  return <div className={`${size} rounded-full ${colors[status] || 'bg-line'} border border-panel shrink-0`} title={status.replace('_', ' ')} />
}

export default function Directory() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const { data: employees = [], isLoading } = useQuery({ 
    queryKey: ['employees'], 
    queryFn: api.employees.getEmployees 
  })

  const updateFocusMutation = useMutation({
    mutationFn: (focusStatus) => api.employees.updateEmployeeFocus(user.id, focusStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  })

  // Group by department
  const byDepartment = employees.reduce((acc, emp) => {
    const dept = emp.department?.name || 'Unassigned'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(emp)
    return acc
  }, {})

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader title="Directory" subtitle="Find and connect with your team" />
        
        <div className="flex items-center gap-3 bg-panel border border-line rounded-lg p-2">
          <span className="text-xs text-ink/70">My Status:</span>
          <select 
            value={user.focusStatus || 'available'} 
            onChange={(e) => updateFocusMutation.mutate(e.target.value)}
            className="text-xs bg-surface border border-line rounded px-2 py-1 outline-none focus:border-accent"
          >
            <option value="available">Available</option>
            <option value="focus_time">Focus Time</option>
            <option value="in_meeting">In Meeting</option>
            <option value="wfh">Working from Home</option>
            <option value="away">Away</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[1,2].map(i => (
            <div key={i}>
              <div className="w-32 h-5 bg-panel animate-pulse rounded mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1,2,3,4].map(j => <div key={j} className="h-32 bg-panel animate-pulse rounded-lg border border-line" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(byDepartment).map(([deptName, emps]) => (
            <div key={deptName}>
              <h2 className="text-lg font-medium text-ink mb-4">{deptName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {emps.map(emp => (
                  <div key={emp.id} className="bg-panel border border-line rounded-lg p-4 relative group lift-on-hover">
                    <div className="flex gap-3 mb-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center text-sm font-medium text-ink group-hover:border-accent/50 transition-colors">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <StatusDot status={emp.focusStatus} size="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-ink truncate group-hover:text-accent transition-colors">{emp.name}</h3>
                        <p className="text-xs text-ink/60 truncate">{emp.role.replace('_', ' ')}</p>
                        <p className="text-[11px] text-ink/40 mt-1">{emp.project?.name || 'No active project'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-ink/60 border-t border-line/50 pt-3 mt-3">
                      <button className="hover:text-accent flex items-center gap-1 text-xs transition-colors"><Icons.Mail size={14} /> Email</button>
                      <button className="hover:text-accent flex items-center gap-1 text-xs transition-colors"><Icons.MessageSquare size={14} /> Message</button>
                    </div>
                    
                    {/* Hover Card Data (Manager, Asset info) - simple implementation for hackathon */}
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {emp.manager && (
                        <div className="text-[10px] text-ink/50 flex items-center gap-1 bg-surface px-2 py-1 rounded-full border border-line shadow-sm">
                          <Icons.GitMerge size={10} /> Reports to {emp.manager.name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
