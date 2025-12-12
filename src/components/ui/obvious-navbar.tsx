"use client"

import React from "react"
import Link from "next/link"
import { Home, CloudRain, Bug, Leaf, DollarSign, Users, Wrench, MessageCircle } from "lucide-react"

export function ObviousNavbar() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Weather', url: '/weather', icon: CloudRain },
    { name: 'Pest Detection', url: '/pest-demo', icon: Bug },
    { name: 'Market Prices', url: '/market-demo', icon: DollarSign },
    { name: 'Dealers', url: '/dealers', icon: Users },
    { name: 'Tools', url: '/tools', icon: Wrench },
    { name: 'Chat', url: '/voice-demo', icon: MessageCircle },
    { name: 'Tabs Demo', url: '/expandable-tabs-demo', icon: Wrench }
  ]

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: 'red',
        color: 'white',
        padding: '15px',
        zIndex: 99999,
        fontSize: '16px',
        fontWeight: 'bold',
        borderBottom: '3px solid black',
        boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.url}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)'}
              >
                <Icon size={20} />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{item.name}</span>
              </Link>
            )
          })}
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          🚨 SMART AGRITECH NAVBAR 🚨
        </div>
      </div>
    </div>
  )
}
