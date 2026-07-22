import type { ReactElement } from 'react';
import type { BizType } from '../types';

export const BizIcon: Record<BizType, (color: string) => ReactElement> = {
  restaurant: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <path
        d='M9 4v10a3 3 0 0 0 3 3v11a1 1 0 0 0 2 0V17a3 3 0 0 0 3-3V4'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M13 4v7M22 4c-2 1-3 4-3 7s1 4 3 4v13a1 1 0 0 0 2 0V4'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  ),
  ecommerce: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <path
        d='M5 7h3l2.5 14a2 2 0 0 0 2 1.6h9a2 2 0 0 0 2-1.6L26 11H10'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <circle cx='13' cy='27' r='1.6' fill={color} />
      <circle cx='23' cy='27' r='1.6' fill={color} />
    </svg>
  ),
  salon: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <circle cx='9' cy='9' r='4' stroke={color} strokeWidth='1.8' />
      <circle cx='9' cy='23' r='4' stroke={color} strokeWidth='1.8' />
      <path
        d='M12 12l16 12M12 20l16-12'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
      />
    </svg>
  ),
  realestate: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <path
        d='M4 14L16 4l12 10v13a1 1 0 0 1-1 1h-7v-9h-8v9H5a1 1 0 0 1-1-1V14z'
        stroke={color}
        strokeWidth='1.8'
        strokeLinejoin='round'
      />
    </svg>
  ),
  clinic: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <rect
        x='5'
        y='6'
        width='22'
        height='22'
        rx='2'
        stroke={color}
        strokeWidth='1.8'
      />
      <path
        d='M16 12v10M11 17h10'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
      />
      <path
        d='M11 6V4M21 6V4'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
      />
    </svg>
  ),
  influencer: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <path
        d='M16 4l3 7 7.5.7-5.7 5 1.7 7.3L16 20.3l-6.5 3.7 1.7-7.3-5.7-5L13 11l3-7z'
        stroke={color}
        strokeWidth='1.8'
        strokeLinejoin='round'
        fill={`${color}20`}
      />
    </svg>
  ),
  education: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <path
        d='M4 10l12-5 12 5-12 5-12-5z'
        stroke={color}
        strokeWidth='1.8'
        strokeLinejoin='round'
      />
      <path
        d='M9 14v6c2 3 12 3 14 0v-6'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
      />
    </svg>
  ),
  fitness: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <path
        d='M5 16h22M8 12v8M24 12v8M12 10v12M20 10v12'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
      />
    </svg>
  ),
  automobile: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <path
        d='M7 18l2-6h14l2 6v6H7v-6z'
        stroke={color}
        strokeWidth='1.8'
        strokeLinejoin='round'
      />
      <circle cx='11' cy='24' r='2' stroke={color} strokeWidth='1.8' />
      <circle cx='21' cy='24' r='2' stroke={color} strokeWidth='1.8' />
    </svg>
  ),
  travel: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <path
        d='M16 4l10 24-10-5-10 5L16 4z'
        stroke={color}
        strokeWidth='1.8'
        strokeLinejoin='round'
      />
    </svg>
  ),
  legal: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <path
        d='M16 5v22M8 9h16M10 9l-4 8h8l-4-8zM22 9l-4 8h8l-4-8z'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  ),
  finance: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <path
        d='M6 24h20M9 24V13M16 24V8M23 24V16'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
      />
    </svg>
  ),
  other: (color: string) => (
    <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
      <circle cx='16' cy='16' r='11' stroke={color} strokeWidth='1.8' />
      <path
        d='M12 14a4 4 0 1 1 6 3.5c-1.2.7-2 1.3-2 2.5M16 25h.01'
        stroke={color}
        strokeWidth='1.8'
        strokeLinecap='round'
      />
    </svg>
  ),
};

/* ─────────────────────── biz onboarding data ─────────────────────── */
export const BIZ_OPTIONS: { id: BizType; label: string; desc: string }[] = [
  { id: 'restaurant', label: 'Restaurant', desc: 'Food, dining, cafes' },
  { id: 'ecommerce', label: 'E-commerce', desc: 'Online store, D2C' },
  { id: 'salon', label: 'Salon / Spa', desc: 'Beauty & wellness' },
  { id: 'realestate', label: 'Real Estate', desc: 'Buy, sell, rent' },
  { id: 'clinic', label: 'Clinic', desc: 'Medical & dental' },
  { id: 'influencer', label: 'Influencer', desc: 'Creator & personal brand' },
  { id: 'education', label: 'Education', desc: 'Schools, courses, coaching' },
  { id: 'fitness', label: 'Fitness', desc: 'Gym, yoga, training' },
  { id: 'automobile', label: 'Automobile', desc: 'Cars, bikes, service' },
  { id: 'travel', label: 'Travel', desc: 'Trips, hotels, packages' },
  { id: 'legal', label: 'Legal', desc: 'Law firms, consultants' },
  { id: 'finance', label: 'Finance', desc: 'CA, loans, insurance' },
  { id: 'other', label: 'Other', desc: 'Custom business type' },
];

export const BIZ_QUESTIONS: Record<
  BizType,
  { q: string; placeholder: string; faqQ: string }[]
> = {
  restaurant: [
    {
      q: 'What are your opening hours and days?',
      placeholder: 'e.g. Mon–Sat 11am–11pm, Sunday closed',
      faqQ: 'What are your opening hours?',
    },
    {
      q: 'Where are you located? Multiple branches?',
      placeholder: 'e.g. 42 MG Road, Bengaluru.',
      faqQ: 'Where are you located?',
    },
    {
      q: 'Do you take reservations? How to book?',
      placeholder: 'e.g. Yes, call or DM on Instagram.',
      faqQ: 'How can I book a table?',
    },
    {
      q: 'What type of cuisine do you serve?',
      placeholder: 'e.g. North Indian, Chinese, continental.',
      faqQ: 'What cuisine do you serve?',
    },
    {
      q: 'Home delivery or takeaway? Which platforms?',
      placeholder: 'e.g. Swiggy & Zomato or Uber Eats. Takeaway available.',
      faqQ: 'Do you offer home delivery or takeaway?',
    },
    {
      q: 'Average meal cost for two people?',
      placeholder: 'e.g. ₹600–₹900, $25–$35, etc. for two with drinks.',
      faqQ: 'What is the average cost for two?',
    },
    {
      q: 'Special menu — kids, vegan, dietary options?',
      placeholder: 'e.g. Full vegan menu and kids section.',
      faqQ: 'Do you have vegan or special diet options?',
    },
    {
      q: 'Do you cater for events or bulk orders?',
      placeholder: 'e.g. Yes, up to 200 people.',
      faqQ: 'Do you do catering or event orders?',
    },
    {
      q: 'Loyalty programmes or happy hour offers?',
      placeholder: 'e.g. Happy hours 3–6pm. 20% off weekdays.',
      faqQ: 'Do you have any offers?',
    },
    {
      q: 'What makes dining with you special?',
      placeholder: 'e.g. Live music weekends, rooftop seating.',
      faqQ: 'What makes your restaurant special?',
    },
  ],
  ecommerce: [
    {
      q: 'What products do you sell?',
      placeholder: 'e.g. Handmade silver jewellery.',
      faqQ: 'What products do you sell?',
    },
    {
      q: 'Price range — minimum and maximum?',
      placeholder: 'e.g. ₹299–₹4,999, $10–$100, etc.',
      faqQ: 'What is your pricing range?',
    },
    {
      q: 'Which cities or countries do you ship to?',
      placeholder: 'e.g. All India. International to UAE.',
      faqQ: 'Where do you ship?',
    },
    {
      q: 'How long does delivery take?',
      placeholder: 'e.g. 3–5 business days within India.',
      faqQ: 'How long does delivery take?',
    },
    {
      q: 'Shipping charges?',
      placeholder: 'e.g. Free above ₹999, $50, etc.; flat fee below.',
      faqQ: 'What are the shipping charges?',
    },
    {
      q: 'Return and refund policy?',
      placeholder: 'e.g. 7-day returns for unused items.',
      faqQ: 'What is your return and refund policy?',
    },
    {
      q: 'Do you offer Cash on Delivery?',
      placeholder: 'e.g. Yes, COD available across India.',
      faqQ: 'Do you offer Cash on Delivery?',
    },
    {
      q: 'How can customers track their order?',
      placeholder: 'e.g. Tracking link via WhatsApp.',
      faqQ: 'How do I track my order?',
    },
    {
      q: 'Discounts for first-time or bulk orders?',
      placeholder: 'e.g. 10% off first order WELCOME10.',
      faqQ: 'Do you have any discounts?',
    },
    {
      q: 'How to contact you for order issues?',
      placeholder: 'e.g. DM Instagram or WhatsApp.',
      faqQ: 'How do I contact you for order issues?',
    },
  ],
  salon: [
    {
      q: 'Services offered — hair, skin, nails, or all?',
      placeholder: 'e.g. Hair colour, cuts, facials, waxing.',
      faqQ: 'What services do you offer?',
    },
    {
      q: 'Working hours and days?',
      placeholder: 'e.g. Tue–Sun 10am–8pm. Closed Mondays.',
      faqQ: 'What are your working hours?',
    },
    {
      q: 'Where is the salon located?',
      placeholder: 'e.g. Linking Road, Bandra, Mumbai.',
      faqQ: 'Where are you located?',
    },
    {
      q: 'How can customers book an appointment?',
      placeholder: 'e.g. Call, DM on Instagram, or walk in.',
      faqQ: 'How do I book an appointment?',
    },
    {
      q: 'Pricing for most popular services?',
      placeholder: 'e.g. Haircut ₹299, $25, etc.; facial ₹599, $60, etc.',
      faqQ: 'What are your prices?',
    },
    {
      q: 'Home visits or at-home services?',
      placeholder: 'e.g. Yes, within 5km. Extra charges.',
      faqQ: 'Do you offer home visit services?',
    },
    {
      q: 'What product brands do you use?',
      placeholder: 'e.g. Wella and OPI.',
      faqQ: 'What products do you use?',
    },
    {
      q: 'Bridal packages or group bookings?',
      placeholder: 'e.g. Bridal packages from ₹8,999, $300, etc.',
      faqQ: 'Do you offer bridal or group packages?',
    },
    {
      q: 'How long does a typical appointment take?',
      placeholder: 'e.g. Haircut 30 min, facial 60 min.',
      faqQ: 'How long will my appointment take?',
    },
    {
      q: 'What makes your salon different?',
      placeholder: 'e.g. Certified stylists, intl. products.',
      faqQ: 'What makes your salon special?',
    },
  ],
  realestate: [
    {
      q: 'Residential, commercial, or both?',
      placeholder: 'e.g. Both — flats, villas, offices.',
      faqQ: 'What types of properties do you handle?',
    },
    {
      q: 'Which cities or areas do you cover?',
      placeholder: 'e.g. Bengaluru — Whitefield, Sarjapur.',
      faqQ: 'Which areas do you cover?',
    },
    {
      q: 'Buying, selling, renting, or all?',
      placeholder: 'e.g. All three.',
      faqQ: 'Do you help with buying, selling, renting?',
    },
    {
      q: 'Starting price range for properties?',
      placeholder: 'e.g. Flats from ₹45L, villas ₹1.2Cr, apartments $300K, etc.',
      faqQ: 'What is the price range of your properties?',
    },
    {
      q: 'Do you assist with home loans or paperwork?',
      placeholder: 'e.g. Yes, empanelled banks & advisors.',
      faqQ: 'Do you help with home loans and paperwork?',
    },
    {
      q: 'How to schedule a property visit?',
      placeholder: 'e.g. DM or call — visits in 24 hours.',
      faqQ: 'How do I schedule a property visit?',
    },
    {
      q: 'Do you charge a brokerage fee?',
      placeholder: 'e.g. 1% of property value for buyers.',
      faqQ: 'What is your brokerage fee?',
    },
    {
      q: 'How many properties are currently listed?',
      placeholder: 'e.g. 120+ active listings.',
      faqQ: 'How many properties do you have?',
    },
    {
      q: 'Virtual tours or video walkthroughs?',
      placeholder: 'e.g. Yes, 3D tours for premium listings.',
      faqQ: 'Do you offer virtual property tours?',
    },
    {
      q: 'Why choose your agency over others?',
      placeholder: 'e.g. 10 years exp, zero hidden charges.',
      faqQ: 'Why should I choose your agency?',
    },
  ],
  clinic: [
    {
      q: 'General, specialist, dental, or other?',
      placeholder: 'e.g. Multi-speciality — general, ortho.',
      faqQ: 'What type of clinic are you?',
    },
    {
      q: 'Consultation hours and days?',
      placeholder: 'e.g. Mon–Sat 9am–7pm. Emergency 24/7.',
      faqQ: 'What are your clinic hours?',
    },
    {
      q: 'Where is the clinic located?',
      placeholder: 'e.g. 12 Doctors Lane, Koramangala.',
      faqQ: 'Where is your clinic?',
    },
    {
      q: 'How can patients book an appointment?',
      placeholder: 'e.g. Call, WhatsApp, walk in, website.',
      faqQ: 'How do I book an appointment?',
    },
    {
      q: 'Online or teleconsultation available?',
      placeholder: 'e.g. Yes, video call ₹299, $100, etc.',
      faqQ: 'Do you offer online consultations?',
    },
    {
      q: 'What is the consultation fee?',
      placeholder: 'e.g. General ₹300, $100, etc.; specialist ₹500+, $150+, etc.',
      faqQ: 'What is the consultation fee?',
    },
    {
      q: 'Do you accept insurance or cashless?',
      placeholder: 'e.g. Yes — Star Health, HDFC Ergo.',
      faqQ: 'Do you accept health insurance?',
    },
    {
      q: 'In-house pharmacy or lab?',
      placeholder: 'e.g. In-house pharmacy. Lab 4–6 hrs.',
      faqQ: 'Do you have a pharmacy and lab?',
    },
    {
      q: 'Average waiting time?',
      placeholder: 'e.g. 15–20 min. Less during off-peak.',
      faqQ: 'How long is the wait time?',
    },
    {
      q: 'Emergency or walk-in services?',
      placeholder: 'e.g. Walk-ins welcome. Emergency line.',
      faqQ: 'Do you have emergency or walk-in services?',
    },
  ],
  influencer: [
    {
      q: 'What niche or content category do you create in?',
      placeholder: 'e.g. Fitness, lifestyle, tech reviews, comedy.',
      faqQ: 'What type of content do you create?',
    },
    {
      q: 'Which platforms are you active on?',
      placeholder: 'e.g. Instagram, YouTube, TikTok, Podcast.',
      faqQ: 'Which platforms are you on?',
    },
    {
      q: 'What is your audience size and demographics?',
      placeholder: 'e.g. 250K followers, mostly 18–34, India/UAE.',
      faqQ: 'How big is your audience?',
    },
    {
      q: 'What brand collaboration or sponsorship packages do you offer?',
      placeholder: 'e.g. Reel, story, YouTube integration, UGC.',
      faqQ: 'What collaboration packages do you offer?',
    },
    {
      q: 'What are your rates for a sponsored post or reel?',
      placeholder: 'e.g. ₹15K, $500, etc. per reel; ₹5K, $150, etc. per story.',
      faqQ: 'What are your sponsorship rates?',
    },
    {
      q: 'Do you sell digital products, courses, or merchandise?',
      placeholder: 'e.g. Online course ₹1,999+, $49+, etc.',
      faqQ: 'Do you sell any products or courses?',
    },
    {
      q: 'How can brands or fans reach you for collabs?',
      placeholder: 'e.g. DM on Instagram or email hello@myname.com.',
      faqQ: 'How can I contact you for a collaboration?',
    },
    {
      q: 'Do you offer shoutouts, paid promotions, or affiliate deals?',
      placeholder: 'e.g. Yes, affiliate with 15% commission.',
      faqQ: 'Do you do shoutouts or affiliate promotions?',
    },
    {
      q: 'What is your content posting frequency?',
      placeholder: 'e.g. 4 reels/week, 1 YouTube video/week.',
      faqQ: 'How often do you post content?',
    },
    {
      q: 'What makes your personal brand unique?',
      placeholder: 'e.g. Raw, unfiltered content. Very high engagement.',
      faqQ: 'What makes your brand stand out?',
    },
  ],
  education: [
    {
      q: 'What type of education service do you offer?',
      placeholder: 'e.g. School, coaching centre, online course, tuition.',
      faqQ: 'What education services do you offer?',
    },
    {
      q: 'Which courses, subjects, or programmes do you provide?',
      placeholder: 'e.g. Maths tuition, IELTS coaching, coding bootcamp.',
      faqQ: 'Which courses or subjects do you offer?',
    },
    {
      q: 'Who is your target student group?',
      placeholder:
        'e.g. School students, college students, working professionals.',
      faqQ: 'Who can join your courses?',
    },
    {
      q: 'What are your fees or pricing plans?',
      placeholder: 'e.g. ₹5,000/month, $299 per course, etc.',
      faqQ: 'What are your course fees?',
    },
    {
      q: 'Do you offer online, offline, or hybrid classes?',
      placeholder: 'e.g. Online live classes and weekend offline batches.',
      faqQ: 'Do you offer online or offline classes?',
    },
    {
      q: 'How can students enrol or book a demo?',
      placeholder: 'e.g. Fill form, WhatsApp us, or book a free demo.',
      faqQ: 'How can I enrol or book a demo class?',
    },
    {
      q: 'Do you provide certificates?',
      placeholder: 'e.g. Yes, certificates after course completion.',
      faqQ: 'Do you provide certificates?',
    },
    {
      q: 'What makes your education service different?',
      placeholder: 'e.g. Small batches, expert mentors, placement support.',
      faqQ: 'What makes your institute different?',
    },
  ],

  fitness: [
    {
      q: 'What fitness services do you offer?',
      placeholder: 'e.g. Gym, personal training, yoga, CrossFit, Zumba.',
      faqQ: 'What fitness services do you offer?',
    },
    {
      q: 'What are your opening hours?',
      placeholder: 'e.g. Mon–Sat 5am–11pm, Sunday 7am–2pm.',
      faqQ: 'What are your gym timings?',
    },
    {
      q: 'Where are you located?',
      placeholder: 'e.g. Indiranagar, Bengaluru near Metro station.',
      faqQ: 'Where is your fitness centre located?',
    },
    {
      q: 'What are your membership plans?',
      placeholder: 'e.g. Monthly ₹2,000, quarterly ₹5,000, annual ₹15,000. Use your currency.',
      faqQ: 'What are your membership plans?',
    },
    {
      q: 'Do you offer personal training?',
      placeholder: 'e.g. Yes, certified trainers available.',
      faqQ: 'Do you offer personal training?',
    },
    {
      q: 'Do you provide diet or nutrition guidance?',
      placeholder: 'e.g. Yes, diet plans included in premium plan.',
      faqQ: 'Do you provide diet guidance?',
    },
    {
      q: 'Can customers book a trial session?',
      placeholder: 'e.g. Yes, first session is free.',
      faqQ: 'Can I book a trial session?',
    },
    {
      q: 'What makes your fitness centre special?',
      placeholder:
        'e.g. Premium equipment, transformation tracking, expert coaches.',
      faqQ: 'What makes your fitness centre different?',
    },
  ],

  automobile: [
    {
      q: 'What automobile services do you provide?',
      placeholder: 'e.g. Car sales, bike service, detailing, repairs.',
      faqQ: 'What automobile services do you provide?',
    },
    {
      q: 'Which vehicle brands or models do you handle?',
      placeholder: 'e.g. Maruti, Hyundai, Honda, Royal Enfield.',
      faqQ: 'Which vehicle brands do you handle?',
    },
    {
      q: 'Where is your showroom or service centre located?',
      placeholder: 'e.g. Whitefield, Bengaluru.',
      faqQ: 'Where are you located?',
    },
    {
      q: 'What are your working hours?',
      placeholder: 'e.g. Mon–Sat 9am–7pm.',
      faqQ: 'What are your working hours?',
    },
    {
      q: 'Do customers need an appointment?',
      placeholder: 'e.g. Walk-ins accepted, appointments preferred.',
      faqQ: 'Do I need an appointment?',
    },
    {
      q: 'What is your pricing or service charge range?',
      placeholder: 'e.g. General service starts from ₹1,999, $50, etc.',
      faqQ: 'What are your service charges?',
    },
    {
      q: 'Do you offer pickup and drop service?',
      placeholder: 'e.g. Yes, within 10km.',
      faqQ: 'Do you offer pickup and drop?',
    },
    {
      q: 'What makes your automobile service different?',
      placeholder:
        'e.g. Genuine parts, transparent pricing, trained technicians.',
      faqQ: 'Why should I choose your automobile service?',
    },
  ],

  travel: [
    {
      q: 'What travel services do you offer?',
      placeholder: 'e.g. Holiday packages, hotel booking, visa assistance.',
      faqQ: 'What travel services do you offer?',
    },
    {
      q: 'Which destinations do you cover?',
      placeholder: 'e.g. Dubai, Bali, Europe, USA, Kashmir, Maldives.',
      faqQ: 'Which destinations do you cover?',
    },
    {
      q: 'Do you offer domestic, international, or both?',
      placeholder: 'e.g. Both domestic and international packages.',
      faqQ: 'Do you offer domestic and international travel?',
    },
    {
      q: 'What is your package price range?',
      placeholder: 'e.g. Packages start from ₹25,000, $300, etc. per person.',
      faqQ: 'What is your package price range?',
    },
    {
      q: 'Do you customise travel packages?',
      placeholder: 'e.g. Yes, based on budget, dates and group size.',
      faqQ: 'Do you customise travel packages?',
    },
    {
      q: 'Do you help with visa and insurance?',
      placeholder: 'e.g. Yes, visa, insurance and forex support available.',
      faqQ: 'Do you help with visa and travel insurance?',
    },
    {
      q: 'How can customers book a package?',
      placeholder: 'e.g. WhatsApp us with destination and dates.',
      faqQ: 'How can I book a travel package?',
    },
    {
      q: 'What makes your travel service reliable?',
      placeholder: 'e.g. 24/7 support, verified hotels, local guides.',
      faqQ: 'Why should I book with you?',
    },
  ],

  legal: [
    {
      q: 'What legal services do you provide?',
      placeholder:
        'e.g. Property law, contracts, family law, company registration.',
      faqQ: 'What legal services do you provide?',
    },
    {
      q: 'Which locations or jurisdictions do you cover?',
      placeholder: 'e.g. Karnataka, Delhi, UK immigration, Indian courts.',
      faqQ: 'Which locations do you cover?',
    },
    {
      q: 'How can clients book a consultation?',
      placeholder: 'e.g. Call, WhatsApp, or book through website.',
      faqQ: 'How can I book a legal consultation?',
    },
    {
      q: 'What are your consultation fees?',
      placeholder: 'e.g. First consultation ₹1,000, $100, etc. for 30 minutes.',
      faqQ: 'What are your consultation fees?',
    },
    {
      q: 'Do you offer online consultations?',
      placeholder: 'e.g. Yes, video consultations available.',
      faqQ: 'Do you offer online legal consultations?',
    },
    {
      q: 'What documents should clients bring?',
      placeholder: 'e.g. ID proof, agreement copy, notices, case papers.',
      faqQ: 'What documents do I need?',
    },
    {
      q: 'Do you handle urgent matters?',
      placeholder: 'e.g. Yes, urgent notices and filings are supported.',
      faqQ: 'Do you handle urgent legal matters?',
    },
    {
      q: 'What makes your legal service trustworthy?',
      placeholder:
        'e.g. Experienced lawyers, clear pricing, confidential support.',
      faqQ: 'Why should I choose your legal service?',
    },
  ],

  finance: [
    {
      q: 'What finance services do you offer?',
      placeholder:
        'e.g. Accounting, tax filing, loans, insurance, investments.',
      faqQ: 'What finance services do you offer?',
    },
    {
      q: 'Who do you serve?',
      placeholder: 'e.g. Individuals, small businesses, startups, NRIs.',
      faqQ: 'Who can use your finance services?',
    },
    {
      q: 'What are your fees or service charges?',
      placeholder: 'e.g. ITR filing from ₹999, tax filing from $99, etc.',
      faqQ: 'What are your service charges?',
    },
    {
      q: 'Do you offer online consultations?',
      placeholder: 'e.g. Yes, Zoom and WhatsApp consultations available.',
      faqQ: 'Do you offer online finance consultations?',
    },
    {
      q: 'What documents are required?',
      placeholder: 'e.g. PAN, Aadhaar, bank statements, salary slips.',
      faqQ: 'What documents are required?',
    },
    {
      q: 'Do you help businesses with GST or accounting?',
      placeholder: 'e.g. Yes, monthly GST and bookkeeping packages.',
      faqQ: 'Do you help with GST and accounting?',
    },
    {
      q: 'How long does the process usually take?',
      placeholder: 'e.g. Tax filing within 24–48 hours after documents.',
      faqQ: 'How long does the process take?',
    },
    {
      q: 'What makes your finance service different?',
      placeholder: 'e.g. Transparent pricing, reminders, dedicated advisor.',
      faqQ: 'Why should I choose your finance service?',
    },
  ],

  other: [
    {
      q: 'What does your business do?',
      placeholder:
        'e.g. We provide event management services for weddings and corporate events.',
      faqQ: 'What does your business do?',
    },
    {
      q: 'Who are your main customers?',
      placeholder: 'e.g. Families, startups, local businesses, students.',
      faqQ: 'Who are your services for?',
    },
    {
      q: 'What products or services do you offer?',
      placeholder:
        'e.g. Consultation, packages, custom services, subscriptions.',
      faqQ: 'What products or services do you offer?',
    },
    {
      q: 'Where are you located or which areas do you serve?',
      placeholder: 'e.g. Bengaluru, London, online worldwide.',
      faqQ: 'Which areas do you serve?',
    },
    {
      q: 'What are your working hours?',
      placeholder: 'e.g. Mon–Sat 10am–7pm.',
      faqQ: 'What are your working hours?',
    },
    {
      q: 'What is your pricing range?',
      placeholder: 'e.g. Starts from ₹999, $99, etc., depending on requirement.',
      faqQ: 'What is your pricing range?',
    },
    {
      q: 'How can customers contact or book your service?',
      placeholder: 'e.g. WhatsApp, Instagram DM, website form.',
      faqQ: 'How can I contact or book your service?',
    },
    {
      q: 'What makes your business different?',
      placeholder: 'e.g. Fast response, custom service, premium quality.',
      faqQ: 'What makes your business different?',
    },
  ],
};

