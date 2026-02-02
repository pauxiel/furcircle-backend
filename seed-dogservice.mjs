import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { BatchWriteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import { config } from 'dotenv'

config()

const dynamodbClient = new DynamoDB({
  region: 'us-east-1'
})
const dynamodb = DynamoDBDocumentClient.from(dynamodbClient)

const dogServices = [
  {
    id: randomUUID(),
    name: "Happy Paws Grooming",
    category: "Grooming",
    description: "Professional dog grooming services including bathing, haircuts, nail trimming, and ear cleaning.",
    price: "$$",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400",
    location: "Lagos, Nigeria",
    phone: "+234 801 234 5678"
  },
  {
    id: randomUUID(),
    name: "Canine Care Clinic",
    category: "Veterinary",
    description: "Full-service veterinary clinic with vaccinations, checkups, and emergency care.",
    price: "$$$",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400",
    location: "Abuja, Nigeria",
    phone: "+234 802 345 6789"
  },
  {
    id: randomUUID(),
    name: "Paw Palace Boarding",
    category: "Boarding",
    description: "Luxury dog boarding with spacious rooms, play areas, and 24/7 supervision.",
    price: "$$$",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
    location: "Port Harcourt, Nigeria",
    phone: "+234 803 456 7890"
  },
  {
    id: randomUUID(),
    name: "Walkies Dog Walking",
    category: "Walking",
    description: "Professional dog walking services. Individual and group walks available.",
    price: "$",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400",
    location: "Lagos, Nigeria",
    phone: "+234 804 567 8901"
  },
  {
    id: randomUUID(),
    name: "Bark & Train Academy",
    category: "Training",
    description: "Obedience training, behavior correction, and puppy socialization classes.",
    price: "$$",
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
    location: "Ibadan, Nigeria",
    phone: "+234 805 678 9012"
  },
  {
    id: randomUUID(),
    name: "FurEver Friends Daycare",
    category: "Daycare",
    description: "Safe and fun dog daycare with supervised playtime and rest periods.",
    price: "$$",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
    location: "Lagos, Nigeria",
    phone: "+234 806 789 0123"
  },
  {
    id: randomUUID(),
    name: "Pampered Pooches Spa",
    category: "Grooming",
    description: "Luxury spa treatments for dogs including aromatherapy, massage, and premium grooming.",
    price: "$$$",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400",
    location: "Lekki, Lagos",
    phone: "+234 807 890 1234"
  },
  {
    id: randomUUID(),
    name: "Pet Transport Nigeria",
    category: "Transport",
    description: "Safe and comfortable pet transportation services across Nigeria.",
    price: "$$",
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1541599540903-216a46ab1b39?w=400",
    location: "Nationwide",
    phone: "+234 808 901 2345"
  },
  {
    id: randomUUID(),
    name: "Doggy Delights Store",
    category: "Pet Store",
    description: "Premium dog food, toys, accessories, and supplies.",
    price: "$$",
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
    location: "Victoria Island, Lagos",
    phone: "+234 809 012 3456"
  },
  {
    id: randomUUID(),
    name: "K9 Security Training",
    category: "Training",
    description: "Professional guard dog and security training services.",
    price: "$$$",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1553882809-a4f57e59501d?w=400",
    location: "Abuja, Nigeria",
    phone: "+234 810 123 4567"
  }
]

const putReqs = dogServices.map(service => ({
  PutRequest: {
    Item: service
  }
}))

const cmd = new BatchWriteCommand({
  RequestItems: {
    [process.env.DOGS_SERVICES_TABLE]: putReqs
  }
})

dynamodb.send(cmd)
  .then(() => console.log(`Successfully seeded ${dogServices.length} dog services!`))
  .catch(err => console.error('Error seeding database:', err))