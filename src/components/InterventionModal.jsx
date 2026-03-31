import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

export default function InterventionModal({ intervention, onClose, onSave }) {
  const [formData, setFormData] = useState({
    actif: true,
    mois_facture: new Date().getMonth() + 1,
    statut: 'a_faire',
    date_statut: '',
    planifie_le: '',
    equiv: '',
    nom_client: '',
    adresse_intervention: '',
    ville: '',
    code_postal: '',
    mail_client: '',
    commentaire_commande: '',
    adresse_facturation: '',
    mail_facturation: '',
    chiffrage: '',
    total_ht: '',
    reste_a_payer: '',
    compagnon: '',
    affaire: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (intervention) {
      setFormData({
        ...intervention,
        mois_facture: intervention.mois_facture || new Date().getMonth() + 1,
        date_statut: intervention.date_statut || '',
        planifie_le: intervention.planifie_le || ''
      })
    }
  }, [intervention])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Nettoyer les données avant envoi
      const cleanedData = {}
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
          // Pour les champs texte, envoyer null si vide
          if (['nom_client', 'adresse_intervention', 'ville', 'code_postal', 'mail_client', 'commentaire_commande', 'adresse_facturation', 'mail_facturation', 'chiffrage', 'compagnon', 'affaire'].includes(key)) {
            cleanedData[key] = null
          } else if (['total_ht', 'reste_a_payer', 'equiv'].includes(key)) {
            cleanedData[key] = null
          } else if (['date_statut', 'planifie_le'].includes(key)) {
            cleanedData[key] = null
          } else {
            cleanedData[key] = formData[key]
          }
        } else {
          cleanedData[key] = formData[key]
        }
      })

      const dataToSave = {
        ...cleanedData,
        updated_at: new Date().toISOString()
      }

      // Log pour debug
      console.log('Données nettoyées à sauvegarder:', dataToSave)
      console.log('Type de données:', typeof dataToSave)

      let error
      if (intervention?.id) {
        // Update existing intervention
        console.log('Mise à jour de l\'intervention ID:', intervention.id)
        const { error: updateError, data } = await supabase
          .from('interventions')
          .update(dataToSave)
          .eq('id', intervention.id)
          .select()
        
        console.log('Résultat mise à jour:', { error: updateError, data })
        error = updateError
      } else {
        // Create new intervention
        console.log('Création nouvelle intervention')
        const { error: insertError, data } = await supabase
          .from('interventions')
          .insert([{
            ...dataToSave,
            created_at: new Date().toISOString()
          }])
          .select()
        
        console.log('Résultat insertion:', { error: insertError, data })
        error = insertError
      }

      if (error) {
        console.error('Erreur Supabase détaillée:', error)
        console.error('Message:', error.message)
        console.error('Code:', error.code)
        console.error('Details:', error.details)
        throw error
      }

      toast.success(intervention ? 'Intervention modifiée avec succès' : 'Intervention créée avec succès')
      onSave()
    } catch (error) {
      console.error('Erreur complète lors de la sauvegarde:', error)
      toast.error(`Erreur: ${error.message || 'Erreur lors de la sauvegarde'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
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
        width: '700px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: 0
            }}>
              {intervention ? 'Modifier une intervention' : 'Créer une intervention'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <X size={24} color="#64748b" />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '24px'
          }}>
            {/* Informations client */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e40af',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e2e8f0'
              }}>Informations client</h4>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '6px'
                }}>
                  Nom du client *
                </label>
                <input
                  type="text"
                  name="nom_client"
                  required
                  value={formData.nom_client}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '6px'
                }}>
                  Mail client
                </label>
                <input
                  type="email"
                  name="mail_client"
                  value={formData.mail_client}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '6px'
                }}>
                  Adresse intervention
                </label>
                <input
                  type="text"
                  name="adresse_intervention"
                  value={formData.adresse_intervention}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '6px'
                  }}>
                    Ville
                  </label>
                  <input
                    type="text"
                    name="ville"
                    value={formData.ville}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '6px'
                  }}>
                    Code postal
                  </label>
                  <input
                    type="text"
                    name="code_postal"
                    value={formData.code_postal}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '6px'
                }}>
                  Adresse facturation
                </label>
                <input
                  type="text"
                  name="adresse_facturation"
                  value={formData.adresse_facturation}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '6px'
                }}>
                  Mail facturation
                </label>
                <input
                  type="email"
                  name="mail_facturation"
                  value={formData.mail_facturation}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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

            {/* Informations intervention */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e40af',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e2e8f0'
              }}>Informations intervention</h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '6px'
                  }}>
                    Affaire
                  </label>
                  <input
                    type="text"
                    name="affaire"
                    value={formData.affaire}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '6px'
                  }}>
                    Compagnon
                  </label>
                  <input
                    type="text"
                    name="compagnon"
                    value={formData.compagnon}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '6px'
                  }}>
                    Mois facture *
                  </label>
                  <select
                    name="mois_facture"
                    value={formData.mois_facture}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="1">Janvier</option>
                    <option value="2">Février</option>
                    <option value="3">Mars</option>
                    <option value="4">Avril</option>
                    <option value="5">Mai</option>
                    <option value="6">Juin</option>
                    <option value="7">Juillet</option>
                    <option value="8">Août</option>
                    <option value="9">Septembre</option>
                    <option value="10">Octobre</option>
                    <option value="11">Novembre</option>
                    <option value="12">Décembre</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '6px'
                  }}>
                    Statut *
                  </label>
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="a_faire">À faire</option>
                    <option value="planifie">Planifié</option>
                    <option value="fait">Fait</option>
                  </select>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '6px'
                  }}>
                    Date statut
                  </label>
                  <input
                    type="date"
                    name="date_statut"
                    value={formData.date_statut}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '6px'
                  }}>
                    Planifié le
                  </label>
                  <input
                    type="date"
                    name="planifie_le"
                    value={formData.planifie_le}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '6px'
                }}>
                  Commentaire commande
                </label>
                <textarea
                  name="commentaire_commande"
                  value={formData.commentaire_commande}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1e40af'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>

            {/* Informations financières */}
            <div style={{ gridColumn: '1 / -1' }}>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1e40af',
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '1px solid #e2e8f0'
              }}>Informations financières</h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '6px'
                  }}>
                    Total HT
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="total_ht"
                    value={formData.total_ht}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#64748b',
                    marginBottom: '6px'
                  }}>
                    Reste à payer
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="reste_a_payer"
                    value={formData.reste_a_payer}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '6px'
                }}>
                  Chiffrage
                </label>
                <textarea
                  name="chiffrage"
                  value={formData.chiffrage}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1e40af'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#64748b',
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                backgroundColor: loading ? '#94a3b8' : '#1e40af',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
