const sections = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'athletes', label: 'Athletes' },
  { key: 'programs', label: 'Programs' },
  { key: 'workouts', label: 'Workouts' },
  { key: 'exercises', label: 'Exercises' },
  { key: 'analytics', label: 'Analytics' }
];

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

function SectionPanel({ title, copy }) {
  return (
    <section style={styles.panel}>
      <h2 style={styles.panelTitle}>{title}</h2>
      <p style={styles.panelCopy}>{copy}</p>
    </section>
  );
}

export default function HomePage() {
  return (
    <main style={styles.page}>
      <aside style={styles.sidebar}>
        <div>
          <p style={styles.brandEyebrow}>PPLUS Training</p>
          <h1 style={styles.brandTitle}>Coach OS</h1>
        </div>
        <nav style={styles.nav}>
          {sections.map((section) => (
            <div key={section.key} style={styles.navItem}>
              {section.label}
            </div>
          ))}
        </nav>
      </aside>

      <section style={styles.content}>
        <section style={styles.hero}>
          <div>
            <p style={styles.eyebrow}>Dashboard</p>
            <h2 style={styles.heading}>Coach dashboard scaffold</h2>
            <p style={styles.subheading}>
              The athlete app now has a more meaningful Progress surface, so training execution and performance feedback are both represented in the shell.
            </p>
          </div>
        </section>

        <section style={styles.cardGrid}>
          {coachCards.map((card) => (
            <article key={card.title} style={styles.metricCard}>
              <p style={styles.metricLabel}>{card.title}</p>
              <h3 style={styles.metricValue}>{card.value}</h3>
              <p style={styles.metricDetail}>{card.detail}</p>
            </article>
          ))}
        </section>

        <section style={styles.twoColumn}>
          <SectionPanel
            title="Athletes"
            copy="Athlete list, athlete detail, assigned programs, recent sessions, and progress review will live here."
          />
          <SectionPanel
            title="Programs"
            copy="Program authoring, week/day scheduling, and assignment flows will live here."
          />
          <SectionPanel
            title="Workouts"
            copy="Workout template creation and set composition will live here."
          />
          <SectionPanel
            title="Exercises"
            copy="Exercise library, muscle maps, and sub-muscle maps will live here."
          />
          <SectionPanel
            title="Analytics"
            copy="Fatigue, performance, compliance, and workload summaries will live here, aligned with the athlete Progress surface."
          />
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
    display: 'grid',
    gridTemplateColumns: '240px 1fr'
  },
  sidebar: {
    background: '#020617',
    borderRight: '1px solid #1e293b',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  brandEyebrow: {
    color: '#93c5fd',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontSize: '12px'
  },
  brandTitle: {
    margin: '8px 0 0'
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  navItem: {
    padding: '12px 14px',
    borderRadius: '12px',
    background: '#0f172a',
    color: '#dbeafe',
    fontWeight: 600
  },
  content: {
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
    maxWidth: '760px',
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
    marginBottom: '12px'
  },
  panelCopy: {
    margin: 0,
    color: '#dbeafe',
    lineHeight: 1.7
  }
};
