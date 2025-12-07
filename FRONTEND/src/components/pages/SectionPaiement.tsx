import React, { useState, useEffect } from 'react';
import {
    BarChart,
    PieChart,
    Pie,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    CartesianGrid
} from 'recharts';
import {
    CheckCircle,
    Euro,
    MoreVertical,
    Download,
    AlertTriangle,
    Clock,
    FileText,
    TrendingUp,
    BarChart3
} from 'lucide-react';

// Interfaces pour les paiements
interface StatsPaiements {
  total_paiements: string;
  total_dossiers_paiement: string;
  montant_total_percu: string;
  paiements_completes: string;
  paiements_partiels: string;
  paiements_acompte: string;
  paiements_annules: string;
  montant_completes: string;
  montant_partiels: string | null;
  montant_acompte: string | null;
  paiements_especes: string;
  paiements_cheque: string;
  paiements_virement: string;
  paiements_carte: string;
}

interface StatsPaiementsMensuelle {
  mois: string;
  mois_court: string;
  annee: number;
  total_paiements: number;
  montant_total: number;
  paiements_completes: number;
  paiements_partiels: number;
  paiements_acompte: number;
  montant_completes: number;
  montant_partiels: number;
  montant_acompte: number;
}

interface StatsPaiementsParStatut {
  statut: string;
  nombre_paiements: number;
  montant_total: number;
  pourcentage_nombre: number;
  pourcentage_montant: number;
}

interface StatsPaiementsParMethode {
  methode_paiement: string;
  nombre_paiements: number;
  montant_total: number;
  pourcentage_nombre: number;
  pourcentage_montant: number;
}

// Couleurs modernes
const modernColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    purple: '#8B5CF6',
    gray: '#6B7280',
    background: '#F8FAFC'
};

// Tooltip personnalisés
const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 backdrop-blur-sm">
          <p className="font-bold text-gray-900 text-sm mb-3">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-3 mb-2">
              <div 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-700 text-sm">
                {entry.name}: <span className="font-semibold">{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 backdrop-blur-sm">
                <p className="font-bold text-gray-900 text-sm">{data.name}</p>
                <p className="text-gray-700 text-sm">Nombre: <span className="font-semibold">{data.value}</span></p>
                <p className="text-xs text-gray-500 mt-1">({data.percent}% du total)</p>
            </div>
        );
    }
    return null;
};

// ChartCard moderne
const ChartCard = ({ title, children, actions, height = 320, className = '', ariaLabel }: any) => (
    <div 
        className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm ${className}`}
        role="region"
        aria-label={ariaLabel || `Graphique: ${title}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          {actions}
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div style={{ height: `${height}px` }} className="relative">
        {children}
      </div>
    </div>
);

// Composant de chargement
const LoadingSpinner = ({ message = "Chargement des données..." }) => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Clock className="w-8 h-8 animate-spin mb-3" />
        <p className="text-sm">{message}</p>
    </div>
);

// Composant pour états vides
const EmptyState = ({ message, icon: Icon = AlertTriangle }) => (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
        <Icon className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm text-center">{message}</p>
    </div>
);

// Label personnalisé pour Doughnut
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.1) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
        <text 
            x={x} 
            y={y} 
            fill="white" 
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central" 
            className="text-xs font-bold drop-shadow-sm"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// Fonction pour formater les montants
const formatMontant = (montant: number | string | null) => {
  if (montant === null || montant === undefined) return '0 Ar';
  
  const montantNumber = typeof montant === 'string' ? parseFloat(montant) : montant;
  return new Intl.NumberFormat('fr-FR').format(montantNumber) + ' Ar';
};

interface SectionPaiementProps {
  onDataUpdate?: () => void;
}

const SectionPaiement: React.FC<SectionPaiementProps> = ({ onDataUpdate }) => {
    // États pour les statistiques de paiement
    const [statsPaiements, setStatsPaiements] = useState<StatsPaiements | null>(null);
    const [statsPaiementsMensuelles, setStatsPaiementsMensuelles] = useState<StatsPaiementsMensuelle[]>([]);
    const [statsPaiementsParStatut, setStatsPaiementsParStatut] = useState<StatsPaiementsParStatut[]>([]);
    const [statsPaiementsParMethode, setStatsPaiementsParMethode] = useState<StatsPaiementsParMethode[]>([]);
    const [loadingPaiements, setLoadingPaiements] = useState(false);
    const [selectedAnneePaiements, setSelectedAnneePaiements] = useState<number>(new Date().getFullYear());
    const [error, setError] = useState<string | null>(null);

    // Fonction pour récupérer les statistiques de paiement
    const fetchStatsPaiements = async () => {
      try {
        setLoadingPaiements(true);
        setError(null);
        
        const [statsRes, mensuellesRes, statutRes, methodeRes] = await Promise.all([
          fetch('http://localhost:3000/api/gestion-paiement/stats/paiements'),
          fetch(`http://localhost:3000/api/gestion-paiement/stats/paiements/mensuelles?annee=${selectedAnneePaiements}`),
          fetch('http://localhost:3000/api/gestion-paiement/stats/paiements/statut'),
          fetch('http://localhost:3000/api/gestion-paiement/stats/paiements/methode')
        ]);

        const statsData = await statsRes.json();
        const mensuellesData = await mensuellesRes.json();
        const statutData = await statutRes.json();
        const methodeData = await methodeRes.json();

        console.log('📊 Données paiements reçues:', statsData);
        
        if (statsData.success && statsData.data.length > 0) {
          setStatsPaiements(statsData.data[0]);
        }
        if (mensuellesData.success) setStatsPaiementsMensuelles(mensuellesData.data);
        if (statutData.success) setStatsPaiementsParStatut(statutData.data);
        if (methodeData.success) setStatsPaiementsParMethode(methodeData.data);

        // Notifier le parent que les données sont mises à jour
        if (onDataUpdate) {
          onDataUpdate();
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques de paiement:", error);
        setError('Erreur de chargement des statistiques de paiement');
      } finally {
        setLoadingPaiements(false);
      }
    };

    // Recharger les données de paiement quand l'année change
    useEffect(() => {
      if (selectedAnneePaiements) {
        fetchStatsPaiements();
      }
    }, [selectedAnneePaiements]);

    // Actualisation automatique toutes les 30 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStatsPaiements();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    if (loadingPaiements) {
        return <LoadingSpinner message="Chargement des statistiques de paiement..." />;
    }

    // Préparer les données pour les graphiques
    const dataStatutChart = statsPaiementsParStatut.map(stat => ({
        name: stat.statut,
        value: stat.nombre_paiements,
        montant: stat.montant_total,
        pourcentage: stat.pourcentage_nombre,
        color: 
            stat.statut === 'Complété' ? '#10B981' :
            stat.statut === 'Partiel' ? '#F59E0B' :
            stat.statut === 'Acompte' ? '#3B82F6' :
            stat.statut === 'Annulé' ? '#EF4444' : '#6B7280'
    }));

    const dataMethodeChart = statsPaiementsParMethode.map(stat => ({
        name: stat.methode_paiement,
        value: stat.nombre_paiements,
        montant: stat.montant_total,
        pourcentage: stat.pourcentage_nombre,
        color: 
            stat.methode_paiement === 'Espèces' ? '#10B981' :
            stat.methode_paiement === 'Chèque' ? '#3B82F6' :
            stat.methode_paiement === 'Virement' ? '#8B5CF6' :
            stat.methode_paiement === 'Carte' ? '#F59E0B' : '#6B7280'
    }));

    const dataEvolutionMensuelle = statsPaiementsMensuelles.map(mois => ({
        mois: mois.mois_court,
        'Paiements Complets': mois.paiements_completes,
        'Paiements Partiels': mois.paiements_partiels,
        'Acomptes': mois.paiements_acompte,
        'Total Paiements': mois.total_paiements,
        'Montant Total': mois.montant_total
    }));

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center space-x-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold">Erreur:</span>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Indicateurs clés */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total Paiements</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {statsPaiements?.total_paiements || 0}
                            </p>
                        </div>
                        <Euro className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Montant Total</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatMontant(statsPaiements?.montant_total_percu || 0)}
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Paiements Complets</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {statsPaiements?.paiements_completes || 0}
                            </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Dossiers avec Paiement</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {statsPaiements?.total_dossiers_paiement || 0}
                            </p>
                        </div>
                        <FileText className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Évolution mensuelle */}
                <div className="xl:col-span-2">
                    <ChartCard 
                        title="Évolution Mensuelle des Paiements" 
                        height={340}
                        actions={
                            <div className="flex items-center space-x-2">
                                <select 
                                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white"
                                    value={selectedAnneePaiements}
                                    onChange={(e) => setSelectedAnneePaiements(Number(e.target.value))}
                                >
                                    {[2022, 2023, 2024, 2025].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-3 py-1">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">{selectedAnneePaiements}</span>
                                </div>
                            </div>
                        }
                    >
                        {dataEvolutionMensuelle.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dataEvolutionMensuelle} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="mois" stroke="#64748b" fontSize={11} tickMargin={10} />
                                    <YAxis stroke="#64748b" fontSize={11} />
                                    <Tooltip 
                                        formatter={(value, name) => [
                                            name === 'Montant Total' ? formatMontant(Number(value)) : value,
                                            name
                                        ]}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="Total Paiements" stroke={modernColors.primary} strokeWidth={3} dot={{ fill: modernColors.primary, r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Paiements Complets" stroke={modernColors.secondary} strokeWidth={3} dot={{ fill: modernColors.secondary, r: 4 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="Paiements Partiels" stroke={modernColors.accent} strokeWidth={3} dot={{ fill: modernColors.accent, r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState message="Aucune donnée d'évolution disponible" />
                        )}
                    </ChartCard>
                </div>

                {/* Répartition par statut */}
                <div>
                    <ChartCard 
                        title="Répartition par Statut" 
                        height={340}
                        actions={
                            <div className="flex items-center space-x-2 bg-green-50 rounded-lg px-3 py-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                    {statsPaiementsParStatut.reduce((sum, item) => sum + item.nombre_paiements, 0)}
                                </span>
                            </div>
                        }
                    >
                        {dataStatutChart.length > 0 ? (
                            <div className="flex flex-col h-full">
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={dataStatutChart} 
                                                cx="50%" 
                                                cy="50%" 
                                                labelLine={false}
                                                label={renderCustomizedLabel}
                                                outerRadius={100}
                                                innerRadius={60}
                                                fill="#8884d8" 
                                                dataKey="value"
                                            >
                                                {dataStatutChart.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value, name, props) => [
                                                    `${value} (${props.payload.pourcentage}%)`,
                                                    props.payload.name
                                                ]}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="grid grid-cols-1 gap-2">
                                        {dataStatutChart.map((entry, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                                    <span className="text-gray-700">{entry.name}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-gray-900">{entry.value}</span>
                                                    <span className="text-gray-500 text-xs">({entry.pourcentage}%)</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <EmptyState message="Aucune donnée de répartition disponible" />
                        )}
                    </ChartCard>
                </div>
            </div>

            {/* Détails supplémentaires */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Méthodes de paiement */}
                <ChartCard 
                    title="Méthodes de Paiement" 
                    height={300}
                >
                    {dataMethodeChart.length > 0 ? (
                        <div className="space-y-4">
                            {dataMethodeChart.map((methode, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: methode.color }} />
                                        <span className="text-sm font-medium text-gray-700">{methode.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-gray-900">{methode.value}</span>
                                        <span className="text-xs text-gray-500 block">
                                            {formatMontant(methode.montant)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="Aucune donnée de méthode disponible" />
                    )}
                </ChartCard>

                {/* Résumé financier */}
                <ChartCard 
                    title="Résumé Financier" 
                    height={300}
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-700">Montant Complets</span>
                            <span className="text-lg font-bold text-green-600">
                                {formatMontant(statsPaiements?.montant_completes || 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-700">Montant Partiels</span>
                            <span className="text-lg font-bold text-orange-600">
                                {formatMontant(statsPaiements?.montant_partiels || 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-700">Montant Acomptes</span>
                            <span className="text-lg font-bold text-blue-600">
                                {formatMontant(statsPaiements?.montant_acompte || 0)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">Total Perçu</span>
                            <span className="text-lg font-bold text-gray-900">
                                {formatMontant(statsPaiements?.montant_total_percu || 0)}
                            </span>
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    );
};

export default SectionPaiement;