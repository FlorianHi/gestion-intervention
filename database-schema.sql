-- Create the interventions table
CREATE TABLE interventions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actif BOOLEAN DEFAULT true NOT NULL,
    mois_facture INTEGER NOT NULL CHECK (mois_facture >= 1 AND mois_facture <= 12),
    statut TEXT NOT NULL CHECK (statut IN ('a_faire', 'planifie', 'fait')) DEFAULT 'a_faire',
    date_statut DATE,
    planifie_le DATE,
    equiv DECIMAL(10,2),
    nom_client TEXT NOT NULL,
    adresse_intervention TEXT,
    ville TEXT,
    code_postal TEXT,
    mail_client TEXT,
    commentaire_commande TEXT,
    adresse_facturation TEXT,
    mail_facturation TEXT,
    chiffrage TEXT,
    total_ht DECIMAL(10,2),
    reste_a_payer DECIMAL(10,2),
    compagnon TEXT,
    affaire TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_interventions_statut ON interventions(statut);
CREATE INDEX idx_interventions_mois_facture ON interventions(mois_facture);
CREATE INDEX idx_interventions_compagnon ON interventions(compagnon);
CREATE INDEX idx_interventions_nom_client ON interventions(nom_client);
CREATE INDEX idx_interventions_ville ON interventions(ville);
CREATE INDEX idx_interventions_updated_at ON interventions(updated_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_interventions_updated_at 
    BEFORE UPDATE ON interventions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- You can modify this policy based on your specific security requirements
CREATE POLICY "Users can manage their own interventions" ON interventions
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data (optional - you can remove this in production)
INSERT INTO interventions (
    nom_client, 
    adresse_intervention, 
    ville, 
    code_postal, 
    mail_client, 
    mois_facture, 
    statut, 
    total_ht, 
    compagnon, 
    affaire
) VALUES 
(
    'Client Test 1',
    '123 rue de la République',
    'Paris',
    '75001',
    'client1@example.com',
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    'a_faire',
    1500.00,
    'Technicien A',
    'AFF001'
),
(
    'Client Test 2',
    '456 avenue des Champs-Élysées',
    'Paris',
    '75008',
    'client2@example.com',
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    'planifie',
    2300.50,
    'Technicien B',
    'AFF002'
),
(
    'Client Test 3',
    '789 boulevard Saint-Germain',
    'Lyon',
    '69000',
    'client3@example.com',
    EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
    'fait',
    890.00,
    'Technicien A',
    'AFF003'
);
