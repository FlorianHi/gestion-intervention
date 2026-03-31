import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, BarChart3, List } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav style={{
      backgroundColor: '#1e3a5f',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '64px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flexShrink: 0 }}>
            <h1 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: 'white',
              margin: 0 
            }}>ERI Gestion</h1>
          </div>
          <div style={{ 
            display: 'flex', 
            marginLeft: '32px',
            gap: '32px'
          }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                paddingTop: '4px',
                paddingBottom: '4px',
                paddingLeft: '4px',
                borderBottom: isActive('/') ? '2px solid #3b82f6' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                textDecoration: 'none',
                transition: 'all 0.2s',
                backgroundColor: isActive('/') ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
              }}
            >
              <BarChart3 size={16} style={{ marginRight: '8px' }} />
              Dashboard
            </Link>
            <Link
              to="/interventions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                paddingTop: '4px',
                paddingBottom: '4px',
                paddingLeft: '4px',
                borderBottom: isActive('/interventions') ? '2px solid #3b82f6' : '2px solid transparent',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                textDecoration: 'none',
                transition: 'all 0.2s',
                backgroundColor: isActive('/interventions') ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
              }}
            >
              <List size={16} style={{ marginRight: '8px' }} />
              Interventions
            </Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.9)' 
          }}>
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'white',
              backgroundColor: '#3b82f6',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <LogOut size={16} style={{ marginRight: '8px' }} />
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  )
}
