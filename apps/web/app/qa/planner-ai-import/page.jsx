import ProgramPlannerView from '../../../components/admin/program-planner-view'
import { getProgramPlannerById } from '../../../components/admin/program-planner-utils'

export const dynamic = 'force-dynamic'

export default function PlannerAiImportQaPage() {
  const program = getProgramPlannerById('program-1')

  return (
    <main className="min-h-screen bg-[var(--admin-shell-page-bg)] p-6 text-[var(--admin-dashboard-card-text)]">
      <ProgramPlannerView program={program} enableLocalAiImportQa />
    </main>
  )
}
