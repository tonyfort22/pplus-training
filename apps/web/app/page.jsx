const coachCards = [
  {
    title: 'Athletes',
    value: '24',
    detail: 'Active athletes managed through PPLUS Training'
  },
  {
    title: 'Programs',
    value: '12',
    detail: 'Current assigned and draft training programs'
  },
  {
    title: 'Sessions this week',
    value: '87',
    detail: 'Completed workout sessions ready for analytics'
  }
];

const priorities = [
  'Build the workout session engine first',
  'Keep prescribed and actual values separate',
  'Run fatigue analytics from completed session data only'
];

const engineSteps = [
  'Create workout session from planned workout snapshot',
  'Complete a session set without mutating prescribed values',
  'Default actual values from prescribed values when needed',
  'Finish session and make it the trigger for analytics'
];

export default function HomePage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>PPLUS Training</p>
          <h1 style={styles.heading}>Coach dashboard scaffold</h1>
          <p style={styles.subheading}>
            Clean planning, clean execution, and analytics built on real completed sessions.
          </p>
        </div>
      </section>

      <section style={styles.cardGrid}>
        {coachCards.map((card) => (
          <article key={card.title} style={styles.metricCard}>
            <p style={styles.metricLabel}>{card.title}</p>
            <h2 style={styles.metricValue}>{card.value}</h2>
            <p style={styles.metricDetail}>{card.detail}</p>
          </article>
        ))}
      </section>

      <section style={styles.twoColumn}>
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Current build priorities</h2>
          <ul style={styles.list}>
            {priorities.map((priority) => (
              <li key={priority}>{priority}</li>
            ))}
          </ul>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Session engine milestones</h2>
          <ol style={styles.list}>
            {engineSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#08111f',
    color: '#f8fafc',
    padding: '32px'
  },
  hero: {
    background: 'linear-gradient(135deg, #0f172a, #1d4ed8)',
    borderRadius: '24px',
    padding: '32px',
    marginBottom: '24px'
  },
  eyebrow: {
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '12px'
  },
  heading: {
    margin: '8px 0 12px',
    fontSize: '40px'
  },
  subheading: {
    maxWidth: '700px',
    lineHeight: 1.5,
    color: '#dbeafe'
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  metricCard: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '20px',
    padding: '20px'
  },
  metricLabel: {
    color: '#94a3b8',
    marginBottom: '8px'
  },
  metricValue: {
    fontSize: '32px',
    margin: '0 0 8px'
  },
  metricDetail: {
    color: '#cbd5e1',
    lineHeight: 1.5,
    margin: 0
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px'
  },
  panel: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '20px',
    padding: '24px'
  },
  panelTitle: {
    marginTop: 0,
    marginBottom: '16px'
  },
  list: {
    margin: 0,
    paddingLeft: '20px',
    lineHeight: 1.8,
    color: '#dbeafe'
  }
};
