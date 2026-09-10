import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Clear existing subsidies
    await prisma.subsidy.deleteMany()

    // Seed subsidy data
    const subsidies = [
      {
        name: "PM-KISAN Scheme",
        description: "Direct income support of ₹6,000 per year to all farmer families",
        eligibility: JSON.stringify({
          criteria: ["Landholding farmers", "Small and marginal farmers"],
          incomeLimit: "No income limit",
          landSize: "Any size"
        }),
        amount: "₹6,000 per year",
        category: "income_support",
        state: null
      },
      {
        name: "Soil Health Card Scheme",
        description: "Free soil testing and recommendations for farmers",
        eligibility: JSON.stringify({
          criteria: ["All farmers"],
          requirements: ["Valid land documents"]
        }),
        amount: "Free",
        category: "soil_health",
        state: null
      },
      {
        name: "Pradhan Mantri Fasal Bima Yojana",
        description: "Crop insurance scheme for farmers",
        eligibility: JSON.stringify({
          criteria: ["All farmers", "Sharecroppers", "Tenant farmers"],
          crops: ["Food crops", "Oilseeds", "Commercial crops"]
        }),
        amount: "Premium: 1.5-5% of sum insured",
        category: "insurance",
        state: null
      },
      {
        name: "National Mission on Sustainable Agriculture",
        description: "Promotes sustainable agriculture practices",
        eligibility: JSON.stringify({
          criteria: ["Farmers adopting sustainable practices"],
          practices: ["Organic farming", "Water conservation", "Soil health"]
        }),
        amount: "Up to ₹50,000 per hectare",
        category: "sustainable_agriculture",
        state: null
      },
      {
        name: "Micro Irrigation Fund",
        description: "Financial assistance for micro irrigation systems",
        eligibility: JSON.stringify({
          criteria: ["Farmers", "Farmer groups", "Cooperatives"],
          landSize: "Minimum 0.5 hectares"
        }),
        amount: "Up to ₹50,000 per hectare",
        category: "irrigation",
        state: null
      },
      {
        name: "Telangana Rythu Bandhu",
        description: "Investment support scheme for farmers",
        eligibility: JSON.stringify({
          criteria: ["Landholding farmers in Telangana"],
          landSize: "Any size"
        }),
        amount: "₹5,000 per acre per season",
        category: "investment_support",
        state: "Telangana"
      },
      {
        name: "Karnataka Raitha Siri",
        description: "Direct benefit transfer for farmers",
        eligibility: JSON.stringify({
          criteria: ["Farmers in Karnataka"],
          crops: ["Paddy", "Sugarcane", "Cotton"]
        }),
        amount: "₹5,000 per acre",
        category: "direct_benefit",
        state: "Karnataka"
      }
    ]

    // Create subsidies
    for (const subsidy of subsidies) {
      await prisma.subsidy.create({
        data: subsidy
      })
    }

    return NextResponse.json({
      success: true,
      message: `${subsidies.length} subsidies seeded successfully`
    })

  } catch (error) {
    console.error('Seed subsidies error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

