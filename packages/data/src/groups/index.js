function requireFetch(fetchImpl) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Supabase REST groups repository requires a fetch implementation')
  }
  return fetchImpl
}

function createSupabaseGroupsRequest(config) {
  const baseUrl = config?.url
  const anonKey = config?.anonKey
  const accessToken = config?.accessToken || null
  const schema = config?.schema || 'public'
  const fetchImpl = requireFetch(config?.fetchImpl ?? globalThis.fetch)

  function resolveAccessToken() {
    return typeof accessToken === 'function' ? accessToken() : accessToken
  }

  if (!baseUrl) {
    throw new Error('Supabase REST groups repository requires a url')
  }

  if (!anonKey) {
    throw new Error('Supabase REST groups repository requires an anonKey')
  }

  return async function request({ method = 'GET', table, query = {}, body = null, prefer = 'return=representation' }) {
    const url = new URL(`/rest/v1/${table}`, baseUrl)
    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === '') continue
      url.searchParams.set(key, value)
    }

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${resolveAccessToken() || anonKey}`,
      Accept: 'application/json',
      Prefer: prefer,
      'Accept-Profile': schema,
      'Content-Profile': schema,
    }

    if (body !== null && body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetchImpl(url.toString(), {
      method,
      headers,
      ...(body !== null && body !== undefined ? { body: JSON.stringify(body) } : {}),
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : null

    if (!response.ok) {
      const message = payload?.message || response.statusText || 'Unknown Supabase groups error'
      throw new Error(`Supabase groups request failed (${response.status}): ${message}`)
    }

    return payload
  }
}

function formatAthleteCountLabel(count) {
  const normalizedCount = Number.isFinite(Number(count)) ? Number(count) : 0
  return `${normalizedCount} ${normalizedCount === 1 ? 'athlete' : 'athletes'}`
}

function mapGroupRow(row, membershipsByGroupId) {
  if (!row?.id) return null
  const athleteIds = membershipsByGroupId.get(row.id) || []
  const athleteCount = athleteIds.length
  return {
    id: row.id,
    coachId: row.coach_id ?? null,
    name: row.name || 'Untitled group',
    description: row.description || '',
    accessLevel: row.access_level || 'private',
    status: row.status || 'active',
    athleteIds,
    athleteCount,
    athleteCountLabel: formatAthleteCountLabel(athleteCount),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

function isMissingGroupsSchemaError(error) {
  const message = String(error?.message || '')
  return message.includes('athlete_groups') || message.includes('athlete_group_memberships') || message.includes('Could not find the table')
}

function normalizeAthleteIds(athleteIds = []) {
  return [...new Set((Array.isArray(athleteIds) ? athleteIds : [])
    .map((athleteId) => String(athleteId || '').trim())
    .filter(Boolean))]
}

async function syncGroupMemberships({ request, groupId, athleteIds = [] }) {
  const normalizedAthleteIds = normalizeAthleteIds(athleteIds)
  if (!groupId) return normalizedAthleteIds

  await request({
    method: 'DELETE',
    table: 'athlete_group_memberships',
    query: { athlete_group_id: `eq.${groupId}` },
    prefer: 'return=minimal',
  })

  if (normalizedAthleteIds.length === 0) return []

  await request({
    method: 'POST',
    table: 'athlete_group_memberships',
    body: normalizedAthleteIds.map((athleteId) => ({ athlete_group_id: groupId, athlete_id: athleteId })),
  })

  return normalizedAthleteIds
}

export function createSupabaseRestGroupRepository(config) {
  const request = createSupabaseGroupsRequest(config)

  return {
    async listGroupsForCoach(coachId) {
      if (!coachId) return []

      try {
        const groupRows = await request({
          table: 'athlete_groups',
          query: {
            order: 'created_at.asc',
            select: 'id,coach_id,name,description,access_level,status,created_at,updated_at',
          },
        })
        let memberships = []
        try {
          memberships = await request({
            table: 'athlete_group_memberships',
            query: {
              select: 'id,athlete_group_id,athlete_id',
            },
          })
        } catch (error) {
          if (!isMissingGroupsSchemaError(error)) {
            throw error
          }
        }

        const activeGroupIds = new Set((Array.isArray(groupRows) ? groupRows : []).map((group) => group.id).filter(Boolean))
        const membershipsByGroupId = new Map()
        for (const membership of Array.isArray(memberships) ? memberships : []) {
          if (!activeGroupIds.has(membership?.athlete_group_id) || !membership?.athlete_id) continue
          const current = membershipsByGroupId.get(membership.athlete_group_id) || []
          current.push(membership.athlete_id)
          membershipsByGroupId.set(membership.athlete_group_id, current)
        }

        return (Array.isArray(groupRows) ? groupRows : [])
          .map((row) => mapGroupRow(row, membershipsByGroupId))
          .filter(Boolean)
      } catch (error) {
        if (isMissingGroupsSchemaError(error)) {
          return []
        }
        throw error
      }
    },

    async createGroup({ coachId, name, athleteIds = [] } = {}) {
      if (!coachId) {
        throw new Error('Coach id is required to create a group')
      }
      const groupName = String(name || '').trim() || 'Untitled group'
      const groupRows = await request({
        method: 'POST',
        table: 'athlete_groups',
        query: { select: 'id,coach_id,name,description,access_level,status,created_at,updated_at' },
        body: {
          coach_id: coachId,
          name: groupName,
          access_level: 'private',
          status: 'active',
        },
      })
      const groupRow = Array.isArray(groupRows) ? groupRows[0] : groupRows
      const groupId = groupRow?.id
      const normalizedAthleteIds = await syncGroupMemberships({ request, groupId, athleteIds })
      return mapGroupRow(groupRow, new Map([[groupId, normalizedAthleteIds]]))
    },

    async updateGroup({ groupId, name, athleteIds = [] } = {}) {
      if (!groupId) {
        throw new Error('Group id is required to update a group')
      }
      const groupName = String(name || '').trim() || 'Untitled group'
      const groupRows = await request({
        method: 'PATCH',
        table: 'athlete_groups',
        query: {
          id: `eq.${groupId}`,
          select: 'id,coach_id,name,description,access_level,status,created_at,updated_at',
        },
        body: {
          name: groupName,
        },
      })
      const groupRow = Array.isArray(groupRows) ? groupRows[0] : groupRows
      const normalizedAthleteIds = await syncGroupMemberships({ request, groupId, athleteIds })
      return mapGroupRow(groupRow || { id: groupId, name: groupName }, new Map([[groupId, normalizedAthleteIds]]))
    },
  }
}
