import { Thesis, Program } from './models'

describe('Thesis Trigger tests', () => {
  it('updates milestone_or_status_updated_at when status or milestone changes', async () => {
    // 0. Setup dependencies
    await Program.create({
      id: 'Testing program trigger',
      name: { fi: 'Testausohjelma', en: 'Testing program', sv: 'Testprogram' },
      level: 'master',
      international: true,
      enabled: true,
    })

    // 1. Create a thesis
    const thesis = await Thesis.create({
      programId: 'Testing program trigger',
      topic: 'Trigger Test Thesis',
      status: 'DRAFT',
      startDate: '2024-01-01',
      milestone: 1,
    })


    const initialDate = thesis.milestoneOrStatusUpdatedAt

    // 2. Update a field that is NOT status or milestone
    await thesis.update({ topic: 'Updated Topic' })
    await thesis.reload()
    expect(thesis.milestoneOrStatusUpdatedAt).toEqual(initialDate)

    // Wait slightly to ensure timestamp difference if it were to update
    await new Promise(r => setTimeout(r, 100))

    // 3. Update status
    await thesis.update({ status: 'IN_PROGRESS' })
    await thesis.reload()
    const afterStatusUpdate = thesis.milestoneOrStatusUpdatedAt
    expect(afterStatusUpdate).not.toEqual(initialDate)
    expect(afterStatusUpdate?.getTime()).toBeGreaterThan(initialDate?.getTime() || 0)

    // Wait slightly again
    await new Promise(r => setTimeout(r, 100))

    // 4. Update milestone
    await thesis.update({ milestone: 2 })
    await thesis.reload()
    const afterMilestoneUpdate = thesis.milestoneOrStatusUpdatedAt
    expect(afterMilestoneUpdate).not.toEqual(afterStatusUpdate)
    expect(afterMilestoneUpdate?.getTime()).toBeGreaterThan(afterStatusUpdate?.getTime() || 0)
  })
})
