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
    MapPin,
    TrendingUp,
    Building,
    Users,
    BarChart3,
    RefreshCw,
    Eye,
    User,
    CalendarDays,
    ArrowRight
} from 'lucide-react';

// Import du composant SectionPaiement
import SectionPaiement from './SectionPaiement';
import SectionFT from './SectionFT';

// Interfaces
interface ChartData { name: string; value: number; }
interface DescenteData {
    id: string;
    commune: string;
    details: any;
    date?: string;
    statut?: string;
}

interface RecentItem {
    id: string;
    type: 'descente' | 'ft' | 'ap' | 'paiement';
    commune: string;
    date: string;
    statut: string;
    agent?: string;
    montant?: string;
}

interface DescenteParMois {
    mois: string;
    mois_court: string;
    mois_complet: string;
    annee: number;
    nombre_descentes: number;
    non_traitees: number;
    en_attente_avis: number;
    en_attente_paiement: number;
    completees: number;
}

// Interface pour les statistiques par étape
interface StatistiquesEtape {
    en_attente_ft: number;
    en_attente_ap: number;
    en_attente_paiement: number;
    finalises: number;
    total_descentes: number;
}

type ContentView = 'DescenteSurTerrain' | 'DemandeFN' | 'DemandePC' | 'AutorisationCamion';

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
const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 backdrop-blur-sm">
          <p className="font-bold text-gray-900 text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-gray-700 text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span> dossiers
            </p>
          ))}
        </div>
      );
    }
    return null;
};

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
                <p className="font-bold text-gray-900 text-sm">Zone: {data.name}</p>
                <p className="text-gray-700 text-sm">Descentes: <span className="font-semibold">{data.value}</span></p>
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

// Liste des communes CUA
const communesCUA = [
    'ANTANANARIVO', 'ANTSAHABE', 'ANALAKELY', 'ISORAKA', 'AMBOHIDRATRIMO',
    'ANDRAHANJO', 'ANOSIZATO', 'IVATO', 'AMBOHIMANARINA', 'ANKADIFOTSY',
    'AMBOHIMANAMBOLA', 'ANKORONDRANO', 'ANOSY', 'MAHAMASINA', 'AMBOHIJATOVO',
    'ANALAMAHITSY', 'AMBOHIDAPITSO', 'ANKADINANDRIANA', 'AMBOHIDRABIBY',
    'ANTANETIBE', 'AMBATOFOTSY', 'ALASORA', 'AMBOHIMANGA', 'AMBOHITRIMANJAKA'
];

const Dashboard: React.FC = () => {
    const [descentesParMois, setDescentesParMois] = useState<DescenteParMois[]>([]);
    const [loadingDescentes, setLoadingDescentes] = useState(false);
    const [activeView, setActiveView] = useState<ContentView>('DescenteSurTerrain');
    const [descentesData, setDescentesData] = useState<DescenteData[]>([]);
    const [selectedAnnee, setSelectedAnnee] = useState<number>(new Date().getFullYear());
    const [anneesDisponibles, setAnneesDisponibles] = useState<number[]>([]);

    // États pour les erreurs
    const [errors, setErrors] = useState({
        stats: null as string | null,
        communes: null as string | null,
        evolution: null as string | null,
        data: null as string | null,
        descentesParMois: null as string | null,
        etapes: null as string | null
    });

    // États pour les statistiques
    const [statsDescentes, setStatsDescentes] = useState({
        totalDescentes: 0,
        ftEtablis: 0,
        avisEmis: 0,
        paiementsComplets: 0,
        enAttenteFT: 0,
        enAttenteAvis: 0,
        enAttentePaiement: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    // Données pour les graphiques
    const [communesData, setCommunesData] = useState<any[]>([]);
    const [loadingCommunes, setLoadingCommunes] = useState(false);
    const [progressionData, setProgressionData] = useState<any[]>([]);
    const [evolutionMensuelleData, setEvolutionMensuelleData] = useState<any[]>([]);
    const [loadingEvolution, setLoadingEvolution] = useState(false);

    // Nouvelles données pour les statistiques par étape
    const [statsEtapes, setStatsEtapes] = useState<StatistiquesEtape | null>(null);
    const [loadingEtapes, setLoadingEtapes] = useState(false);

    // Fonction pour classifier les communes
    const classifierCommune = (commune: string): string => {
        if (!commune) return 'Non spécifié';
        const communeUpper = commune.toUpperCase().trim();
        
        if (communesCUA.some(cua => communeUpper.includes(cua) || cua.includes(communeUpper))) {
            return 'CUA';
        }
        return 'Périphérique';
    };

    // Fonction d'export de données
    const exportData = (format = 'csv') => {
        const dataToExport = descentesData.map(item => ({
            Commune: item.commune,
            Date: item.date || 'N/A',
            Statut: item.statut || 'Non spécifié',
            'FT Établi': item.details?.ft_id ? 'Oui' : 'Non',
            'AP Émis': item.details?.avis_id ? 'Oui' : 'Non',
            'Paiement Complet': item.details?.paiement_id ? 'Oui' : 'Non'
        }));

        if (format === 'csv') {
            const headers = Object.keys(dataToExport[0] || {}).join(',');
            const csvContent = dataToExport.map(row => 
                Object.values(row).map(value => `"${value}"`).join(',')
            ).join('\n');
            
            const fullCsv = [headers, csvContent].join('\n');
            const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + fullCsv);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Fonction pour récupérer les statistiques par étape
    const fetchStatsEtapes = async () => {
        try {
            setLoadingEtapes(true);
            
            // Récupérer uniquement les statistiques par étape simples
            const response = await fetch("http://localhost:3000/api/nouvelle-descente/statistiques/etapes");
            
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

            const data = await response.json();

            if (data.success) {
                setStatsEtapes(data.data);
                setErrors(prev => ({...prev, etapes: null}));
            }
        } catch (error) {
            console.error("Erreur lors du chargement des statistiques par étape:", error);
            setErrors(prev => ({...prev, etapes: 'Erreur de chargement des statistiques par étape'}));
            
            // Données de démonstration en cas d'erreur
            setStatsEtapes({
                en_attente_ft: 3,
                en_attente_ap: 6,
                en_attente_paiement: 0,
                finalises: 3,
                total_descentes: 12
            });
        } finally {
            setLoadingEtapes(false);
        }
    };

    // Fonction pour récupérer les descentes par mois depuis l'API
    const fetchDescentesParMois = async (annee: number) => {
        try {
            setLoadingEvolution(true);
            const response = await fetch(`http://localhost:3000/api/nouvelle-descente/statistiques/mensuelles?annee=${annee}`);
            
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
                // Transformer les données pour le format attendu par le graphique
                const formattedData = data.data.map((item: DescenteParMois) => ({
                    mois: item.mois_court,
                    name: `${item.mois_court} ${item.annee}`,
                    Descentes: item.nombre_descentes,
                    'FT Établis': item.nombre_descentes - item.non_traitees,
                    'AP Émis': item.completees + item.en_attente_paiement + item.en_attente_avis,
                    'Paiements Complets': item.completees,
                    'Non traitées': item.non_traitees,
                    'En attente avis': item.en_attente_avis,
                    'En attente paiement': item.en_attente_paiement,
                    'Complétées': item.completees
                }));

                setEvolutionMensuelleData(formattedData);
                setDescentesParMois(data.data);
                setErrors(prev => ({...prev, evolution: null, descentesParMois: null}));
            }
        } catch (error) {
            console.error("Erreur lors du chargement des descentes par mois:", error);
            setErrors(prev => ({...prev, descentesParMois: 'Erreur de chargement des données mensuelles'}));
            // Générer des données simulées en cas d'erreur
            generateEvolutionMensuelle();
        } finally {
            setLoadingEvolution(false);
        }
    };

    // Fonction pour récupérer les années disponibles
    const fetchAnneesDisponibles = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/nouvelle-descente/statistiques/annees");
            if (response.ok) {
                const data = await response.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    const annees = data.data.sort((a: number, b: number) => b - a); // Tri décroissant
                    setAnneesDisponibles(annees);
                    setSelectedAnnee(annees[0]); // Sélectionner la première année (la plus récente)
                }
            }
        } catch (error) {
            console.error("Erreur lors du chargement des années:", error);
            // Années par défaut en cas d'erreur
            setAnneesDisponibles([2022, 2023, 2024, 2025]);
        }
    };

    // Récupérer les données des descentes
    const fetchDescentesData = async () => {
        try {
            setLoadingDescentes(true);
            const response = await fetch("http://localhost:3000/api/nouvelle-descente/carte/descentes");
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
                const descentes: DescenteData[] = data.data.map((item: any) => ({
                    ...item,
                    statut: item.details?.paiement_id ? 'complet' : 
                           item.details?.avis_id ? 'en_cours' : 
                           item.details?.ft_id ? 'en_attente' : 'non_traité'
                }));
                
                setDescentesData(descentes);
                setErrors(prev => ({...prev, data: null}));
            }
        } catch (error) {
            console.error("Erreur lors du chargement des données:", error);
            setErrors(prev => ({...prev, data: 'Erreur de chargement des données'}));
        } finally {
            setLoadingDescentes(false);
        }
    };

    // Récupérer les données des communes
    const fetchCommunesData = async () => {
        try {
            setLoadingCommunes(true);
            const response = await fetch("http://localhost:3000/api/nouvelle-descente/carte/descentes");
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
                const descentes: DescenteData[] = data.data;
                const compteurZones = { 'CUA': 0, 'Périphérique': 0, 'Non spécifié': 0 };

                descentes.forEach((descente: DescenteData) => {
                    const typeZone = classifierCommune(descente.commune);
                    compteurZones[typeZone as keyof typeof compteurZones]++;
                });

                const totalDescentes = descentes.length;
                const pieChartData = [
                    { 
                        name: 'CUA', 
                        value: compteurZones.CUA, 
                        percent: totalDescentes > 0 ? ((compteurZones.CUA / totalDescentes) * 100).toFixed(1) : '0.0', 
                        color: modernColors.primary 
                    },
                    { 
                        name: 'Périphérique', 
                        value: compteurZones['Périphérique'], 
                        percent: totalDescentes > 0 ? ((compteurZones['Périphérique'] / totalDescentes) * 100).toFixed(1) : '0.0', 
                        color: modernColors.secondary 
                    },
                    { 
                        name: 'Non spécifié', 
                        value: compteurZones['Non spécifié'], 
                        percent: totalDescentes > 0 ? ((compteurZones['Non spécifié'] / totalDescentes) * 100).toFixed(1) : '0.0', 
                        color: modernColors.gray 
                    }
                ];

                setCommunesData(pieChartData);
                setErrors(prev => ({...prev, communes: null}));
            }
        } catch (error) {
            console.error("Erreur lors du chargement des données des communes:", error);
            setErrors(prev => ({...prev, communes: 'Erreur de chargement des données des communes'}));
            setCommunesData([]);
        } finally {
            setLoadingCommunes(false);
        }
    };

    // Récupérer les statistiques de descentes
    const fetchStatsDescentes = async () => {
        try {
            setLoadingStats(true);
            const response = await fetch("http://localhost:3000/api/nouvelle-descente/carte/descentes");
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            
            const data = await response.json();
            
            if (data.success && Array.isArray(data.data)) {
                const descentes = data.data;
                const totalDescentes = descentes.length;
                const ftEtablis = descentes.filter((d: any) => d.details?.ft_id).length;
                const avisEmis = descentes.filter((d: any) => d.details?.avis_id).length;
                const paiementsComplets = descentes.filter((d: any) => 
                    d.details?.ft_id && d.details?.avis_id && d.details?.paiement_id
                ).length;

                setStatsDescentes({
                    totalDescentes,
                    ftEtablis,
                    avisEmis,
                    paiementsComplets,
                    enAttenteFT: totalDescentes - ftEtablis,
                    enAttenteAvis: ftEtablis - avisEmis,
                    enAttentePaiement: avisEmis - paiementsComplets
                });

                setProgressionData([{
                    name: 'Progression Administrative',
                    'Descentes Effectuées': totalDescentes,
                    'FT Établis': ftEtablis,
                    'AP Émis': avisEmis,
                    'Paiements Complets': paiementsComplets
                }]);

                setErrors(prev => ({...prev, stats: null}));
            }
        } catch (error) {
            console.error("Erreur lors du chargement des statistiques de descentes:", error);
            setErrors(prev => ({...prev, stats: 'Erreur de chargement des statistiques'}));
            // Données statiques pour les stats
            setStatsDescentes({ 
                totalDescentes: 45, 
                ftEtablis: 32, 
                avisEmis: 28, 
                paiementsComplets: 25,
                enAttenteFT: 13,
                enAttenteAvis: 4,
                enAttentePaiement: 3
            });
            setProgressionData([{
                name: 'Progression Administrative',
                'Descentes Effectuées': 45,
                'FT Établis': 32,
                'AP Émis': 28,
                'Paiements Complets': 25
            }]);
        } finally {
            setLoadingStats(false);
        }
    };

    // Générer des données simulées pour l'évolution mensuelle (fallback)
    const generateEvolutionMensuelle = () => {
        const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        const simulatedData = mois.map((mois, index) => ({
            mois,
            name: `${mois} ${selectedAnnee}`,
            Descentes: Math.floor(10 + (index * 3) + Math.random() * 10),
            'FT Établis': Math.floor((10 + (index * 3)) * 0.8 + Math.random() * 8),
            'AP Émis': Math.floor((10 + (index * 3)) * 0.6 + Math.random() * 6),
            'Paiements Complets': Math.floor((10 + (index * 3)) * 0.4 + Math.random() * 4)
        }));
        setEvolutionMensuelleData(simulatedData);
        setErrors(prev => ({...prev, evolution: null}));
    };

    // Fonction pour actualiser toutes les données
    const refreshAllData = () => {
        fetchStatsDescentes();
        fetchCommunesData();
        fetchDescentesData();
        fetchDescentesParMois(selectedAnnee);
        fetchStatsEtapes();
    };

    // StatsCard moderne
    const stats = [
        { 
            title: 'Total Descentes', 
            value: loadingStats ? '...' : statsDescentes.totalDescentes.toString(), 
            icon: MapPin, 
            color: 'blue', 
            change: '+5%', 
            view: 'DescenteSurTerrain' as ContentView,
            description: 'Descentes effectuées',
            gradient: 'from-blue-500 to-blue-600'
        },
        { 
            title: 'FT Établis', 
            value: loadingStats ? '...' : statsDescentes.ftEtablis.toString(), 
            icon: FileText, 
            color: 'green', 
            change: '+8%', 
            view: 'DemandeFN' as ContentView,
            description: 'Section Fiches Techniques',
            gradient: 'from-green-500 to-green-600'
        },
        { 
            title: 'AP Émis', 
            value: loadingStats ? '...' : statsDescentes.avisEmis.toString(), 
            icon: CheckCircle, 
            color: 'orange', 
            change: '+12%', 
            view: 'DemandePC' as ContentView,
            description: 'Avis techniques émis',
            gradient: 'from-orange-500 to-orange-600'
        },
        { 
            title: 'Paiements Complets', 
            value: loadingStats ? '...' : statsDescentes.paiementsComplets.toString(), 
            icon: Euro, 
            color: 'purple', 
            change: '+23%', 
            view: 'AutorisationCamion' as ContentView,
            description: 'Dossiers finalisés',
            gradient: 'from-purple-500 to-purple-600'
        }
    ];

    const StatsCard = ({ title, value, icon: Icon, color, change, view, description, gradient }: any) => (
        <div 
            className={`bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:scale-105 ${
                activeView === view ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:border-gray-200'
            }`}
            onClick={() => setActiveView(view)}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
                    <p className="text-xs text-gray-500 mb-3">{description}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        change.includes('+') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {change}
                    </span>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm group-hover:shadow-md transition-shadow`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <button 
                className="mt-4 text-blue-600 text-sm font-semibold hover:text-blue-800 focus:outline-none flex items-center group-hover:translate-x-1 transition-transform"
                onClick={(e) => { e.stopPropagation(); setActiveView(view); }}
            >
                Voir détails 
                <TrendingUp className="w-4 h-4 ml-1" />
            </button>
        </div>
    );

    // Composant pour afficher les détails par étape avec les nouvelles données
    const renderDetailsParEtape = () => {
        if (loadingEtapes) {
            return <LoadingSpinner message="Chargement des détails par étape..." />;
        }

        return (
            <div className="space-y-4">
                {/* Section simple avec les 4 indicateurs */}
                <div className="grid grid-cols-2 gap-4">
                    {/* En attente FT */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {statsEtapes?.en_attente_ft || 0}
                        </div>
                        <div className="text-sm font-medium text-orange-800 mt-1">
                            En attente FT
                        </div>
                    </div>

                    {/* En attente AP */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {statsEtapes?.en_attente_ap || 0}
                        </div>
                        <div className="text-sm font-medium text-blue-800 mt-1">
                            En attente AP
                        </div>
                    </div>

                    {/* En attente paiement */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {statsEtapes?.en_attente_paiement || 0}
                        </div>
                        <div className="text-sm font-medium text-purple-800 mt-1">
                            En attente paiement
                        </div>
                    </div>

                    {/* Finalisés */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {statsEtapes?.finalises || 0}
                        </div>
                        <div className="text-sm font-medium text-green-800 mt-1">
                            Finalisés
                        </div>
                    </div>
                </div>

                {/* Total des descentes */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                    <div className="text-lg font-semibold text-gray-700">
                        Total des descentes: <span className="text-gray-900">{statsEtapes?.total_descentes || 0}</span>
                    </div>
                </div>
            </div>
        );
    };

    // Charger les données au montage
    useEffect(() => {
        refreshAllData();
        fetchAnneesDisponibles();
    }, []);

    // Recharger les données quand l'année change
    useEffect(() => {
        if (selectedAnnee) {
            fetchDescentesParMois(selectedAnnee);
        }
    }, [selectedAnnee]);

    // Actualisation automatique toutes les 30 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStatsDescentes();
            fetchStatsEtapes();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    // Render content view
    const renderContentView = (view: ContentView) => {
        if (view === 'DescenteSurTerrain') {
            return (
                <div className="space-y-6">
                    {/* Première ligne : Graphiques principaux */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Line Chart avec sélecteur d'année */}
                        <div className="xl:col-span-2">
                            <ChartCard 
                                title="Évolution Mensuelle des Indicateurs" 
                                height={340}
                                actions={
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                            onClick={exportData}
                                        >
                                            <Download className="w-4 h-4" />
                                            <span>Exporter</span>
                                        </button>
                                        <div className="flex items-center space-x-2">
                                            <select 
                                                className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white"
                                                value={selectedAnnee}
                                                onChange={(e) => setSelectedAnnee(Number(e.target.value))}
                                            >
                                                {anneesDisponibles.map(year => (
                                                    <option key={year} value={year}>
                                                        {year}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-3 py-1">
                                                <TrendingUp className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm font-medium text-blue-700">{selectedAnnee}</span>
                                            </div>
                                        </div>
                                    </div>
                                }
                            >
                                {loadingEvolution ? (
                                    <LoadingSpinner message="Chargement de l'évolution mensuelle..." />
                                ) : evolutionMensuelleData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={evolutionMensuelleData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                            <XAxis dataKey="mois" stroke="#64748b" fontSize={11} tickMargin={10} />
                                            <YAxis stroke="#64748b" fontSize={11} />
                                            <Tooltip content={<CustomLineTooltip />} />
                                            <Legend />
                                            <Line type="monotone" dataKey="Descentes" stroke={modernColors.primary} strokeWidth={3} dot={{ fill: modernColors.primary, r: 4 }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="FT Établis" stroke={modernColors.secondary} strokeWidth={3} dot={{ fill: modernColors.secondary, r: 4 }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="AP Émis" stroke={modernColors.accent} strokeWidth={3} dot={{ fill: modernColors.accent, r: 4 }} activeDot={{ r: 6 }} />
                                            <Line type="monotone" dataKey="Paiements Complets" stroke={modernColors.purple} strokeWidth={3} dot={{ fill: modernColors.purple, r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyState message="Aucune donnée d'évolution disponible" />
                                )}
                            </ChartCard>
                        </div>

                        {/* Doughnut Chart avec légendes en bas */}
                        <div>
                            <ChartCard 
                                title="Répartition par Zone" 
                                height={340}
                                actions={
                                    <div className="flex items-center space-x-2 bg-green-50 rounded-lg px-3 py-1">
                                        <Building className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-700">
                                            {communesData.reduce((sum, item) => sum + item.value, 0)}
                                        </span>
                                    </div>
                                }
                            >
                                {loadingCommunes ? (
                                    <LoadingSpinner message="Chargement des zones..." />
                                ) : communesData.length > 0 ? (
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie 
                                                        data={communesData} 
                                                        cx="50%" 
                                                        cy="50%" 
                                                        labelLine={false}
                                                        label={renderCustomizedLabel}
                                                        outerRadius={100}
                                                        innerRadius={60}
                                                        fill="#8884d8" 
                                                        dataKey="value"
                                                    >
                                                        {communesData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomPieTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Légendes en bas */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-1 gap-2">
                                                {communesData.map((entry, index) => (
                                                    <div key={index} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <div 
                                                                className="w-3 h-3 rounded-full" 
                                                                style={{ backgroundColor: entry.color }}
                                                            />
                                                            <span className="text-gray-700">{entry.name}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-semibold text-gray-900">{entry.value}</span>
                                                            <span className="text-gray-500 text-xs">({entry.percent}%)</span>
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

                    {/* Deuxième ligne : Graphiques secondaires */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bar Chart Progression */}
                        <ChartCard 
                            title="Progression Administrative" 
                            height={300}
                            actions={
                                <div className="flex items-center space-x-2 bg-purple-50 rounded-lg px-3 py-1">
                                    <BarChart3 className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-700">
                                        {statsDescentes.totalDescentes} total
                                    </span>
                                </div>
                            }
                        >
                            {loadingStats ? (
                                <LoadingSpinner message="Chargement de la progression..." />
                            ) : progressionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={progressionData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                                        <YAxis stroke="#64748b" fontSize={11} />
                                        <Tooltip content={<CustomBarTooltip />} />
                                        <Legend />
                                        <Bar dataKey="Descentes Effectuées" fill={modernColors.primary} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="FT Établis" fill={modernColors.secondary} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="AP Émis" fill={modernColors.accent} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Paiements Complets" fill={modernColors.purple} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState message="Aucune donnée de progression disponible" />
                            )}
                        </ChartCard>

                        {/* Stats par étape - MODIFIÉ pour utiliser les nouvelles données */}
                        <ChartCard 
                            title="Détails par Étape" 
                            height={300}
                            actions={
                                <div className="flex items-center space-x-2 bg-orange-50 rounded-lg px-3 py-1">
                                    <Users className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm font-medium text-orange-700">Détails</span>
                                </div>
                            }
                        >
                            {renderDetailsParEtape()}
                        </ChartCard>
                    </div>
                </div>
            );
        } else if (view === 'AutorisationCamion') {
            return <SectionPaiement onDataUpdate={refreshAllData} />;
        } else if (view === 'DemandeFN') {
            return <SectionFT onDataUpdate={refreshAllData} />;
        }

        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center h-96 flex items-center justify-center">
                <EmptyState 
                    message={`Contenu "${view}" - Les graphiques pour cette section seront implémentés ici.`}
                    icon={BarChart3}
                />
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            {/* Header moderne */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau de Bord Descentes</h1>
                        <p className="text-gray-600 text-lg">
                            Surveillance en temps réel des opérations de terrain
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Actualisation auto: 30s</span>
                        </div>
                        <button 
                            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                            onClick={refreshAllData}
                        >
                            <Download className="w-4 h-4" />
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Affichage des erreurs */}
            {(errors.stats || errors.communes || errors.data || errors.descentesParMois || errors.etapes) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center space-x-2 text-red-800 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold">Erreurs de chargement:</span>
                    </div>
                    <div className="text-sm text-red-700 space-y-1">
                        {errors.stats && <p>• Statistiques: {errors.stats}</p>}
                        {errors.communes && <p>• Communes: {errors.communes}</p>}
                        {errors.data && <p>• Données: {errors.data}</p>}
                        {errors.descentesParMois && <p>• Évolution mensuelle: {errors.descentesParMois}</p>}
                        {errors.etapes && <p>• Statistiques par étape: {errors.etapes}</p>}
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Section de contenu */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {stats.find(s => s.view === activeView)?.title}
                </h2>
                <p className="text-gray-600">
                    Analyse détaillée et visualisation des données
                </p>
            </div>

            {/* Contenu dynamique */}
            {renderContentView(activeView)}
        </div>
    );
};

export default Dashboard;