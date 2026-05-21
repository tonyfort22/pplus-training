import { notFound } from 'next/navigation'

import AdminShell from '../../../../components/admin/admin-shell'
import ProgramPlannerView from '../../../../components/admin/program-planner-view'
import { getProgramPlannerById } from '../../../../components/admin/program-planner-utils'

export default async function ProgramPlannerPage({ params }) {
  const { programId } = await params
  const program = getProgramPlannerById(programId)

  if (!program) {
    notFound()
  }

  return <AdminShell currentPath="/admin/programs" contentOverride={<ProgramPlannerView program={program} />} />
}
