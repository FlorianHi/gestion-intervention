import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Search, Edit, Trash2, Download, Upload, Plus, Calendar, List } from 'lucide-react'
import InterventionModal from '../components/InterventionModal'
import ImportModal from '../components/ImportModal'
import * as XLSX from 'xlsx'

// Tooltip global state
let globalTooltip = { visible: false, text: '', x: 0, y: 0 }

export default function Interventions() {
  const [interventions, setInterventions] = useState([])
  const [filteredInterventions, setFilteredInterventions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('tous')
  const [monthFilter, setMonthFilter] = useState('')
  const [codePostalFilter, setCodePostalFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [deleteAllCode, setDeleteAllCode] = useState('')
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [selectedIntervention, setSelectedIntervention] = useState(null)
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 })
  const [editingStatus, setEditingStatus] = useState({ id: null, value: '', position: { x: 0, y: 0 } })
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [editingDate, setEditingDate] = useState({ id: null, value: '', position: { x: 0, y: 0 } })
  const [updatingDate, setUpdatingDate] = useState(null)

  const itemsPerPage = 50

  const showTooltip = (e, text) => {
    setTooltip({
      visible: true,
      text: text,
      x: e.clientX,
      y: e.clientY - 40
    })
  }

  const hideTooltip = () => {
    setTooltip({
      visible: false,
      text: '',
      x: 0,
      y: 0
    })
  }

  const startEditingStatus = (e, intervention) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setEditingStatus({
      id: intervention.id,
      value: intervention.statut,
      position: {
        x: rect.left,
        y: rect.bottom + 2
      }
    })
  }

  const cancelEditingStatus = () => {
    setEditingStatus({ id: null, value: '', position: { x: 0, y: 0 } })
  }

  const updateStatus = async (newStatus) => {
    if (!editingStatus.id) return
    
    setUpdatingStatus(editingStatus.id)
    
    try {
      const { error } = await supabase
        .from('interventions')
        .update({ 
          statut: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingStatus.id)

      if (error) throw error

      // Mettre à jour l'intervention dans le state local
      setInterventions(prev => 
        prev.map(int => 
          int.id === editingStatus.id 
            ? { ...int, statut: newStatus }
            : int
        )
      )

      toast.success('Statut mis à jour')
      cancelEditingStatus()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut')
      console.error('Error updating status:', error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
  }

  const startEditingDate = (e, intervention) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setEditingDate({
      id: intervention.id,
      value: intervention.planifie_le || '',
      position: {
        x: rect.left,
        y: rect.bottom + 2
      }
    })
  }

  const cancelEditingDate = () => {
    setEditingDate({ id: null, value: '', position: { x: 0, y: 0 } })
  }

  const updateDate = async (newDate) => {
    if (!editingDate.id) return
    
    setUpdatingDate(editingDate.id)
    
    try {
      const { error } = await supabase
        .from('interventions')
        .update({ 
          planifie_le: newDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingDate.id)

      if (error) throw error

      // Mettre à jour l'intervention dans le state local
      setInterventions(prev => 
        prev.map(int => 
          int.id === editingDate.id 
            ? { ...int, planifie_le: newDate }
            : int
        )
      )

      toast.success('Date mise à jour')
      cancelEditingDate()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la date')
      console.error('Error updating date:', error)
    } finally {
      setUpdatingDate(null)
    }
  }

  useEffect(() => {
    fetchInterventions()
  }, [])

  useEffect(() => {
    filterInterventions()
  }, [interventions, searchTerm, statusFilter, monthFilter, codePostalFilter])

  const fetchInterventions = async () => {
    try {
      const { data, error } = await supabase
        .from('interventions')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error

      setInterventions(data || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des interventions')
      console.error('Error fetching interventions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterInterventions = () => {
    let filtered = interventions

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(i =>
        i.nom_client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.code_postal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.mail_client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.commentaire_commande?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.chiffrage?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'tous') {
      filtered = filtered.filter(i => i.statut === statusFilter)
    }

    // Month filter
    if (monthFilter) {
      filtered = filtered.filter(i => i.mois_facture === parseInt(monthFilter))
    }

    // Code Postal filter
    if (codePostalFilter) {
      filtered = filtered.filter(i => 
        i.code_postal?.toLowerCase().startsWith(codePostalFilter.toLowerCase())
      )
    }

    setFilteredInterventions(filtered)
    setCurrentPage(1)
  }

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('interventions')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Intervention supprimée avec succès')
      fetchInterventions()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error('Error deleting intervention:', error)
    }
  }

  const handleDeleteAll = async () => {
    if (deleteAllCode !== 'florianvalide') return
    
    setIsDeletingAll(true)
    
    try {
      const { error } = await supabase
        .from('interventions')
        .delete()
        .neq('id', null) // Supprime tous les enregistrements

      if (error) throw error

      toast.success('Base de données vidée avec succès')
      setShowDeleteAllModal(false)
      setDeleteAllCode('')
      fetchInterventions()
    } catch (error) {
      toast.error('Erreur lors de la suppression totale')
      console.error('Error deleting all interventions:', error)
    } finally {
      setIsDeletingAll(false)
    }
  }

  const handleEdit = (intervention) => {
    setSelectedIntervention(intervention)
    setShowModal(true)
  }

  const handleCreate = () => {
    setSelectedIntervention(null)
    setShowModal(true)
  }

  const handleExport = () => {
    try {
      const exportData = filteredInterventions.map(i => ({
        'Nom Client': i.nom_client,
        'Adresse Intervention': i.adresse_intervention,
        'Ville': i.ville,
        'Code Postal': i.code_postal,
        'Mail Client': i.mail_client,
        'Affaire': i.affaire,
        'Compagnon': i.compagnon,
        'Mois Facture': i.mois_facture,
        'Statut': i.statut,
        'Total HT': i.total_ht,
        'Reste à Payer': i.reste_a_payer,
        'Date Statut': i.date_statut,
        'Planifié le': i.planifie_le
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Interventions')
      XLSX.writeFile(wb, `interventions_${new Date().toISOString().split('T')[0]}.xlsx`)
      
      toast.success('Export réussi')
    } catch (error) {
      toast.error('Erreur lors de l\'export')
      console.error('Error exporting:', error)
    }
  }

  const totalPages = Math.ceil(filteredInterventions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInterventions = filteredInterventions.slice(startIndex, startIndex + itemsPerPage)

  const months = [
    { value: '', label: 'Tous les mois' },
    { value: '1', label: 'Janvier' },
    { value: '2', label: 'Février' },
    { value: '3', label: 'Mars' },
    { value: '4', label: 'Avril' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Juin' },
    { value: '7', label: 'Juillet' },
    { value: '8', label: 'Août' },
    { value: '9', label: 'Septembre' },
    { value: '10', label: 'Octobre' },
    { value: '11', label: 'Novembre' },
    { value: '12', label: 'Décembre' }
  ]

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
      backgroundColor: '#f1f5f9',
      padding: '32px 24px'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header with buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#1e293b',
              marginBottom: '8px'
            }}>Interventions</h1>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              {filteredInterventions.length} intervention{filteredInterventions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowImportModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#475569',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Upload size={16} style={{ marginRight: '8px' }} />
              Importer
            </button>
            <button
              onClick={handleExport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 20px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#475569',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Download size={16} style={{ marginRight: '8px' }} />
              Exporter
            </button>
            <button
              onClick={() => setShowDeleteAllModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 16px',
                border: '2px solid #ef4444',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ef4444',
                backgroundColor: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#fef2f2'
                e.target.style.borderColor = '#dc2626'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white'
                e.target.style.borderColor = '#ef4444'
              }}
            >
              <Trash2 size={16} style={{ marginRight: '8px' }} />
              Tout supprimer
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '24px'
        }}>
          {/* Search Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Search 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }} 
              />
              <input
                type="text"
                placeholder="Rechercher par nom, ville, email, commentaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1e40af'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          {/* Filters Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px'
          }}>
            {/* Status Pills */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#64748b',
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>Statut</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { value: 'tous', label: 'Tous', color: '#64748b', bgColor: '#f1f5f9' },
                  { value: 'a_faire', label: 'À faire', color: '#dc2626', bgColor: '#fee2e2' },
                  { value: 'planifie', label: 'Planifié', color: '#ea580c', bgColor: '#fed7aa' },
                  { value: 'fait', label: 'Fait', color: '#16a34a', bgColor: '#dcfce7' }
                ].map(status => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: statusFilter === status.value ? status.color : status.bgColor,
                      color: statusFilter === status.value ? 'white' : status.color
                    }}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Month Dropdown */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#64748b',
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>Mois</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Code Postal Input */}
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: '600', 
                color: '#64748b',
                marginBottom: '8px',
                textTransform: 'uppercase'
              }}>Code Postal</label>
              <input
                type="text"
                placeholder="Code postal..."
                value={codePostalFilter}
                onChange={(e) => setCodePostalFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1e40af'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px 80px 100px 130px 240px 120px 160px 150px 150px 50px',
            gap: '16px',
            padding: '14px 16px',
            backgroundColor: '#f8fafc',
            borderBottom: '2px solid #e2e8f0',
            fontSize: '12px',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase'
          }}>
            <div>Client</div>
            <div>Mois</div>
            <div>Statut</div>
            <div>Planifié le</div>
            <div>Adresse</div>
            <div>Ville / CP</div>
            <div>Mail Client</div>
            <div>Commentaire</div>
            <div>Chiffrage</div>
            <div>Actions</div>
          </div>

          {/* Table Rows */}
          {paginatedInterventions.map((intervention, index) => (
            <div
              key={intervention.id}
              style={{
                padding: '0 16px',
                display: 'grid',
                gridTemplateColumns: '200px 80px 100px 130px 240px 120px 160px 150px 150px 50px',
                gap: '16px',
                alignItems: 'center',
                backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc',
                borderBottom: '1px solid #f1f5f9',
                fontSize: '14px',
                height: '64px'
              }}
            >
              {/* CLIENT */}
              <div style={{ 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                height: '100%',
                verticalAlign: 'middle',
                paddingTop: '0',
                paddingBottom: '0',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: '#1e293b', 
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {intervention.nom_client}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {intervention.mail_client}
                </div>
              </div>

              {/* MOIS */}
              <div style={{ 
                color: '#475569',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                height: '100%',
                verticalAlign: 'middle',
                paddingTop: '0',
                paddingBottom: '0',
                display: 'flex',
                alignItems: 'center'
              }}>
                {months.find(m => m.value === intervention.mois_facture.toString())?.label || `Mois ${intervention.mois_facture}`}
              </div>

              {/* STATUT */}
              <div style={{ 
                height: '100%',
                verticalAlign: 'middle',
                paddingTop: '0',
                paddingBottom: '0',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}>
                <button
                  onClick={(e) => startEditingStatus(e, intervention)}
                  disabled={updatingStatus === intervention.id}
                  style={{
                    display: 'inline-flex',
                    padding: '4px 8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: updatingStatus === intervention.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: intervention.statut === 'fait' ? '#dcfce7' :
                                    intervention.statut === 'planifie' ? '#fed7aa' :
                                    '#fee2e2',
                    color: intervention.statut === 'fait' ? '#166534' :
                           intervention.statut === 'planifie' ? '#9a3412' :
                           '#991b1b',
                    whiteSpace: 'nowrap',
                    opacity: updatingStatus === intervention.id ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (updatingStatus !== intervention.id) {
                      e.target.style.backgroundColor = intervention.statut === 'fait' ? '#bbf7d0' :
                                              intervention.statut === 'planifie' ? '#fdba74' :
                                              '#fecaca'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (updatingStatus !== intervention.id) {
                      e.target.style.backgroundColor = intervention.statut === 'fait' ? '#dcfce7' :
                                              intervention.statut === 'planifie' ? '#fed7aa' :
                                              '#fee2e2'
                    }
                  }}
                >
                  {updatingStatus === intervention.id ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid currentColor',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Mise à jour...
                    </div>
                  ) : (
                    <>
                      {intervention.statut === 'a_faire' ? 'À faire' :
                       intervention.statut === 'planifie' ? 'Planifié' : 'Fait'}
                      <span style={{ marginLeft: '4px', fontSize: '10px' }}>▼</span>
                    </>
                  )}
                </button>
              </div>

              {/* PLANIFIÉ LE */}
              <div style={{ 
                height: '100%',
                verticalAlign: 'middle',
                paddingTop: '0',
                paddingBottom: '0',
                display: 'flex',
                alignItems: 'center',
                position: 'relative'
              }}>
                <button
                  onClick={(e) => startEditingDate(e, intervention)}
                  disabled={updatingDate === intervention.id}
                  style={{
                    padding: '6px 10px',
                    border: updatingDate === intervention.id ? '1px solid #1e40af' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    backgroundColor: updatingDate === intervention.id ? '#f0f9ff' : 'white',
                    color: updatingDate === intervention.id ? '#1e40af' : '#475569',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: updatingDate === intervention.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (updatingDate !== intervention.id) {
                      e.target.style.backgroundColor = '#f8fafc'
                      e.target.style.borderColor = '#cbd5e1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (updatingDate !== intervention.id) {
                      e.target.style.backgroundColor = 'white'
                      e.target.style.borderColor = '#e2e8f0'
                    }
                  }}
                >
                  {updatingDate === intervention.id ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid #1e40af',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Mise à jour...
                    </div>
                  ) : (
                    <>
                      {formatDate(intervention.planifie_le)}
                      <span style={{ marginLeft: '4px', fontSize: '10px' }}>📅</span>
                    </>
                  )}
                </button>
              </div>

              {/* ADRESSE */}
              <div 
                onMouseEnter={(e) => showTooltip(e, intervention.adresse_intervention || '-')}
                onMouseLeave={hideTooltip}
                style={{ 
                  height: '100%',
                  verticalAlign: 'middle',
                  paddingTop: '0',
                  paddingBottom: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span style={{ 
                  color: '#475569', 
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '240px'
                }}>
                  {intervention.adresse_intervention || '-'}
                </span>
              </div>

              {/* VILLE / CP */}
              <div style={{ 
                color: '#475569',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                height: '100%',
                verticalAlign: 'middle',
                paddingTop: '0',
                paddingBottom: '0',
                display: 'flex',
                alignItems: 'center'
              }}>
                {intervention.ville && intervention.code_postal 
                  ? `${intervention.ville} ${intervention.code_postal}`
                  : intervention.ville || intervention.code_postal || '-'
                }
              </div>

              {/* MAIL CLIENT */}
              <div 
                onMouseEnter={(e) => showTooltip(e, intervention.mail_client || '-')}
                onMouseLeave={hideTooltip}
                style={{ 
                  height: '100%',
                  verticalAlign: 'middle',
                  paddingTop: '0',
                  paddingBottom: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span style={{ 
                  color: '#475569', 
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '160px'
                }}>
                  {intervention.mail_client || '-'}
                </span>
              </div>

              {/* COMMENTAIRE */}
              <div 
                onMouseEnter={(e) => showTooltip(e, intervention.commentaire_commande || '-')}
                onMouseLeave={hideTooltip}
                style={{ 
                  height: '100%',
                  verticalAlign: 'middle',
                  paddingTop: '0',
                  paddingBottom: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span style={{ 
                  color: '#475569', 
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '150px'
                }}>
                  {intervention.commentaire_commande || '-'}
                </span>
              </div>

              {/* CHIFFRAGE */}
              <div 
                onMouseEnter={(e) => showTooltip(e, intervention.chiffrage || '-')}
                onMouseLeave={hideTooltip}
                style={{ 
                  height: '100%',
                  verticalAlign: 'middle',
                  paddingTop: '0',
                  paddingBottom: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span style={{ 
                  color: '#475569', 
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '150px'
                }}>
                  {intervention.chiffrage || '-'}
                </span>
              </div>

              {/* ACTIONS */}
              <div style={{ 
                display: 'flex', 
                gap: '8px',
                height: '100%',
                verticalAlign: 'middle',
                paddingTop: '0',
                paddingBottom: '0',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => {
                    setSelectedIntervention(intervention)
                    setShowModal(true)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#dbeafe'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <Edit size={16} color="#3b82f6" />
                </button>
                <button
                  onClick={() => handleDelete(intervention.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}

          {paginatedInterventions.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '16px'
            }}>
              Aucune intervention trouvée
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '24px'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: currentPage === 1 ? '#f8fafc' : 'white',
                color: currentPage === 1 ? '#94a3b8' : '#475569',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Précédent
            </button>
            
            {[...Array(totalPages)].map((_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: currentPage === page ? '#1e40af' : 'white',
                  color: currentPage === page ? 'white' : '#475569',
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: currentPage === totalPages ? '#f8fafc' : 'white',
                color: currentPage === totalPages ? '#94a3b8' : '#475569',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Suivant
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <InterventionModal
          intervention={selectedIntervention}
          onClose={() => {
            setShowModal(false)
            setSelectedIntervention(null)
          }}
          onSave={() => {
            fetchInterventions()
            setShowModal(false)
            setSelectedIntervention(null)
          }}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            fetchInterventions()
            setShowImportModal(false)
          }}
        />
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '32px',
            width: '500px',
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              Suppression totale de la base
            </h3>
            
            <p style={{
              fontSize: '16px',
              color: '#64748b',
              marginBottom: '24px',
              textAlign: 'center',
              lineHeight: '1.5'
            }}>
              Cette action est irréversible. Toutes les interventions seront définitivement supprimées.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Code de confirmation :
              </label>
              <input
                type="password"
                value={deleteAllCode}
                onChange={(e) => setDeleteAllCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1e40af'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setShowDeleteAllModal(false)
                  setDeleteAllCode('')
                }}
                disabled={isDeletingAll}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  backgroundColor: 'white',
                  cursor: isDeletingAll ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllCode !== 'florianvalide' || isDeletingAll}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: deleteAllCode === 'florianvalide' && !isDeletingAll ? 'white' : '#94a3b8',
                  backgroundColor: deleteAllCode === 'florianvalide' && !isDeletingAll ? '#dc2626' : '#f1f5f9',
                  cursor: deleteAllCode === 'florianvalide' && !isDeletingAll ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isDeletingAll ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Supprimer tout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip Global */}
      {tooltip.visible && (
        <div style={{
          position: 'fixed',
          left: `${tooltip.x}px`,
          top: `${tooltip.y}px`,
          backgroundColor: '#1e293b',
          color: 'white',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '13px',
          zIndex: 9999,
          maxWidth: '300px',
          wordWrap: 'break-word',
          pointerEvents: 'none'
        }}>
          {tooltip.text}
        </div>
      )}

      {/* Status Dropdown */}
      {editingStatus.id && (
        <div style={{
          position: 'fixed',
          left: `${editingStatus.position.x}px`,
          top: `${editingStatus.position.y}px`,
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          overflow: 'hidden'
        }}>
          <button
            onClick={() => updateStatus('a_faire')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#991b1b',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#fee2e2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              backgroundColor: '#dc2626',
              borderRadius: '50%',
              marginRight: '8px'
            }}></span>
            À faire
          </button>
          <button
            onClick={() => updateStatus('planifie')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#9a3412',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#fed7aa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              backgroundColor: '#ea580c',
              borderRadius: '50%',
              marginRight: '8px'
            }}></span>
            Planifié
          </button>
          <button
            onClick={() => updateStatus('fait')}
            onMouseDown={(e) => e.preventDefault()}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#166534',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#dcfce7'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              backgroundColor: '#16a34a',
              borderRadius: '50%',
              marginRight: '8px'
            }}></span>
            Fait
          </button>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {editingStatus.id && (
        <div
          onClick={cancelEditingStatus}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            backgroundColor: 'transparent'
          }}
        />
      )}

      {/* Date Picker */}
      {editingDate.id && (
        <div style={{
          position: 'fixed',
          left: `${editingDate.position.x}px`,
          top: `${editingDate.position.y}px`,
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          padding: '12px'
        }}>
          <input
            type="date"
            defaultValue={editingDate.value}
            onChange={(e) => updateDate(e.target.value)}
            autoFocus
            style={{
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none',
              minWidth: '150px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#1e40af'}
          />
        </div>
      )}

      {/* Click outside to close date picker */}
      {editingDate.id && (
        <div
          onClick={cancelEditingDate}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            backgroundColor: 'transparent'
          }}
        />
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
