export async function POST(request: Request) {
  try {
    const { title, location, remote, min_salary } = await request.json()

    // Mock job results for now — integrate Adzuna API with your API key
    const mockJobs = [
      {
        id: 'job-1',
        title: `${title}`,
        company: 'Google',
        location: location,
        remote_type: remote === 'any' ? 'remote' : remote,
        salary_min: min_salary || 120000,
        salary_max: 180000,
        source: 'LinkedIn',
        url: 'https://linkedin.com',
      },
      {
        id: 'job-2',
        title: `${title} at Scale`,
        company: 'Meta',
        location: location,
        remote_type: remote === 'any' ? 'hybrid' : remote,
        salary_min: min_salary || 130000,
        salary_max: 200000,
        source: 'Indeed',
        url: 'https://indeed.com',
      },
      {
        id: 'job-3',
        title: `Senior ${title}`,
        company: 'Stripe',
        location: location,
        remote_type: remote === 'any' ? 'remote' : remote,
        salary_min: min_salary || 140000,
        salary_max: 220000,
        source: 'Glassdoor',
        url: 'https://glassdoor.com',
      },
    ]

    return Response.json({ jobs: mockJobs })
  } catch (error) {
    console.error('Error searching jobs:', error)
    return Response.json({ error: 'Failed to search jobs' }, { status: 500 })
  }
}
