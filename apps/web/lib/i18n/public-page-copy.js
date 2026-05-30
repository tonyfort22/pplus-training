import { DEFAULT_LANGUAGE, normalizePublicLanguage } from './language.js'

export const publicPageCopy = {
  en: {
    home: {
      nav: {
        features: 'Features',
        program: 'Programs',
        faq: 'FAQ',
        support: 'Support',
        signIn: 'Sign In',
      },
      hero: {
        pill: 'The Best Hockey Training App',
        eyebrow: 'ELITE HOCKEY TRAINING',
        heading: 'Off-Ice Work / On-Ice Results',
        copy: 'PPLUS Training helps hockey athletes stay locked in off the ice with guided trainings, simple tracking, and a clear plan built for long-term development.',
      },
      featuresSection: {
        label: 'FEATURES',
        heading: 'Built for Better Off-Ice Training',
      },
      features: [
        {
          slug: 'training-programs',
          title: 'Training Programs',
          description: 'Give athletes a clear off-ice plan with structured programs, scheduled workouts, and week-by-week progression built to support real hockey development.',
          image: '/landing/features/phone-dashboard.png',
          alt: 'PPLUS Training app dashboard and training program overview',
        },
        {
          slug: 'workout-tracking',
          title: 'Workout Tracking',
          description: 'Log every session with guided exercises, sets, reps, and workout flow that make it easy for athletes to stay focused and consistent.',
          image: '/landing/features/phone-workout-tracking.png',
          alt: 'PPLUS Training guided workout tracking screen',
        },
        {
          slug: 'progress-tracking',
          title: 'Progress Tracking',
          description: 'Track completed sessions, strength progress, and training consistency over time so athletes can see the work they’re putting in and keep building momentum.',
          image: '/landing/features/phone-progress-tracking.png',
          alt: 'PPLUS Training athlete progress tracking screen',
        },
        {
          slug: 'recovery-insights',
          title: 'Recovery Insights',
          description: 'Connect training and recovery by giving athletes a better view of workload, consistency, and readiness so they can train hard without losing the bigger picture.',
          image: '/landing/features/phone-recovery-insights.png',
          alt: 'PPLUS Training recovery insights screen',
        },
      ],
      programsSection: {
        label: 'PROGRAMS',
        heading: 'Programs Built for Hockey Development',
      },
      programs: [
        {
          title: 'P+ Off-Season',
          description: 'This is the secret sauce. Do this program and completely dominate your next training camp.',
          bullets: ['10 weeks', '40+ workouts', '100+ exercises'],
        },
        {
          title: 'P+ Skills',
          description: 'Follow along our skills video series while recording your best scores.',
          bullets: ['1-4 weeks', '20+ workouts', '40+ exercises'],
        },
        {
          title: 'P+ Advanced',
          description: 'Follow along our tips and tricks video series while recording your best scores.',
          bullets: ['1-4 weeks', '30+ workouts', '50+ exercises'],
        },
      ],
      footer: {
        brandCopy: 'PPLUS Training helps hockey athletes stay locked in off the ice with guided training, simple tracking, and a clear plan built for long-term development.',
        contact: [
          { icon: 'map-pin', text: '80 boulevard Brien, Repentigny, QC', href: 'https://www.google.com/maps/search/?api=1&query=80%20boulevard%20Brien%2C%20Repentigny%2C%20QC', external: true },
          { icon: 'phone', text: '(514) 915-2722', href: 'tel:+15149152722' },
          { icon: 'mail', text: 'anthony.fortugno@performeplus.com' },
        ],
        columnTitles: {
          features: 'Features',
          programs: 'Programs',
          resources: 'Resources',
        },
        featureLinks: [
          { label: 'Training Programs', href: '/#features' },
          { label: 'Workout Tracking', href: '/#features' },
          { label: 'Progress Tracking', href: '/#features' },
          { label: 'Recovery Insights', href: '/#features' },
        ],
        programLinks: [
          { label: 'P+ Off-Season', href: '/#programs' },
          { label: 'P+ Skills', href: '/#programs' },
          { label: 'P+ Advanced', href: '/#programs' },
        ],
        resourceLinks: [
          { label: 'Support', href: '/support' },
          { label: 'FAQ', href: '/faq' },
          { label: 'Sign In', href: '/admin/login' },
        ],
        copyright: '2026 PPLUS Training. All rights reserved',
      },
    },
    faq: {
      pill: 'FAQ',
      titlePrefix: 'Frequently Asked',
      titleAccent: 'Questions',
      ariaLabel: 'Frequently asked questions',
      items: [
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
      ],
    },
    support: {
      pill: 'Support',
      headingPrefix: 'Get in',
      headingAccent: 'Touch',
      form: {
        labels: {
          firstName: 'First Name *',
          lastName: 'Last Name *',
          email: 'Email Address *',
          category: 'Issue Category *',
          description: 'Issue Description *',
        },
        placeholders: {
          firstName: 'Enter your first name',
          lastName: 'Enter your last name',
          email: 'Enter your email address',
          category: 'Select Category',
          description: 'Please describe your issue in detail...',
        },
        categories: [
          { label: 'Technical Issue', value: 'technical' },
          { label: 'Billing Question', value: 'billing' },
          { label: 'Product Inquiry', value: 'product' },
          { label: 'Account Access', value: 'account' },
          { label: 'Other', value: 'other' },
        ],
        submitIdle: 'Submit',
        submitSubmitting: 'Submitting...',
        submitError: 'We could not submit your support request. Please try again.',
        successTitle: 'Thank you',
        successBody: 'Form submitted successfully, we will get back to you soon.',
      },
      reply: {
        label: 'Continue your support conversation',
        placeholder: 'Type your reply...',
        submitIdle: 'Send reply',
        submitSubmitting: 'Sending...',
        submitError: 'We could not send your reply. Please try again.',
        successTitle: 'Your reply was sent',
        successBody: 'PPLUS Support has been notified and will follow up soon.',
      },
    },
    login: {
      badge: 'The Best Hockey Training App',
      kicker: 'ELITE HOCKEY TRAINING',
      headline: {
        lineOne: 'Off-Ice Work',
        lineTwo: 'On-Ice Results',
      },
      description: 'PPLUS Training helps hockey athletes stay locked in off the ice with guided trainings, simple tracking, and a clear plan built for long-term development.',
      form: {
        title: 'Welcome back 👋🏻',
        email: 'Email',
        password: 'Password',
        togglePassword: 'Toggle password visibility',
        submit: 'Sign in',
        forgotPassword: 'Forgot Password',
      },
    },
  },
  fr: {
    home: {
      nav: {
        features: 'Fonctionnalités',
        program: 'Programmes',
        faq: 'FAQ',
        support: 'Support',
        signIn: 'Connexion',
      },
      hero: {
        pill: 'La meilleure app d’entraînement de hockey',
        eyebrow: 'ENTRAÎNEMENT DE HOCKEY ÉLITE',
        heading: 'Travail hors glace / Résultats sur glace',
        copy: 'PPLUS Training aide les athlètes de hockey à rester constants hors glace avec des entraînements guidés, un suivi simple et un plan clair pour le développement à long terme.',
      },
      featuresSection: {
        label: 'FONCTIONNALITÉS',
        heading: 'Conçue pour l’entraînement hors glace',
      },
      features: [
        {
          slug: 'training-programs',
          title: 'Programmes d’entraînement',
          description: 'Offre aux athlètes un plan hors glace clair avec des programmes structurés, des entraînements planifiés et une progression semaine après semaine pour soutenir un vrai développement hockey.',
          image: '/landing/features/phone-dashboard.png',
          alt: 'Tableau de bord et aperçu du programme PPLUS Training',
        },
        {
          slug: 'workout-tracking',
          title: 'Suivi des entraînements',
          description: 'Enregistre chaque séance avec des exercices guidés, des séries, des répétitions et un déroulement simple qui aide les athlètes à rester concentrés et constants.',
          image: '/landing/features/phone-workout-tracking.png',
          alt: 'Écran de suivi de workout guidé PPLUS Training',
        },
        {
          slug: 'progress-tracking',
          title: 'Suivi de la progression',
          description: 'Suis les séances complétées, les progrès en force et la constance d’entraînement pour que les athlètes voient le travail accompli et gardent leur momentum.',
          image: '/landing/features/phone-progress-tracking.png',
          alt: 'Écran de suivi de progression d’athlète PPLUS Training',
        },
        {
          slug: 'recovery-insights',
          title: 'Métriques sur la récupération',
          description: 'Relie entraînement et récupération avec une meilleure vue de la charge, de la constance et de la préparation pour s’entraîner fort sans perdre la vue d’ensemble.',
          image: '/landing/features/phone-recovery-insights.png',
          alt: 'Écran d’insights de récupération PPLUS Training',
        },
      ],
      programsSection: {
        label: 'PROGRAMMES',
        heading: 'Conçue pour le développement hockey',
      },
      programs: [
        {
          title: 'P+ Hors saison',
          description: 'C’est la sauce secrète. Fais ce programme et domine complètement ton prochain camp d’entraînement.',
          bullets: ['10 semaines', '40+ entraînements', '100+ exercices'],
        },
        {
          title: 'P+ Habiletés',
          description: 'Suis notre série vidéo d’habiletés tout en enregistrant tes meilleurs scores.',
          bullets: ['1 à 4 semaines', '20+ entraînements', '40+ exercices'],
        },
        {
          title: 'P+ Avancé',
          description: 'Suis notre série vidéo de trucs et conseils tout en enregistrant tes meilleurs scores.',
          bullets: ['1 à 4 semaines', '30+ entraînements', '50+ exercices'],
        },
      ],
      footer: {
        brandCopy: 'PPLUS Training aide les athlètes de hockey à rester constants hors glace avec des entraînements guidés, un suivi simple et un plan clair pour le développement à long terme.',
        contact: [
          { icon: 'map-pin', text: '80 boulevard Brien, Repentigny, QC', href: 'https://www.google.com/maps/search/?api=1&query=80%20boulevard%20Brien%2C%20Repentigny%2C%20QC', external: true },
          { icon: 'phone', text: '(514) 915-2722', href: 'tel:+15149152722' },
          { icon: 'mail', text: 'anthony.fortugno@performeplus.com' },
        ],
        columnTitles: {
          features: 'Fonctionnalités',
          programs: 'Programmes',
          resources: 'Ressources',
        },
        featureLinks: [
          { label: 'Programmes d’entraînement', href: '/#features' },
          { label: 'Suivi des entraînements', href: '/#features' },
          { label: 'Suivi de la progression', href: '/#features' },
          { label: 'Métriques sur la récupération', href: '/#features' },
        ],
        programLinks: [
          { label: 'P+ Hors saison', href: '/#programs' },
          { label: 'P+ Habiletés', href: '/#programs' },
          { label: 'P+ Avancé', href: '/#programs' },
        ],
        resourceLinks: [
          { label: 'Support', href: '/support' },
          { label: 'FAQ', href: '/faq' },
          { label: 'Connexion', href: '/admin/login' },
        ],
        copyright: '2026 PPLUS Training. Tous droits réservés',
      },
    },
    faq: {
      pill: 'FAQ',
      titlePrefix: 'Questions',
      titleAccent: 'fréquentes',
      ariaLabel: 'Questions fréquentes',
      items: [
        {
          question: 'Quels programmes P+ Training offre-t-il ?',
          answer:
            'P+ Training offre des programmes de développement hors glace axés sur la force, la vitesse, la mobilité, la récupération et le travail complémentaire aux habiletés. Les programmes sont structurés pour que les athlètes sachent quoi faire, quand le faire et comment continuer à progresser.',
        },
        {
          question: 'Est-ce que je dois avoir de l’expérience en entraînement ?',
          answer:
            'Non. L’app guide les athlètes avec des entraînements clairs, des détails d’exercices et un suivi de la progression. Les athlètes peuvent commencer avec le programme assigné et bâtir leur constance au fil du temps.',
        },
        {
          question: 'Comment télécharger l’app ?',
          answer:
            'Tu peux télécharger PPLUS Training sur l’App Store lorsque ton coach ou ton groupe d’entraînement te donne accès. Une fois connecté, ton plan d’entraînement et tes workouts assignés seront disponibles dans l’app.',
        },
        {
          question: 'Combien ça coûte ?',
          answer:
            'Le prix dépend du programme, du groupe ou de la configuration avec le coach. Si tu rejoins l’app par une équipe ou une académie, ton coach confirmera les détails exacts d’accès et de paiement.',
        },
        {
          question: 'Comment commencer ?',
          answer:
            'Commence par contacter P+ Training ou ton coach. Une fois ton compte créé, tu peux te connecter, consulter ton programme assigné et commencer à enregistrer tes entraînements.',
        },
      ],
    },
    support: {
      pill: 'Support',
      headingPrefix: 'Nous',
      headingAccent: 'joindre',
      form: {
        labels: {
          firstName: 'Prénom *',
          lastName: 'Nom *',
          email: 'Adresse courriel *',
          category: 'Catégorie du problème *',
          description: 'Description du problème *',
        },
        placeholders: {
          firstName: 'Entre ton prénom',
          lastName: 'Entre ton nom',
          email: 'Entre ton adresse courriel',
          category: 'Sélectionne une catégorie',
          description: 'Décris ton problème en détail...',
        },
        categories: [
          { label: 'Problème technique', value: 'technical' },
          { label: 'Question de facturation', value: 'billing' },
          { label: 'Question sur le produit', value: 'product' },
          { label: 'Accès au compte', value: 'account' },
          { label: 'Autre', value: 'other' },
        ],
        submitIdle: 'Envoyer',
        submitSubmitting: 'Envoi...',
        submitError: 'Nous n’avons pas pu envoyer ta demande de support. Réessaie.',
        successTitle: 'Merci',
        successBody: 'Le formulaire a été envoyé. Nous te répondrons bientôt.',
      },
      reply: {
        label: 'Continuer ta conversation avec le support',
        placeholder: 'Écris ta réponse...',
        submitIdle: 'Envoyer la réponse',
        submitSubmitting: 'Envoi...',
        submitError: 'Nous n’avons pas pu envoyer ta réponse. Réessaie.',
        successTitle: 'Ta réponse a été envoyée',
        successBody: 'Le support PPLUS a été avisé et fera un suivi bientôt.',
      },
    },
    login: {
      badge: 'La meilleure app d’entraînement de hockey',
      kicker: 'ENTRAÎNEMENT DE HOCKEY ÉLITE',
      headline: {
        lineOne: 'Travail hors glace',
        lineTwo: 'Résultats sur glace',
      },
      description: 'PPLUS Training aide les athlètes de hockey à rester constants hors glace avec des entraînements guidés, un suivi simple et un plan clair pour le développement à long terme.',
      form: {
        title: 'Bonjour 👋🏻',
        email: 'Courriel',
        password: 'Mot de passe',
        togglePassword: 'Afficher ou masquer le mot de passe',
        submit: 'Connexion',
        forgotPassword: 'Mot de passe oublié',
      },
    },
  },
}

export function getPublicPageCopy(language = DEFAULT_LANGUAGE) {
  return publicPageCopy[normalizePublicLanguage(language)] || publicPageCopy[DEFAULT_LANGUAGE]
}
