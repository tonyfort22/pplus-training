import AdminShell from '../../../../components/admin/admin-shell'
import ProgramPlannerView from '../../../../components/admin/program-planner-view'
import { createProgramPlannerFromAdminProgram, getProgramPlannerById } from '../../../../components/admin/program-planner-utils'
import { createAdminProgramRepository } from '../../../../lib/admin-program-repository'

export const dynamic = 'force-dynamic'

export default async function ProgramPlannerPage({ params }) {
  const { programId } = await params
  const seedProgram = getProgramPlannerById(programId)
  let program = seedProgram

  try {
    const repository = createAdminProgramRepository()
    let adminProgram = null

    try {
      adminProgram = await repository.getProgramById(programId)
    } catch (directLookupError) {
      const programs = await repository.listPrograms()
      const matchingProgram = programs.find((candidate) => candidate.name === seedProgram.title)
      if (!matchingProgram?.id) throw directLookupError
      adminProgram = await repository.getProgramById(matchingProgram.id)
    }

    program = createProgramPlannerFromAdminProgram(adminProgram)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Falling back to local program planner seed data.', error?.message)
    }
  }

  return <AdminShell currentPath="/admin/programs" contentOverride={<ProgramPlannerView program={program} />} />
}
