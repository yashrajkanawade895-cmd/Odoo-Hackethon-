const styles = {
  available: 'bg-status-available/10 text-status-available',
  allocated: 'bg-status-allocated/10 text-status-allocated',
  reserved: 'bg-status-reserved/10 text-status-reserved',
  maintenance: 'bg-status-maintenance/10 text-status-maintenance',
  lost: 'bg-status-lost/10 text-status-lost',
  retired: 'bg-status-retired/10 text-status-retired',
  disposed: 'bg-status-disposed/10 text-status-disposed',
}

const dotStyles = {
  available: 'bg-status-available',
  allocated: 'bg-status-allocated',
  reserved: 'bg-status-reserved',
  maintenance: 'bg-status-maintenance',
  lost: 'bg-status-lost',
  retired: 'bg-status-retired',
  disposed: 'bg-status-disposed',
}

const labels = {
  available: 'Available',
  allocated: 'Allocated',
  reserved: 'Reserved',
  maintenance: 'Under maintenance',
  lost: 'Lost',
  retired: 'Retired',
  disposed: 'Disposed',
}

export default function StatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
      {labels[status]}
    </span>
  )
}
