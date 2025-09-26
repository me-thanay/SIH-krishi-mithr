import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Seed crops
  const crops = [
    {
      name: 'Rice',
      scientificName: 'Oryza sativa',
      category: 'cereal',
      season: 'kharif',
      duration: 120,
      waterRequirement: 'High',
      soilType: 'Clay, Loamy',
      climate: 'Tropical, Subtropical',
      yieldPerAcre: '2000-4000 kg',
      marketPrice: 25.50,
      description: 'Staple food crop grown in flooded fields',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    },
    {
      name: 'Wheat',
      scientificName: 'Triticum aestivum',
      category: 'cereal',
      season: 'rabi',
      duration: 120,
      waterRequirement: 'Medium',
      soilType: 'Loamy, Sandy Loam',
      climate: 'Temperate',
      yieldPerAcre: '3000-5000 kg',
      marketPrice: 22.30,
      description: 'Winter cereal crop, major staple food',
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400'
    },
    {
      name: 'Maize',
      scientificName: 'Zea mays',
      category: 'cereal',
      season: 'kharif',
      duration: 90,
      waterRequirement: 'Medium',
      soilType: 'Loamy, Sandy',
      climate: 'Tropical, Subtropical',
      yieldPerAcre: '2500-4000 kg',
      marketPrice: 18.75,
      description: 'Versatile crop used for food, feed, and industrial purposes',
      imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400'
    },
    {
      name: 'Tomato',
      scientificName: 'Solanum lycopersicum',
      category: 'vegetable',
      season: 'rabi',
      duration: 90,
      waterRequirement: 'Medium',
      soilType: 'Loamy, Sandy Loam',
      climate: 'Temperate, Subtropical',
      yieldPerAcre: '15000-25000 kg',
      marketPrice: 35.00,
      description: 'Popular vegetable crop with high nutritional value',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400'
    },
    {
      name: 'Potato',
      scientificName: 'Solanum tuberosum',
      category: 'vegetable',
      season: 'rabi',
      duration: 100,
      waterRequirement: 'Medium',
      soilType: 'Loamy, Sandy Loam',
      climate: 'Temperate',
      yieldPerAcre: '20000-30000 kg',
      marketPrice: 15.50,
      description: 'Starchy tuber crop, important food source',
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400'
    },
    {
      name: 'Onion',
      scientificName: 'Allium cepa',
      category: 'vegetable',
      season: 'rabi',
      duration: 120,
      waterRequirement: 'Low',
      soilType: 'Sandy Loam, Loamy',
      climate: 'Temperate, Subtropical',
      yieldPerAcre: '15000-20000 kg',
      marketPrice: 28.75,
      description: 'Essential vegetable crop used in cooking',
      imageUrl: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400'
    },
    {
      name: 'Sugarcane',
      scientificName: 'Saccharum officinarum',
      category: 'cash',
      season: 'kharif',
      duration: 365,
      waterRequirement: 'High',
      soilType: 'Clay, Loamy',
      climate: 'Tropical, Subtropical',
      yieldPerAcre: '40000-60000 kg',
      marketPrice: 3.25,
      description: 'Cash crop used for sugar production',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    },
    {
      name: 'Cotton',
      scientificName: 'Gossypium hirsutum',
      category: 'cash',
      season: 'kharif',
      duration: 180,
      waterRequirement: 'Medium',
      soilType: 'Black Soil, Loamy',
      climate: 'Tropical, Subtropical',
      yieldPerAcre: '800-1200 kg',
      marketPrice: 65.00,
      description: 'Fiber crop for textile industry',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'
    }
  ]

  console.log('🌾 Seeding crops...')
  for (const crop of crops) {
    await prisma.crop.upsert({
      where: { name: crop.name },
      update: crop,
      create: crop
    })
  }

  // Seed subsidies
  const subsidies = [
    {
      name: 'PM-KISAN Scheme',
      description: 'Direct income support to farmers',
      eligibility: JSON.stringify({
        criteria: ['Landholding farmers', 'Small and marginal farmers'],
        documents: ['Land records', 'Bank account details', 'Aadhaar card']
      }),
      amount: '₹6000 per year',
      category: 'income_support',
      state: null, // National scheme
      district: null,
      cropType: null,
      minFarmSize: '0.1 acres',
      maxFarmSize: '2 acres',
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31')
    },
    {
      name: 'Soil Health Card Scheme',
      description: 'Free soil testing and recommendations',
      eligibility: JSON.stringify({
        criteria: ['All farmers', 'Landholding farmers'],
        documents: ['Land records', 'Aadhaar card']
      }),
      amount: 'Free',
      category: 'soil_health',
      state: null,
      district: null,
      cropType: null,
      minFarmSize: '0.1 acres',
      maxFarmSize: null,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2025-03-31')
    },
    {
      name: 'Pradhan Mantri Fasal Bima Yojana',
      description: 'Crop insurance scheme',
      eligibility: JSON.stringify({
        criteria: ['All farmers', 'Crop growers'],
        documents: ['Land records', 'Bank account details', 'Aadhaar card']
      }),
      amount: 'Premium: 2% for Kharif, 1.5% for Rabi',
      category: 'insurance',
      state: null,
      district: null,
      cropType: null,
      minFarmSize: '0.1 acres',
      maxFarmSize: null,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31')
    },
    {
      name: 'Maharashtra Cotton Subsidy',
      description: 'Subsidy for cotton cultivation',
      eligibility: JSON.stringify({
        criteria: ['Cotton farmers in Maharashtra', 'Registered farmers'],
        documents: ['Land records', 'Cotton cultivation certificate', 'Bank account']
      }),
      amount: '₹5000 per acre',
      category: 'crop_specific',
      state: 'Maharashtra',
      district: null,
      cropType: 'Cotton',
      minFarmSize: '1 acre',
      maxFarmSize: '10 acres',
      validFrom: new Date('2024-06-01'),
      validTo: new Date('2024-12-31')
    },
    {
      name: 'Punjab Wheat Seed Subsidy',
      description: 'Subsidy for certified wheat seeds',
      eligibility: JSON.stringify({
        criteria: ['Wheat farmers in Punjab', 'Small and marginal farmers'],
        documents: ['Land records', 'Seed purchase receipt', 'Bank account']
      }),
      amount: '50% subsidy up to ₹2000',
      category: 'seed',
      state: 'Punjab',
      district: null,
      cropType: 'Wheat',
      minFarmSize: '0.5 acres',
      maxFarmSize: '5 acres',
      validFrom: new Date('2024-10-01'),
      validTo: new Date('2025-03-31')
    },
    {
      name: 'Karnataka Organic Farming Subsidy',
      description: 'Support for organic farming practices',
      eligibility: JSON.stringify({
        criteria: ['Organic farmers', 'Certified organic farms'],
        documents: ['Organic certification', 'Land records', 'Bank account']
      }),
      amount: '₹10000 per acre',
      category: 'organic_farming',
      state: 'Karnataka',
      district: null,
      cropType: null,
      minFarmSize: '1 acre',
      maxFarmSize: '20 acres',
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2024-12-31')
    }
  ]

  console.log('💰 Seeding subsidies...')
  for (const subsidy of subsidies) {
    await prisma.subsidy.upsert({
      where: { name: subsidy.name },
      update: subsidy,
      create: subsidy
    })
  }

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
