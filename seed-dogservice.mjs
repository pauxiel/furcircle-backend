import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { config } from 'dotenv'

config()

const dynamodbClient = new DynamoDB({ region: 'us-east-1' })
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient)
const now = new Date().toISOString()

// ── Service Categories (matching Figma prototype) ──────────────────────────
const categories = [
  { slug: 'essential-care',              name: 'Essential Care',              description: 'Daily wellness for your dog',                   icon: 'essential-care',              sortOrder: 1 },
  { slug: 'daycare',                     name: 'Daycare',                     description: 'Full & supervised play',                        icon: 'daycare',                     sortOrder: 2 },
  { slug: 'training-behaviour',          name: 'Training & Behaviour',        description: 'Obedience, skills & behavior shaping',          icon: 'training-behaviour',          sortOrder: 3 },
  { slug: 'behavioural-consultations',   name: 'Behavioural Consultations',   description: 'Anxiety, aggression & complex behaviour cases', icon: 'behavioural-consultations',   sortOrder: 4 },
  { slug: 'dog-walking',                 name: 'Dog Walking',                 description: 'Exercise & outdoor adventures',                 icon: 'dog-walking',                 sortOrder: 5 },
  { slug: 'wellness-health',             name: 'Wellness and Health',         description: 'Check-ups & preventative care',                 icon: 'wellness-health',             sortOrder: 6 },
  { slug: 'nutritional-consultation',    name: 'Nutritional Consultation',    description: 'Science-based diet & meal plans',               icon: 'nutritional-consultation',    sortOrder: 7 },
  { slug: 'grooming',                    name: 'Grooming',                    description: 'Baths, nails & haircuts',                       icon: 'grooming',                    sortOrder: 8 },
  { slug: 'extended-care',              name: 'Extended Care',               description: 'When you\'re away or need extra help',          icon: 'extended-care',               sortOrder: 9 }
].map(c => ({ ...c, createdAt: now, updatedAt: now }))

// ── Businesses ─────────────────────────────────────────────────────────────
// ownerId is a placeholder — update with real Cognito sub when each
// provider is onboarded via the admin flow.

const businessIdBrittany    = randomUUID()
const businessIdLisa        = randomUUID()
const businessIdNikki       = randomUUID()
const businessIdValerie     = randomUUID()
const businessIdAndrea      = randomUUID()
const businessIdMrDogClub   = randomUUID()
const businessIdDogDays     = randomUUID()
const businessIdBowWow      = randomUUID()
const businessIdK9to5       = randomUUID()

const businesses = [
  {
    businessId: businessIdBrittany,
    ownerId: 'placeholder-brittany-aym',
    name: 'Brittany',
    businessName: 'AYM Dog Training',
    email: '',
    phone: '',
    location: '',
    serviceArea: '',
    format: ['virtual'],
    bookingRequirement: 'requires-intro-call',
    certifications: ['RVT', 'Fear Free Professional', 'Karen Pryor Academy Puppy Start Right', 'Karen Pryor Academy Click to Calm'],
    description: 'Brittany is the owner and lead trainer at AYM Dog Training and a Registered Veterinary Technician with a Fear Free Professional certification. Her background in veterinary medicine gives her a deep understanding of canine behaviour, health, and wellbeing. She uses science-based positive reinforcement methods to help dogs of all ages and temperaments learn in a kind, clear, and effective way with a particular focus on anxiety, fear, and stress related behaviours.',
    verified: true,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    businessId: businessIdLisa,
    ownerId: 'placeholder-lisa-thrive',
    name: 'Lisa Large',
    businessName: 'Thrive Canine Services',
    email: '',
    phone: '',
    location: '',
    serviceArea: 'York Region',
    format: ['virtual', 'in-person'],
    bookingRequirement: 'requires-acceptance',
    certifications: ['CDBC', 'CPDT-KA', 'SDC', 'Certified Canine Behaviour Consultant (IAABC)', 'Certified Professional Dog Trainer (CCPDT)', 'Certified Service Dog Coach (Cooperative Paws)'],
    description: 'Lisa Large is a certified canine behaviour consultant and co-founder of Thrive Canine Services bringing over 25 years of combined experience alongside her partner Nikki Dow. She specialises in ethical, evidence-based, and compassionate approaches supporting families, service dog teams, and pet professionals through even the most complex behaviour cases. Her philosophy is rooted in empowering dogs and their people through a trauma-informed, whole-dog approach.',
    verified: true,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    businessId: businessIdNikki,
    ownerId: 'placeholder-nikki-thrive',
    name: 'Nikki Dow',
    businessName: 'Thrive Canine Services',
    email: '',
    phone: '',
    location: '',
    serviceArea: 'York Region',
    format: ['virtual', 'in-person'],
    bookingRequirement: 'requires-acceptance',
    certifications: ['BA', 'CPDT-KA', 'SDC', 'Certified Professional Dog Trainer (CCPDT)', 'Certified Service Dog Coach (Cooperative Paws)'],
    description: 'Nikki Dow is a certified professional dog trainer and co-founder of Thrive Canine Services bringing over 25 years of combined experience alongside her partner Lisa Large. She specialises in ethical, evidence-based, and compassionate approaches supporting families, service dog teams, and pet professionals through even the most complex behaviour cases. Her philosophy is rooted in empowering dogs and their people through a trauma-informed, whole-dog approach.',
    verified: true,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    businessId: businessIdValerie,
    ownerId: 'placeholder-valerie-ssh',
    name: 'Valerie',
    businessName: 'SSH Canine Academy',
    email: '',
    phone: '',
    location: '',
    serviceArea: 'York Region',
    format: ['virtual', 'in-person'],
    bookingRequirement: 'requires-acceptance',
    certifications: [],
    description: 'Valerie is the founder of SSH Canine Academy with experience working with dogs since 2018. Her goal is to educate pet parents about the different training options available and empower dog owners to train their dogs to their full potential. She believes not one size fits all and personalises every approach to the individual dog and owner.',
    verified: true,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    businessId: businessIdAndrea,
    ownerId: 'placeholder-andrea-ageiger',
    name: 'Andrea Geiger',
    businessName: 'AGeiger Companion Animal Nutrition',
    email: '',
    phone: '',
    location: '',
    serviceArea: '',
    format: ['virtual'],
    bookingRequirement: 'requires-acceptance',
    certifications: ['Certified Companion Animal Nutritionist', 'Master of Science in Veterinary Toxicology and Nutrition'],
    description: 'Andrea Geiger is a certified companion animal nutritionist with a master\'s degree in Veterinary Toxicology and Nutrition and over five years of experience in product development and consulting. She specialises in creating science-based nutrition plans and formulating recipes that prioritise pet health ensuring optimal nutrition for dogs tailored to their individual needs.',
    verified: true,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    businessId: businessIdMrDogClub,
    ownerId: 'placeholder-mrdogclub',
    name: 'Mr Dog Club',
    businessName: 'Mr Dog Club',
    email: '',
    phone: '(437) 777-2729',
    location: '12273 Yonge St, Richmond Hill, ON L4E 3M7',
    serviceArea: 'Richmond Hill',
    format: ['in-person'],
    bookingRequirement: 'requires-evaluation',
    certifications: [],
    description: 'Mr Dog Club is a doggy daycare and grooming facility located in Richmond Hill providing a safe, supervised, and enriching environment where dogs can play, socialise, and relax. They use positive reinforcement techniques and a calm, gentle approach with all dogs, allowing extra time for nervous or anxious dogs. All dogs must meet health and vaccination requirements before attending.',
    verified: true,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    businessId: businessIdDogDays,
    ownerId: 'placeholder-dogdays',
    name: 'Dog Days Daycare',
    businessName: 'Dog Days Daycare',
    email: '',
    phone: '',
    location: '',
    serviceArea: 'Vaughan',
    format: ['in-person'],
    bookingRequirement: 'requires-evaluation',
    certifications: [],
    description: 'Dog Days Daycare is a doggy daycare facility in Vaughan carefully designed by experienced dog lovers with safety and happiness as the top priority. They feature a spacious play area for larger dogs, a separate cozy area for smaller dogs, and a large outdoor space where dogs can run, play, and socialise throughout the day.',
    verified: false,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    businessId: businessIdBowWow,
    ownerId: 'placeholder-bowwow',
    name: 'Bow Wow Country Club',
    businessName: 'Bow Wow Country Club',
    email: '',
    phone: '',
    location: '16200 ON-27, Schomberg, ON',
    serviceArea: 'York Region — Aurora, Newmarket, Richmond Hill, Vaughan, King City',
    format: ['in-person'],
    bookingRequirement: 'requires-evaluation',
    certifications: [],
    description: 'Bow Wow Country Club is a unique country resort for dogs situated on 46 acres in Schomberg, Ontario. They offer two five acre fully fenced outdoor parks with a spring fed pond, spacious indoor daycare facilities, and comfortable overnight accommodations. Every dog is managed according to their individual character and temperament.',
    verified: true,
    status: 'active',
    createdAt: now,
    updatedAt: now
  },
  {
    businessId: businessIdK9to5,
    ownerId: 'placeholder-k9to5',
    name: 'K9 to 5 Doggie Daycare',
    businessName: 'K9 to 5 Doggie Daycare',
    email: '',
    phone: '905-868-9100',
    location: '38 Parkside Dr, Newmarket, ON',
    serviceArea: 'Newmarket, York Region',
    format: ['in-person'],
    bookingRequirement: 'requires-evaluation',
    certifications: [],
    description: 'K9 to 5 Doggie Daycare has been providing a safe, clean, stimulating, and fun loving environment for dogs since 2003. They are open 24 hours a day 365 days a year including all holidays and are always cage free even overnight. Dogs are supervised around the clock by staff not webcams.',
    verified: true,
    status: 'active',
    createdAt: now,
    updatedAt: now
  }
].map(b => ({ ...b, createdAt: now, updatedAt: now }))

// ── Dog Services ───────────────────────────────────────────────────────────
const dogServices = [
  // Behavioural Consultations — Brittany (AYM Dog Training)
  { id: randomUUID(), businessId: businessIdBrittany, name: 'Behavioural Consultation 30min — Brittany (AYM Dog Training)', category: 'behavioural-consultations', duration: 30, format: 'virtual', price: '$45', credits: 90,  rating: 0, reviewCount: 0, location: 'Virtual' },
  { id: randomUUID(), businessId: businessIdBrittany, name: 'Behavioural Consultation 60min — Brittany (AYM Dog Training)', category: 'behavioural-consultations', duration: 60, format: 'virtual', price: '$90', credits: 180, rating: 0, reviewCount: 0, location: 'Virtual' },

  // Behavioural Consultations — Lisa Large (Thrive Canine Services)
  { id: randomUUID(), businessId: businessIdLisa, name: 'Behavioural Consultation 30min — Lisa Large (Thrive Canine)', category: 'behavioural-consultations', duration: 30, format: 'virtual-and-in-person', price: '$75', credits: 150, rating: 0, reviewCount: 0, location: 'York Region' },
  { id: randomUUID(), businessId: businessIdLisa, name: 'Behavioural Consultation 60min — Lisa Large (Thrive Canine)', category: 'behavioural-consultations', duration: 60, format: 'virtual-and-in-person', price: '$150', credits: 300, rating: 0, reviewCount: 0, location: 'York Region' },

  // Behavioural Consultations — Nikki Dow (Thrive Canine Services)
  { id: randomUUID(), businessId: businessIdNikki, name: 'Behavioural Consultation 30min — Nikki Dow (Thrive Canine)', category: 'behavioural-consultations', duration: 30, format: 'virtual-and-in-person', price: '$75', credits: 150, rating: 0, reviewCount: 0, location: 'York Region' },
  { id: randomUUID(), businessId: businessIdNikki, name: 'Behavioural Consultation 60min — Nikki Dow (Thrive Canine)', category: 'behavioural-consultations', duration: 60, format: 'virtual-and-in-person', price: '$150', credits: 300, rating: 0, reviewCount: 0, location: 'York Region' },

  // Behavioural Consultations — Valerie (SSH Canine Academy)
  { id: randomUUID(), businessId: businessIdValerie, name: 'Behavioural Consultation 30min — Valerie (SSH Canine Academy)', category: 'behavioural-consultations', duration: 30, format: 'virtual-and-in-person', price: '$75', credits: 150, rating: 0, reviewCount: 0, location: 'York Region' },
  { id: randomUUID(), businessId: businessIdValerie, name: 'Behavioural Consultation 60min — Valerie (SSH Canine Academy)', category: 'behavioural-consultations', duration: 60, format: 'virtual-and-in-person', price: '$150', credits: 300, rating: 0, reviewCount: 0, location: 'York Region' },

  // Nutritional Consultations — Andrea Geiger
  { id: randomUUID(), businessId: businessIdAndrea, name: 'Nutritional Consultation 30min — Andrea Geiger', category: 'nutritional-consultation', duration: 30, format: 'virtual', price: '', credits: 0, rating: 0, reviewCount: 0, location: 'Virtual' },
  { id: randomUUID(), businessId: businessIdAndrea, name: 'Nutritional Consultation 60min — Andrea Geiger', category: 'nutritional-consultation', duration: 60, format: 'virtual', price: '', credits: 0, rating: 0, reviewCount: 0, location: 'Virtual' },

  // Doggy Daycare
  { id: randomUUID(), businessId: businessIdMrDogClub, name: 'Doggy Daycare — Mr Dog Club',         category: 'daycare', duration: null, format: 'in-person', price: '', credits: 0, rating: 0, reviewCount: 0, location: 'Richmond Hill, ON' },
  { id: randomUUID(), businessId: businessIdDogDays,   name: 'Doggy Daycare — Dog Days Daycare',    category: 'daycare', duration: null, format: 'in-person', price: '', credits: 0, rating: 0, reviewCount: 0, location: 'Vaughan, ON' },
  { id: randomUUID(), businessId: businessIdBowWow,    name: 'Doggy Daycare — Bow Wow Country Club',category: 'daycare', duration: null, format: 'in-person', price: '', credits: 0, rating: 0, reviewCount: 0, location: 'Schomberg, ON' },
  { id: randomUUID(), businessId: businessIdK9to5,     name: 'Doggy Daycare — K9 to 5',             category: 'daycare', duration: null, format: 'in-person', price: '', credits: 0, rating: 0, reviewCount: 0, location: 'Newmarket, ON' },

  // Grooming — Mr Dog Club also offers grooming
  { id: randomUUID(), businessId: businessIdMrDogClub, name: 'Wellness Grooming — Mr Dog Club', category: 'grooming', duration: null, format: 'in-person', price: '', credits: 0, rating: 0, reviewCount: 0, location: 'Richmond Hill, ON' }
].map(s => ({ ...s, image: '', description: '', createdAt: now, updatedAt: now }))

// ── Batch write helpers ────────────────────────────────────────────────────

function chunk(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

async function batchWrite(tableName, items) {
  for (const batch of chunk(items, 25)) {
    await dynamodb.send(new BatchWriteCommand({
      RequestItems: {
        [tableName]: batch.map(item => ({ PutRequest: { Item: item } }))
      }
    }))
  }
}

// ── Run ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\nStarting FurCircle seed...\n')

  await batchWrite(process.env.SERVICE_CATEGORIES_TABLE, categories)
  console.log(`Seeded ${categories.length} categories`)

  await batchWrite(process.env.DOG_BUSINESS_TABLE, businesses)
  console.log(`Seeded ${businesses.length} businesses`)

  await batchWrite(process.env.DOGS_SERVICES_TABLE, dogServices)
  console.log(`Seeded ${dogServices.length} services`)

  console.log('\nSeed complete.\n')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
