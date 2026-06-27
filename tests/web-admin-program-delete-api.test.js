import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminProgramRouteHandlers } from '../apps/web/lib/admin-program-route-handlers.js'
import { createAdminProgramRepository } from '../apps/web/lib/admin-program-repository.js'

async function readJson(response) {
  return response.json()
}

function withProgramDeleteFetch(callback) {
  const previousUrl = process.env.SUPABASE_URL
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const previousFetch = globalThis.fetch
  const requests = []

  process.env.SUPABASE_URL = 'https://pplus-test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-test-key'
  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = String(url)
    const method = options.method || 'GET'
    const body = options.body ? JSON.parse(options.body) : null
    requests.push({ url: requestUrl, method, body })

    if (method === 'GET' && requestUrl.includes('/programs?select=id&id=in.(program-delete-1)')) {
      return Response.json([{ id: 'program-delete-1' }])
    }

    if (method === 'DELETE' && requestUrl.includes('/programs?id=in.(program-delete-1)')) {
      return Response.json([{ id: 'program-delete-1', name: 'Delete-ready strength block' }])
    }

    return new Response(JSON.stringify({ error: `Unhandled ${method} ${requestUrl}` }), { status: 500 })
  }

  return Promise.resolve()
    .then(() => callback({ requests }))
    .finally(() => {
      if (previousUrl === undefined) delete process.env.SUPABASE_URL
      else process.env.SUPABASE_URL = previousUrl
      if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
      else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey
      globalThis.fetch = previousFetch
    })
}

test('admin programs DELETE route sends a single-row delete to the dedicated repository method', async () => {
  const calls = []
  const deletedProgram = { id: 'program-delete-1' }
  const handlers = createAdminProgramRouteHandlers({
    createRepository: () => ({
      deleteProgram: async (programId) => {
        calls.push(programId)
        return deletedProgram
      },
      deletePrograms: async () => {
        throw new Error('single delete action should not use bulk delete')
      },
      updateProgram: async () => {
        throw new Error('delete action should not use generic update')
      },
      archiveProgram: async () => {
        throw new Error('delete action should not use archive')
      },
    }),
  })

  const response = await handlers.DELETE(new Request('http://pplus.test/api/admin/programs', {
    method: 'DELETE',
    body: JSON.stringify({ id: 'program-delete-1' }),
  }))

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), { program: deletedProgram })
  assert.deepEqual(calls, ['program-delete-1'])
})

test('admin program repository delete action validates, deletes only the selected program row, and returns its id', async () => {
  await withProgramDeleteFetch(async ({ requests }) => {
    const repository = createAdminProgramRepository()

    const deletedProgram = await repository.deleteProgram('program-delete-1')

    const existenceLookup = requests.find((request) => request.method === 'GET' && request.url.includes('/programs?select=id&id=in.(program-delete-1)'))
    const programDelete = requests.find((request) => request.method === 'DELETE' && request.url.includes('/programs?id=in.(program-delete-1)'))
    const childDeletes = requests.filter((request) => request.method === 'DELETE' && !request.url.includes('/programs?id=in.(program-delete-1)'))
    const patchRequests = requests.filter((request) => request.method === 'PATCH')

    assert.ok(existenceLookup)
    assert.ok(programDelete)
    assert.deepEqual(childDeletes, [])
    assert.deepEqual(patchRequests, [])
    assert.deepEqual(deletedProgram, { id: 'program-delete-1' })
  })
})
