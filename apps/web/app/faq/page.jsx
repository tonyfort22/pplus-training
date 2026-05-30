import { LandingFooter, LandingHeader } from '../landing-sections'

export const metadata = {
  title: 'FAQ | PPLUS Training',
  description: 'Answers to common questions about PPLUS Training programs, app access, pricing, and getting started.',
}

const faqItems = [
  {
    question: 'What programs does P+ Training offer?',
    answer:
      'P+ Training offers off-ice hockey development programs built around strength, speed, mobility, recovery, and skill-support work. Programs are structured so athletes know what to do, when to do it, and how to keep progressing.',
  },
  {
    question: 'Do I need previous training experience?',
    answer:
      'No. The app is built to guide athletes through the plan with clear workouts, exercise details, and progress tracking. Athletes can start with the assigned program and build consistency over time.',
  },
  {
    question: 'How do I download the app?',
    answer:
      'You can download PPLUS Training from the App Store when your coach or training group gives you access. Once you sign in, your assigned training plan and workouts will be available inside the app.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'Pricing depends on the program, group, or coach setup. If you are joining through a team or academy, your coach will confirm the exact access and payment details.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Start by contacting P+ Training or your coach. Once your account is created, you can sign in, review your assigned program, and begin logging workouts right away.',
  },
]

export default function FaqPage() {
  return (
    <main className="landing-page faq-page">
      <LandingHeader />

      <section className="landing-section faq-hero-section" aria-labelledby="faq-heading">
        <div className="landing-shell faq-shell">
          <div className="faq-hero-copy">
            <p className="landing-pill faq-pill">FAQ</p>
            <h1 id="faq-heading" className="faq-hero-title">
              Frequently Asked <span>Questions</span>
            </h1>
          </div>

          <div className="faq-accordion-list" aria-label="Frequently asked questions">
            {faqItems.map((item, index) => (
              <details key={item.question} className="faq-item" open={index === 0}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  )
}
