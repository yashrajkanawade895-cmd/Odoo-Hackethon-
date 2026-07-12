import PageHeader from '../components/PageHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Settings() {
  const { user } = useAuth()
  return (
    <>
      <PageHeader title="Settings" subtitle="Account and preferences." />
      <div className="bg-panel border border-line rounded-lg p-4 max-w-md">
        <p className="text-sm text-ink mb-1">{user.name}</p>
        <p className="text-xs text-ink/50">Signed in as {user.role.replace('_', ' ')}</p>
      </div>
    </>
  )
}
