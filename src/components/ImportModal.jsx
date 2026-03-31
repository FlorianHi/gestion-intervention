import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { X, Upload, FileText } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function ImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [columnMapping, setColumnMapping] = useState({})
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const expectedColumns = [
    { key: 'nom_client', label: 'Nom Client' },
    { key: 'adresse_intervention', label: 'Adresse Intervention' },
    { key: 'ville', label: 'Ville' },
    { key: 'code_postal', label: 'Code Postal' },
    { key: 'mail_client', label: 'Mail Client' },
    { key: 'commentaire_commande', label: 'Commentaire' },
    { key: 'chiffrage', label: 'Chiffrage' },
    { key: 'statut', label: 'Statut' },
    { key: 'planifie_le', label: 'Planifié le' },
    { key: 'mois_facture', label: 'Mois Facture' },
    { key: 'total_ht', label: 'Total HT' },
    { key: 'reste_a_payer', label: 'Reste à Payer' }
  ]

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    console.log(' Fichier sélectionné:', selectedFile.name, selectedFile.size, 'octets')

    if (!selectedFile.name.endsWith('.xlsx')) {
      console.error(' Format de fichier invalide:', selectedFile.name)
      toast.error('Veuillez sélectionner un fichier Excel (.xlsx)')
      return
    }

    setFile(selectedFile)
    setLoading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        console.log(' Début de la lecture du fichier...')
        const data = new Uint8Array(e.target.result)
        console.log(' Taille des données lues:', data.length, 'octets')
        
        const workbook = XLSX.read(data, { type: 'array' })
        console.log(' Workbook lu:', workbook.SheetNames.length, 'feuilles')
        console.log(' Noms des feuilles:', workbook.SheetNames)
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        
        console.log(' Données brutes:', jsonData.length, 'lignes totales')
        
        if (jsonData.length === 0) {
          console.error(' Fichier vide')
          toast.error('Le fichier est vide')
          return
        }

        const headers = jsonData[0]
        console.log(' En-têtes détectés:', headers)
        
        const previewData = jsonData.slice(1, 6).map((row, index) => {
          const obj = {}
          headers.forEach((header, headerIndex) => {
            obj[header] = row[headerIndex] || ''
          })
          console.log(` Ligne aperçu ${index + 1}:`, obj)
          return obj
        })

        setPreview(previewData)
        
        // Auto-map columns if possible
        const autoMapping = {}
        headers.forEach(header => {
          const matchedColumn = expectedColumns.find(col => 
            col.label.toLowerCase() === header?.toLowerCase() ||
            col.key.toLowerCase() === header?.toLowerCase()
          )
          if (matchedColumn) {
            autoMapping[matchedColumn.key] = header
            console.log(` Auto-mapping: ${matchedColumn.key} → ${header}`)
          }
        })
        
        console.log(' Mapping automatique:', autoMapping)
        setColumnMapping(autoMapping)
        setStep(2)
        
        console.log(' Fichier traité avec succès')
      } catch (error) {
        console.error(' Erreur lors de la lecture du fichier:', error)
        console.error(' Stack trace:', error.stack)
        toast.error('Erreur lors de la lecture du fichier')
      } finally {
        setLoading(false)
      }
    }
    
    reader.onerror = (error) => {
      console.error(' Erreur FileReader:', error)
      toast.error('Erreur lors de la lecture du fichier')
      setLoading(false)
    }
    
    reader.readAsArrayBuffer(selectedFile)
  }

  const handleMappingChange = (dbColumn, excelColumn) => {
    setColumnMapping(prev => ({
      ...prev,
      [dbColumn]: excelColumn
    }))
  }

  const handleImport = async () => {
    setLoading(true)
    setStep(3)

    try {
      console.log('🔍 Début de l\'importation...')
      console.log('📁 Fichier:', file)
      console.log('🗺️ Mapping:', columnMapping)

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          console.log('📖 Lecture du fichier Excel...')
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)

          console.log('📊 Données brutes lues:', jsonData.length, 'lignes')
          console.log('📋 Exemple de ligne brute:', jsonData[0])

          const interventions = jsonData.map((row, index) => {
            try {
              const mapped = {}
              Object.entries(columnMapping).forEach(([dbColumn, excelColumn]) => {
                mapped[dbColumn] = row[excelColumn]
              })

              console.log(`🔄 Mapping ligne ${index + 1}:`, mapped)

              // Apply defaults for required fields
              if (!mapped.statut || mapped.statut === '' || mapped.statut === null) {
                mapped.statut = 'a_faire'
                console.log(`🎯 Statut par défaut appliqué ligne ${index + 1}: a_faire`)
              }
              
              if (!mapped.actif || mapped.actif === '' || mapped.actif === null) {
                mapped.actif = true
                console.log(`🎯 Actif par défaut appliqué ligne ${index + 1}: true`)
              }
              
              if (!mapped.mois_facture || mapped.mois_facture === '' || mapped.mois_facture === null) {
                mapped.mois_facture = 0
                console.log(`🎯 Mois facture par défaut appliqué ligne ${index + 1}: 0`)
              }

              // Convert boolean and numeric fields
              mapped.actif = mapped.actif === true || mapped.actif === 'TRUE' || mapped.actif === 'true'
              mapped.mois_facture = parseInt(mapped.mois_facture) || 0
              mapped.equiv = parseFloat(mapped.equiv) || null
              mapped.total_ht = parseFloat(mapped.total_ht) || null
              mapped.reste_a_payer = parseFloat(mapped.reste_a_payer) || null
              
              // Format dates
              if (mapped.planifie_le) {
                const planifieDate = new Date(mapped.planifie_le)
                if (!isNaN(planifieDate.getTime())) {
                  mapped.planifie_le = planifieDate.toISOString().split('T')[0]
                } else {
                  console.warn(`⚠️ Date planifié_le invalide ligne ${index + 1}:`, mapped.planifie_le)
                  mapped.planifie_le = null
                }
              }
              if (mapped.date_statut) {
                const statutDate = new Date(mapped.date_statut)
                if (!isNaN(statutDate.getTime())) {
                  mapped.date_statut = statutDate.toISOString().split('T')[0]
                } else {
                  console.warn(`⚠️ Date date_statut invalide ligne ${index + 1}:`, mapped.date_statut)
                  mapped.date_statut = null
                }
              }

              mapped.created_at = new Date().toISOString()
              mapped.updated_at = new Date().toISOString()

              console.log(`✅ Ligne ${index + 1} mappée:`, mapped)
              return mapped
            } catch (error) {
              console.error(`❌ Erreur mapping ligne ${index + 1}:`, error)
              console.error(`📄 Ligne problématique:`, row)
              throw error
            }
          })

          console.log('📋 Données finales à insérer:', interventions.length, 'interventions')
          console.log('📄 Exemple de donnée finale:', interventions[0])

          // Insert by batches of 100
          console.log('💾 Insertion par lots de 100 dans Supabase...')
          const batchSize = 100
          const batches = []
          
          for (let i = 0; i < interventions.length; i += batchSize) {
            batches.push(interventions.slice(i, i + batchSize))
          }
          
          console.log(`📦 ${batches.length} lots à insérer (${batchSize} lignes par lot)`)
          
          let totalInserted = 0
          let allErrors = []
          
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex]
            console.log(`📦 Insertion lot ${batchIndex + 1}/${batches.length} (${batch.length} lignes)`)
            
            try {
              const { data: insertedData, error } = await supabase
                .from('interventions')
                .insert(batch)

              if (error) {
                console.error(`❌ Erreur lot ${batchIndex + 1}:`, error)
                allErrors.push({ batch: batchIndex + 1, error: error.message })
                throw error
              }
              
              totalInserted += batch.length
              console.log(`✅ Lot ${batchIndex + 1} inséré: ${batch.length} lignes`)
              
            } catch (error) {
              console.error(`❌ Erreur lors de l'insertion du lot ${batchIndex + 1}:`, error)
              allErrors.push({ batch: batchIndex + 1, error: error.message })
              
              // Continue with next batch instead of failing completely
              if (batchIndex === batches.length - 1) {
                // Last batch, show final error
                throw new Error(`Erreur lors de l'importation: ${allErrors.length} lot(s) en erreur. Dernière erreur: ${error.message}`)
              }
            }
          }

          if (allErrors.length > 0) {
            console.warn(`⚠️ ${allErrors.length} lot(s) ont échoué sur ${batches.length} total`)
            console.warn('📄 Détails des erreurs:', allErrors)
            toast.warning(`${totalInserted} interventions importées avec succès, ${allErrors.length} lot(s) en erreur`)
          } else {
            console.log('✅ Tous les lots insérés avec succès')
            toast.success(`${totalInserted} interventions importées avec succès`)
          }

          onSuccess()
        } catch (error) {
          console.error('❌ Erreur lors de l\'importation:', error)
          console.error('📄 Stack trace:', error.stack)
          toast.error(`Erreur lors de l'importation: ${error.message}`)
        } finally {
          setLoading(false)
        }
      }
      
      reader.onerror = (error) => {
        console.error('❌ Erreur lecture fichier:', error)
        toast.error('Erreur lors de la lecture du fichier')
        setLoading(false)
      }
      
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('❌ Erreur générale import:', error)
      toast.error(`Erreur: ${error.message}`)
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
        width: '800px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
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
            color: '#1e293b'
          }}>
            Importer des interventions
          </h3>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#f1f5f9',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#e2e8f0'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f1f5f9'}
          >
            <X size={16} color="#64748b" />
          </button>
        </div>

        {/* Step 1: File Selection */}
        {step === 1 && (
          <div>
            <div style={{
              border: '2px dashed #e2e8f0',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <Upload size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '8px'
              }}>
                Sélectionnez un fichier Excel
              </h4>
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '24px'
              }}>
                Format .xlsx uniquement
              </p>
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label
                htmlFor="file-input"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#1e40af',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#1e3a8a'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#1e40af'}
              >
                <FileText size={16} style={{ marginRight: '8px' }} />
                Choisir un fichier
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Preview and Mapping */}
        {step === 2 && (
          <div>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              Aperçu et mapping des colonnes
            </h4>

            {/* Preview Table */}
            <div style={{
              marginBottom: '24px',
              overflow: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    {Object.keys(preview[0] || {}).map(header => (
                      <th key={header} style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#64748b',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} style={{
                          padding: '12px',
                          fontSize: '14px',
                          color: '#475569',
                          borderBottom: '1px solid #f1f5f9'
                        }}>
                          {value || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Column Mapping */}
            <div style={{ marginBottom: '24px' }}>
              <h5 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1e293b',
                marginBottom: '12px'
              }}>
                Mapping des colonnes
              </h5>
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {expectedColumns.map(column => (
                  <div key={column.key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    <label style={{
                      flex: '0 0 150px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      {column.label}:
                    </label>
                    <select
                      value={columnMapping[column.key] || ''}
                      onChange={(e) => handleMappingChange(column.key, e.target.value)}
                      style={{
                        flex: '1',
                        padding: '6px 8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">-- Non mappé --</option>
                      {Object.keys(preview[0] || {}).map(header => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#64748b',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Retour
              </button>
              <button
                onClick={handleImport}
                disabled={Object.keys(columnMapping).length === 0}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: Object.keys(columnMapping).length > 0 ? '#16a34a' : '#94a3b8',
                  cursor: Object.keys(columnMapping).length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Importer
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Import Progress */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            {loading ? (
              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid #e2e8f0',
                  borderTop: '4px solid #1e40af',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }}></div>
                <p style={{ fontSize: '16px', color: '#64748b' }}>
                  Importation en cours...
                </p>
              </div>
            ) : (
              <div>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <span style={{ fontSize: '24px', color: '#16a34a' }}>✓</span>
                </div>
                <p style={{ fontSize: '16px', color: '#64748b' }}>
                  Importation terminée avec succès
                </p>
                <button
                  onClick={onClose}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'white',
                    backgroundColor: '#1e40af',
                    cursor: 'pointer'
                  }}
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
