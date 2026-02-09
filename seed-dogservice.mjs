import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { config } from 'dotenv'

config()

const dynamodbClient = new DynamoDB({
  region: 'us-east-1'
})
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient)

const now = new Date().toISOString()

// ── Service Categories (matching Figma prototype) ──────────────────────────
const categories = [
  { slug: 'essential-care', name: 'Essential Care', description: 'Daily wellness for your dog', icon: 'essential-care', sortOrder: 1 },
  { slug: 'daycare', name: 'Daycare', description: 'Full & supervised play', icon: 'daycare', sortOrder: 2 },
  { slug: 'training-behaviour', name: 'Training & Behaviour', description: 'Obedience, skills & behavior shaping', icon: 'training-behaviour', sortOrder: 3 },
  { slug: 'behavioural-consultations', name: 'Behavioural Consultations', description: 'Anxiety, aggression, etc.', icon: 'behavioural-consultations', sortOrder: 4 },
  { slug: 'dog-walking', name: 'Dog Walking', description: 'Exercise & outdoor adventures', icon: 'dog-walking', sortOrder: 5 },
  { slug: 'wellness-health', name: 'Wellness and Health', description: 'Check-ups & preventative care', icon: 'wellness-health', sortOrder: 6 },
  { slug: 'nutritional-consultation', name: 'Nutritional Consultation', description: 'Diet & meal plans', icon: 'nutritional-consultation', sortOrder: 7 },
  { slug: 'grooming', name: 'Grooming', description: 'Baths, nails & haircuts', icon: 'grooming', sortOrder: 8 },
  { slug: 'extended-care', name: 'Extended Care', description: 'When you\'re away or need extra help', icon: 'extended-care', sortOrder: 9 }
].map(c => ({ ...c, createdAt: now, updatedAt: now }))

// ── Dog Services / Providers ───────────────────────────────────────────────
const dogServices = [
  {
    id: randomUUID(),
    name: "Happy Paws Grooming",
    category: "grooming",
    description: "Professional dog grooming services including bathing, haircuts, nail trimming, and ear cleaning.",
    price: "$$",
    rating: 4.8,
    reviewCount: 185,
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
    location: "Lagos, Nigeria",
    phone: "+234 801 234 5678"
  },
  {
    id: randomUUID(),
    name: "Canine Care Clinic",
    category: "wellness-health",
    description: "Full-service veterinary clinic with vaccinations, checkups, and emergency care.",
    price: "$$$",
    rating: 4.9,
    reviewCount: 250,
    image: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400",
    location: "Abuja, Nigeria",
    phone: "+234 802 345 6789"
  },
  {
    id: randomUUID(),
    name: "Paw Palace Boarding",
    category: "extended-care",
    description: "Luxury dog boarding with spacious rooms, play areas, and 24/7 supervision.",
    price: "$$$",
    rating: 4.7,
    reviewCount: 142,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
    location: "Port Harcourt, Nigeria",
    phone: "+234 803 456 7890"
  },
  {
    id: randomUUID(),
    name: "Walkies Dog Walking",
    category: "dog-walking",
    description: "Professional dog walking services. Individual and group walks available.",
    price: "$",
    rating: 4.6,
    reviewCount: 210,
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400",
    location: "Lagos, Nigeria",
    phone: "+234 804 567 8901"
  },
  {
    id: randomUUID(),
    name: "Bark & Train Academy",
    category: "training-behaviour",
    description: "Obedience training, behavior correction, and puppy socialization classes.",
    price: "$$",
    rating: 4.5,
    reviewCount: 98,
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
    location: "Ibadan, Nigeria",
    phone: "+234 805 678 9012"
  },
  {
    id: randomUUID(),
    name: "FurEver Friends Daycare",
    category: "daycare",
    description: "Safe and fun dog daycare with supervised playtime and rest periods.",
    price: "$$",
    rating: 4.7,
    reviewCount: 230,
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
    location: "Lagos, Nigeria",
    phone: "+234 806 789 0123"
  },
  {
    id: randomUUID(),
    name: "Pampered Pooches Spa",
    category: "grooming",
    description: "Luxury spa treatments for dogs including aromatherapy, massage, and premium grooming.",
    price: "$$$",
    rating: 4.9,
    reviewCount: 175,
    image: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400",
    location: "Lekki, Lagos",
    phone: "+234 807 890 1234"
  },
  {
    id: randomUUID(),
    name: "Pet Transport Nigeria",
    category: "extended-care",
    description: "Safe and comfortable pet transportation services across Nigeria.",
    price: "$$",
    rating: 4.4,
    reviewCount: 67,
    image: "https://images.unsplash.com/photo-1541599540903-216a46ab1b39?w=400",
    location: "Nationwide",
    phone: "+234 808 901 2345"
  },
  {
    id: randomUUID(),
    name: "Doggy Delights Store",
    category: "essential-care",
    description: "Premium dog food, toys, accessories, and supplies.",
    price: "$$",
    rating: 4.6,
    reviewCount: 120,
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
    location: "Victoria Island, Lagos",
    phone: "+234 809 012 3456"
  },
  {
    id: randomUUID(),
    name: "K9 Security Training",
    category: "training-behaviour",
    description: "Professional guard dog and security training services.",
    price: "$$$",
    rating: 4.8,
    reviewCount: 89,
    image: "https://images.unsplash.com/photo-1553882809-a4f57e59501d?w=400",
    location: "Abuja, Nigeria",
    phone: "+234 810 123 4567"
  }
]

// ── Seed Categories ────────────────────────────────────────────────────────
const categoryPutReqs = categories.map(cat => ({
  PutRequest: { Item: cat }
}))

const categoryCmd = new BatchWriteCommand({
  RequestItems: {
    [process.env.SERVICE_CATEGORIES_TABLE]: categoryPutReqs
  }
})

// ── Seed Dog Services ──────────────────────────────────────────────────────
const servicePutReqs = dogServices.map(service => ({
  PutRequest: { Item: service }
}))

const serviceCmd = new BatchWriteCommand({
  RequestItems: {
    [process.env.DOGS_SERVICES_TABLE]: servicePutReqs
  }
})

Promise.all([
  dynamodb.send(categoryCmd),
  dynamodb.send(serviceCmd)
])
  .then(() => console.log(`Successfully seeded ${categories.length} categories and ${dogServices.length} dog services!`))
  .catch(err => console.error('Error seeding database:', err))