import React from "react"

export function DebugNavbar() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'red',
      color: 'white',
      padding: '10px',
      zIndex: 99999,
      fontSize: '16px',
      fontWeight: 'bold',
      textAlign: 'center'
    }}>
      🚨 DEBUG NAVBAR - IF YOU SEE THIS, THE NAVBAR IS WORKING! 🚨
    </div>
  )
}
