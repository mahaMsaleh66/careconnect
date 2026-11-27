export const explorePages = {
  'crisis-severity': {
    badge: 'AI module',
    title: 'AI crisis severity prediction',
    kicker: 'Low · Medium · High',
    summary:
      'When an administrator records a crisis, CareConnect’s machine-learning model reads the type, the number of people affected and the description, then rates urgency so the worst cases are handled first.',
    points: [
      'Uses the trained crisis model in the AI service (type, log of affected people, and text).',
      'Returns Low, Medium or High with a confidence score the admin can accept or override.',
      'Helps the team spend time on floods, medical emergencies and collapsed homes before smaller cases.',
    ],
    who: 'Administrators creating crises; everyone who later sees severity badges on the dashboard.',
    cta: { label: 'Open dashboard', to: '/dashboard/crises' },
  },
  'volunteer-matching': {
    badge: 'AI module',
    title: 'Smart volunteer matching',
    kicker: 'Skills · city · availability',
    summary:
      'Admins do not have to guess who should take a help request. CareConnect ranks volunteers by how well their skills match the need, whether they are in the same city, and whether they are free.',
    points: [
      'Volunteers keep a multi-skill profile (medical, driving, languages and more) and their city.',
      'The matcher combines text similarity, city match and availability into a percentage score.',
      'The admin can still pick another volunteer after seeing the ranking.',
    ],
    who: 'Volunteers who save a profile; administrators who assign tasks.',
    cta: { label: 'Volunteer sign-up', to: '/register' },
  },
  'urdu-assistant': {
    badge: 'AI module',
    title: 'Urdu and Roman Urdu assistant',
    kicker: 'مددگار چیٹ بوٹ',
    summary:
      'People in need can describe a problem in Urdu script, Roman Urdu or English. The assistant detects the type of need and how urgent it is, then helps them submit a request to the relief team.',
    points: [
      'Multi-turn chat with saved history, not just a one-click “analyze” button.',
      'Detects Food, Medical, Shelter, Education or Other, and Low / Medium / High urgency.',
      'Asks for the city if it is missing, then pre-fills the help-request form.',
    ],
    who: 'People in need on the Help Requests page; admins who review those requests.',
    cta: { label: 'Ask for help', to: '/register' },
  },
  donations: {
    badge: 'Platform',
    title: 'Donations and digital receipts',
    kicker: 'Record · receipt · verification',
    summary:
      'Donors record a contribution toward a general relief fund or a specific crisis and receive a printable CareConnect receipt with a unique number (CC-…).',
    points: [
      'Optional note or transfer reference for in-kind gifts or mobile-wallet IDs.',
      'Any past donation can be opened and printed again from donation history.',
      'Live JazzCash, Easypaisa and bank account numbers will appear here once the administrator publishes them.',
    ],
    who: 'Donors who give; administrators who review all contributions.',
    cta: { label: 'Donate', to: '/register' },
  },
  'welfare-news': {
    badge: 'AI module',
    title: 'Welfare and crisis news',
    kicker: 'Live headlines · AI filter',
    summary:
      'Administrators can fetch recent Pakistan crisis headlines and let the AI mark which ones are relevant (flood, earthquake, hunger, medical, fire) versus unrelated news.',
    points: [
      'Live list comes from the GDELT project, then each headline is classified.',
      'Saved relevant items appear in the news feed for every logged-in role.',
      'Flood-related headlines sit alongside the dedicated Flood Sindh page.',
    ],
    who: 'Administrators who curate the feed; all users who read it.',
    cta: { label: 'Open dashboard', to: '/dashboard/news' },
  },
  reports: {
    badge: 'Platform',
    title: 'Reports and analytics',
    kicker: 'Charts · print · overview',
    summary:
      'Administrators see a live picture of the platform: users by role, crises by severity, donations by category and help requests by status, with a print-friendly report.',
    points: [
      'Built from the same MySQL data used across the app — not a separate spreadsheet.',
      'Helps supervisors and examiners see that the four roles and AI modules are actually in use.',
      'Print uses the same CareConnect layout as donation receipts.',
    ],
    who: 'Administrators only.',
    cta: { label: 'Admin sign-in', to: '/login' },
  },
  donors: {
    badge: 'Role',
    title: 'For donors',
    kicker: 'Give with a record',
    summary:
      'Donors support a general fund or a named crisis, add an optional reference, and keep every receipt. The dashboard shows how much they have given.',
    points: [
      'Register with the Donor role — it takes less than a minute.',
      'Choose a category such as Food, Medical, Education or Shelter.',
      'Print the official CareConnect receipt whenever you need it.',
    ],
    who: 'Anyone who wants to contribute money or record an in-kind gift.',
    cta: { label: 'Register as a donor', to: '/register' },
  },
  volunteers: {
    badge: 'Role',
    title: 'For volunteers',
    kicker: 'Skills that reach the right request',
    summary:
      'Volunteers tell CareConnect what they can do and where they are. When a help request comes in, the admin can match them and they update the task until it is done.',
    points: [
      'Save several skills (medical, driving, languages and more), city and availability on the Skills Profile page.',
      'See assigned tasks, the needy person’s contact, and mark work In Progress or Done.',
      'City match is part of the ranking, so local volunteers are preferred.',
    ],
    who: 'Students, health workers, drivers and anyone who can help on the ground.',
    cta: { label: 'Register as a volunteer', to: '/register' },
  },
  needy: {
    badge: 'Role',
    title: 'For people in need',
    kicker: 'Ask in your own language',
    summary:
      'If you need food, medicine, shelter or another kind of help, describe it in Urdu, Roman Urdu or English. CareConnect turns that into a tracked request.',
    points: [
      'Use the Urdu assistant or fill the form yourself.',
      'Follow status from Pending to Assigned to Completed.',
      'A volunteer may contact you once an administrator assigns the task.',
    ],
    who: 'Households and individuals affected by a crisis or hardship.',
    cta: { label: 'Request help', to: '/register' },
  },
  'earthquake-response': {
    badge: 'Crisis type',
    title: 'Earthquake response',
    kicker: 'Balochistan · KP · nationwide',
    summary:
      'CareConnect is not a flood-only desk. Administrators can log an earthquake anywhere in Pakistan, AI rates severity from people affected and the description, and volunteers with medical, first aid or logistics skills are ranked for nearby requests.',
    points: [
      'Record type Earthquake with location pins from Karachi to Gilgit.',
      'Help requests for collapsed homes, medical aid and shelter use the same Urdu assistant.',
      'Donors can attach gifts to that crisis and print a receipt.',
    ],
    who: 'Administrators, medical volunteers and households in affected districts.',
    cta: { label: 'Open crises desk', to: '/dashboard/crises' },
  },
  'pandemic-health': {
    badge: 'Crisis type',
    title: 'Pandemic and health outbreaks',
    kicker: 'Dengue · COVID-type response · clinics',
    summary:
      'Disease outbreaks need the same coordination as a flood: urgent medical requests, volunteers with nursing or first-aid skills, and donations for medicine. CareConnect stores these as Medical or Pandemic crises across all provinces.',
    points: [
      'Filter the crises map to Pandemic / Medical to see health emergencies only.',
      'The assistant detects Medical need and High urgency from Urdu or English messages.',
      'Volunteer profiles can list Nurse, Doctor / Paramedic and First Aid & CPR together.',
    ],
    who: 'Health volunteers, people seeking medical help, administrators.',
    cta: { label: 'Open crises desk', to: '/dashboard/crises' },
  },
  'nationwide-relief': {
    badge: 'All Pakistan',
    title: 'Nationwide multi-crisis relief',
    kicker: 'Every province · every crisis type',
    summary:
      'CareConnect is an all-Pakistan platform: floods in Sindh, earthquakes in Balochistan or KP, fires in cities, hunger in rural belts, and health outbreaks anywhere. One login covers donors, volunteers, people in need and administrators.',
    points: [
      'Crisis types include Flood, Earthquake, Pandemic, Fire, Hunger and Other.',
      'Maps and city matching cover major districts in every province.',
      'Flood Sindh remains a detailed case study because of recent major floods — not the only mission.',
    ],
    who: 'Anyone in Pakistan who needs to give, volunteer or ask for help.',
    cta: { label: 'Create an account', to: '/register' },
  },
  administrators: {
    badge: 'Role',
    title: 'For administrators',
    kicker: 'One desk for the whole operation',
    summary:
      'Administrators run CareConnect nationwide: earthquakes, outbreaks, floods, fires, hunger, requests, volunteer assignment, users, news, reports and receiving accounts.',
    points: [
      'Predict crisis severity, match volunteers by multiple skills and city, and curate welfare news.',
      'Activate, deactivate or change a user’s role without deleting their history.',
      'The first admin is seeded for the FYP demo; others are promoted from the Users page.',
    ],
    who: 'The welfare team / FYP operators.',
    cta: { label: 'Admin login', to: '/login' },
  },
};

export const crisisThemes = [
  {
    slug: 'flood-sindh',
    to: '/flood-sindh',
    badge: 'Case study',
    title: 'Flood Sindh',
  },
  {
    slug: 'earthquake-response',
    to: '/explore/earthquake-response',
    badge: 'Crisis type',
    title: 'Earthquake response',
  },
  {
    slug: 'pandemic-health',
    to: '/explore/pandemic-health',
    badge: 'Crisis type',
    title: 'Pandemic & health',
  },
  {
    slug: 'nationwide-relief',
    to: '/explore/nationwide-relief',
    badge: 'All Pakistan',
    title: 'Nationwide relief',
  },
];

export const highlightCards = [
  {
    slug: 'flood-sindh',
    to: '/flood-sindh',
    title: 'Flood Sindh',
    text: 'A case study of CareConnect after Sindh’s recent major floods — one crisis type among several nationwide.',
    badge: 'Case study',
  },
  {
    slug: 'crisis-severity',
    to: '/explore/crisis-severity',
    title: 'Crisis severity AI',
    text: 'Rate a flood, fire or medical emergency as Low, Medium or High.',
  },
  {
    slug: 'volunteer-matching',
    to: '/explore/volunteer-matching',
    title: 'Volunteer matching',
    text: 'Send the right person, in the right city, to each request.',
  },
  {
    slug: 'urdu-assistant',
    to: '/explore/urdu-assistant',
    title: 'Urdu help assistant',
    text: 'Chat in Urdu or Roman Urdu. We detect the need and urgency.',
  },
  {
    slug: 'donations',
    to: '/explore/donations',
    title: 'Donations & receipts',
    text: 'Record a gift and print an official CareConnect receipt.',
  },
  {
    slug: 'welfare-news',
    to: '/explore/welfare-news',
    title: 'Welfare news',
    text: 'AI filters crisis headlines from cricket and celebrity news.',
  },
  {
    slug: 'reports',
    to: '/explore/reports',
    title: 'Reports',
    text: 'Charts of users, donations, crises and requests for admins.',
  },
];

export const floodAreas = [
  { name: 'Dadu', note: 'Riverine flooding and displaced families' },
  { name: 'Larkana', note: 'Standing water and damaged homes' },
  { name: 'Qambar Shahdadkot', note: 'Repeated monsoon inundation' },
  { name: 'Jacobabad', note: 'Heat plus flood damage to livelihoods' },
  { name: 'Shikarpur', note: 'Rural settlements cut off by water' },
  { name: 'Khairpur', note: 'Crop loss and food shortage' },
  { name: 'Thatta', note: 'Delta flooding and shelter need' },
  { name: 'Badin', note: 'Coastal and drainage overflow' },
  { name: 'Mirpurkhas', note: 'Relief camps and ration needs' },
  { name: 'Umerkot', note: 'Displaced households, medical camps' },
];
