import { useQuery } from '@tanstack/react-query'
import * as Icons from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { api } from '../api/index.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Projects() {
  const { user } = useAuth()
  const { data: projects = [], isLoading } = useQuery({ 
    queryKey: ['projects'], 
    queryFn: () => api.projects.getProjects() 
  })

  return (
    <div className="pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader title="Projects" subtitle="Active initiatives and teams" />
        
        {['admin', 'dept_head'].includes(user.role) && (
          <button className="btn-primary">
            <Icons.Plus size={16} /> New Project
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-40 bg-panel animate-pulse rounded-lg border border-line" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="bg-panel border border-line rounded-lg p-5 lift-on-hover flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-ink text-lg">{project.name}</h3>
                  <p className="text-sm text-ink/60 mt-1">{project.description}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  project.status === 'active' ? 'bg-status-available/10 text-status-available' :
                  project.status === 'paused' ? 'bg-status-reserved/10 text-status-reserved' :
                  'bg-line text-ink/60'
                }`}>
                  {project.status.toUpperCase()}
                </span>
              </div>
              
              <div className="mt-4 flex-1">
                <div className="flex items-center justify-between text-xs text-ink/70 mb-2">
                  <span className="flex items-center gap-1.5"><Icons.Users size={14} /> Team ({project.members?.length || 0})</span>
                  <span className="flex items-center gap-1.5"><Icons.MapPin size={14} /> {project.meetingLocation || 'TBD'}</span>
                </div>
                
                <div className="flex -space-x-2 mt-2">
                  {project.members?.map(member => (
                    <div key={member.id} title={member.name} className="w-8 h-8 rounded-full bg-surface border-2 border-panel flex items-center justify-center text-[10px] font-medium text-ink relative z-10 hover:z-20">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                  {(!project.members || project.members.length === 0) && (
                    <span className="text-xs text-ink/40 ml-2">No members assigned</span>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-line flex justify-between items-center">
                <span className="text-xs font-mono-tag text-ink/50">{project.department?.name}</span>
                <button className="text-sm font-medium text-accent hover:underline">View details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
