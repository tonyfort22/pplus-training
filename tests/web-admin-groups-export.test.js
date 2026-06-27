import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildGroupsExportCsv,
  getGroupsExportFileName,
  groupExportColumns,
} from '../apps/web/lib/admin-groups-export.js'

test('groups export builds quoted CSV with all testing-ready admin columns', () => {
  assert.deepEqual(groupExportColumns, [
    'Group ID',
    'Name',
    'Description',
    'Access',
    'Status',
    'Athlete count',
    'Athletes',
    'Updated',
  ])

  const csv = buildGroupsExportCsv([
    {
      id: 'group-1',
      name: 'Forwards, U18',
      description: 'Coach "A" group',
      access: 'Private',
      status: 'Active',
      athleteCount: 2,
      athletes: [{ name: 'Mason Lee' }, { name: 'Ava "Rocket" Chen' }],
      updatedAt: '2026-06-08T12:34:56.000Z',
    },
    {
      id: 'group-2',
      name: 'Goalies',
      description: null,
      access: 'Public',
      status: 'Archived',
      athletes: [],
      updated: 'Jun 8, 2026',
    },
  ])

  assert.equal(csv, [
    '"Group ID","Name","Description","Access","Status","Athlete count","Athletes","Updated"',
    '"group-1","Forwards, U18","Coach ""A"" group","Private","Active","2","Mason Lee; Ava ""Rocket"" Chen","2026-06-08T12:34:56.000Z"',
    '"group-2","Goalies","","Public","Archived","0","","Jun 8, 2026"',
  ].join('\n'))
})

test('groups export filename is stable and date-scoped', () => {
  assert.equal(getGroupsExportFileName(new Date('2026-06-08T15:45:00.000Z')), 'pplus-groups-export-2026-06-08.csv')
})
