import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [stats, setStats] = useState({
    aFaire: 0,
    planifiees: 0,
    faites: 0,
    retard: 0,
    totalHT: 0,
    recentInterventions: []
  })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonths, setSelectedMonths] = useState([new Date().getMonth() + 1])

  const months = [
    { value: 0, label: 'En retard' },
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [selectedMonths])

  const fetchDashboardData = async () => {
    try {
      const currentYear = new Date().getFullYear()

      // Get all interventions
      const { data: interventions, error } = await supabase
        .from('interventions')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Filter by selected months
      const filteredInterventions = interventions.filter(i => 
        selectedMonths.includes(i.mois_facture) && !i.actif === false
      )

      // Calculate stats
      const currentMonth = new Date().getMonth() + 1
      const aFaire = filteredInterventions.filter(i => 
        i.statut === 'a_faire'
      ).length

      const planifiees = filteredInterventions.filter(i => 
        i.statut === 'planifie'
      ).length

      const faites = filteredInterventions.filter(i => 
        i.statut === 'fait'
      ).length

      const retard = interventions.filter(i => 
        i.statut !== 'fait' && i.mois_facture < currentMonth && !i.actif === false
      ).length

      const totalHT = filteredInterventions
        .filter(i => i.statut === 'fait')
        .reduce((sum, i) => sum + (i.total_ht || 0), 0)

      const recentInterventions = interventions.slice(0, 5)

      // Prepare chart data (full year view with month 0)
      const chartMonths = []
      const allMonths = [
        { value: 0, label: 'En retard' },
        { value: 1, label: 'Janvier' },
        { value: 2, label: 'Février' },
        { value: 3, label: 'Mars' },
        { value: 4, label: 'Avril' },
        { value: 5, label: 'Mai' },
        { value: 6, label: 'Juin' },
        { value: 7, label: 'Juillet' },
        { value: 8, label: 'Août' },
        { value: 9, label: 'Septembre' },
        { value: 10, label: 'Octobre' },
        { value: 11, label: 'Novembre' },
        { value: 12, label: 'Décembre' }
      ]
      
      allMonths.forEach(month => {
        const monthData = interventions.filter(i => 
          i.mois_facture === month.value && !i.actif === false
        )
        
        chartMonths.push({
          month: month.label,
          aFaire: monthData.filter(i => i.statut === 'a_faire').length,
          planifiees: monthData.filter(i => i.statut === 'planifie').length,
          faites: monthData.filter(i => i.statut === 'fait').length,
        })
      })

      setStats({
        aFaire,
        planifiees,
        faites,
        retard,
        totalHT,
        recentInterventions
      })
      setChartData(chartMonths)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (monthValue) => {
    setSelectedMonths(prev => {
      if (prev.includes(monthValue)) {
        // Remove month if already selected (but keep at least one)
        return prev.length > 1 ? prev.filter(m => m !== monthValue) : prev
      } else {
        // Add month
        return [...prev, monthValue]
      }
    })
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f1f5f9'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #1e40af',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f1f5f9'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#1e293b',
            marginBottom: '8px'
          }}>Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>Vue d'ensemble de vos interventions</p>
        </div>

        {/* Month Selector */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '40px'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '16px'
          }}>Sélectionner les mois</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '12px'
          }}>
            {months.map(month => (
              <label
                key={month.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  backgroundColor: selectedMonths.includes(month.value) ? '#3b82f6' : '#f8fafc',
                  border: selectedMonths.includes(month.value) ? '2px solid #3b82f6' : '2px solid #e2e8f0'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedMonths.includes(month.value)}
                  onChange={() => handleMonthChange(month.value)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: selectedMonths.includes(month.value) ? 'white' : '#475569'
                }}>
                  {month.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Stats Cards Grid - 4 columns */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '24px', 
          marginBottom: '40px' 
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>À faire</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e40af' }}>{stats.aFaire}</p>
              </div>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={24} color="white" />
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Planifiées</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e40af' }}>{stats.planifiees}</p>
              </div>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={24} color="white" />
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Faites</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e40af' }}>{stats.faites}</p>
              </div>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={24} color="white" />
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>En retard</p>
                <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#1e40af' }}>{stats.retard}</p>
              </div>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={24} color="white" />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '40px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '24px' }}>
            Répartition des interventions par mois de facturation
          </h2>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value, name, props) => {
                    if (props.payload.month === 'En retard') {
                      return [
                        <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{value}</span>,
                        <span style={{ color: '#dc2626' }}>{name} (En retard)</span>
                      ]
                    }
                    return [value, name]
                  }}
                />
                <Bar dataKey="aFaire" stackId="a" fill="#ef4444" name="À faire" radius={[4, 4, 0, 0]} />
                <Bar dataKey="planifiees" stackId="a" fill="#f59e0b" name="Planifiées" radius={[4, 4, 0, 0]} />
                <Bar dataKey="faites" stackId="a" fill="#10b981" name="Faites" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748b' }}>
            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>● En retard</span> = Interventions avec mois_facture = 0 (non facturées)
          </div>
        </div>

        {/* Recent Interventions Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '24px', 
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>
              5 dernières interventions modifiées
            </h2>
          </div>
          <div>
            {stats.recentInterventions.map((intervention, index) => (
              <div key={intervention.id} style={{
                padding: '24px',
                borderBottom: index < stats.recentInterventions.length - 1 ? '1px solid #e5e7eb' : 'none',
                backgroundColor: index === 0 ? '#eff6ff' : 'transparent',
                transition: 'background-color 0.15s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      {intervention.nom_client}
                    </p>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      {intervention.ville} • {intervention.affaire}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: '24px' }}>
                    <span style={{
                      display: 'inline-flex',
                      padding: '6px 12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      borderRadius: '9999px',
                      backgroundColor: intervention.statut === 'fait' ? '#dcfce7' :
                                      intervention.statut === 'planifie' ? '#fef3c7' :
                                      '#fee2e2',
                      color: intervention.statut === 'fait' ? '#166534' :
                             intervention.statut === 'planifie' ? '#92400e' :
                             '#991b1b'
                    }}>
                      {intervention.statut === 'a_faire' ? 'À faire' :
                       intervention.statut === 'planifie' ? 'Planifiée' : 'Fait'}
                    </span>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                      {new Date(intervention.updated_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
