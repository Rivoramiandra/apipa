import React, { useState, useEffect } from 'react';
import {
    PieChart,
    Pie,
    BarChart,
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
    FileText,
    MoreVertical,
    Download,
    AlertTriangle,
    Clock,
    TrendingUp,
    BarChart3,
    RefreshCw
} from 'lucide-react';

// Interfaces pour les FT
interface StatsFT {
  total_ft_etablis: number;
  ft_dossiers_complets: number;
  ft_dossiers_manquants: number;
  pourcentage_complets: number;
  pourcentage_manquants: number;
  ft_en_cours: number;
  ft_completes: number;
  total_ft_api?: number;
}

interface StatsFTMensuelle {
  mois: string;
  mois_court: string;
  annee: number;
  total_ft: number;
  ft_dossiers_complets: number;
  ft_dossiers_manquants: number;
  ft_en_cours: number;
  ft_completes: number;
}

interface StatsFTParStatut {
  statut: string;
  nombre_ft: number;
  pourcentage_nombre: number;
}

interface StatsFTParType {
  type_ft: string;
  nombre_ft: number;
  pourcentage: number;
}

interface StatsMoisStatut {
  mois: string;
  statut: string;
  total_ft_par_statut: number;
  total_ft_du_mois?: number;
}

// Interface pour la réponse de l'API total FT
interface TotalFTResponse {
  success: boolean;
  message: string;
  data: {
    total_ft: number;
  };
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
                <p className="text-xs text-gray-500 mt-1">({data.pourcentage}% du total)</p>
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

// Fonction pour formater les données pour le LineChart avec tous les mois (sans année)
const prepareLineChartData = (data: StatsMoisStatut[], selectedYear: number) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('❌ Aucune donnée valide pour le line chart');
    return getFallbackData(selectedYear);
  }

  console.log('📊 Données brutes reçues:', data);

  // Générer tous les mois de l'année sélectionnée
  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const monthNum = (i + 1).toString().padStart(2, '0');
    return `${selectedYear}-${monthNum}`;
  });

  const monthlyData = new Map();

  // Initialiser tous les mois avec des valeurs à 0
  allMonths.forEach(monthKey => {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    monthlyData.set(monthKey, {
      mois: monthKey,
      moisFormatted: monthNames[parseInt(month) - 1],
      'Complété': 0,
      'En cours': 0
    });
  });

  // Remplir avec les données existantes
  data.forEach((item) => {
    const monthKey = item.mois;
    
    if (monthlyData.has(monthKey)) {
      const monthData = monthlyData.get(monthKey);
      if (item.statut === 'Complété' || item.statut === 'En cours') {
        monthData[item.statut] = item.total_ft_par_statut;
      }
    }
  });

  const result = Array.from(monthlyData.values()).sort((a, b) => {
    return a.mois.localeCompare(b.mois);
  });

  console.log('📈 Données formatées pour line chart (mois seulement):', result);
  return result;
};

// Fonction de secours avec données complètes pour tous les mois (sans année)
const getFallbackData = (selectedYear: number) => {
  console.log('🔄 Utilisation des données de test avec mois seulement');
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  return Array.from({ length: 12 }, (_, i) => {
    const monthNum = (i + 1).toString().padStart(2, '0');
    const baseValue = Math.floor(Math.random() * 10) + 5;
    return {
      mois: `${selectedYear}-${monthNum}`,
      moisFormatted: monthNames[i],
      'Complété': baseValue + Math.floor(Math.random() * 5),
      'En cours': baseValue - Math.floor(Math.random() * 3)
    };
  });
};

interface SectionFTProps {
  onDataUpdate?: () => void;
}

const SectionFT: React.FC<SectionFTProps> = ({ onDataUpdate }) => {
    // États pour les statistiques FT
    const [statsFT, setStatsFT] = useState<StatsFT | null>(null);
    const [statsFTMensuelles, setStatsFTMensuelles] = useState<StatsFTMensuelle[]>([]);
    const [statsFTParStatut, setStatsFTParStatut] = useState<StatsFTParStatut[]>([]);
    const [statsFTParType, setStatsFTParType] = useState<StatsFTParType[]>([]);
    const [statsMoisStatut, setStatsMoisStatut] = useState<StatsMoisStatut[]>([]);
    const [loadingFT, setLoadingFT] = useState(false);
    const [selectedAnneeFT, setSelectedAnneeFT] = useState<number>(new Date().getFullYear());
    const [error, setError] = useState<string | null>(null);
    const [totalFTFromAPI, setTotalFTFromAPI] = useState<number>(0);

    // Fonction helper pour convertir en nombre sûr
    const safeNumber = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined) return defaultValue;
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    };

    // Fonction pour récupérer le total FT depuis l'API spécifique
    const fetchTotalFT = async (): Promise<number> => {
      try {
        console.log('🔄 Récupération du total FT depuis /api/ft/total...');
        const response = await fetch('http://localhost:3000/api/ft/total');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data: TotalFTResponse = await response.json();
        
        if (data.success) {
          console.log('✅ Total FT récupéré:', data.data.total_ft);
          return safeNumber(data.data.total_ft);
        } else {
          throw new Error(data.message || 'Erreur inconnue');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération du total FT:', error);
        return 0;
      }
    };

    // Fonction pour récupérer les statistiques FT
    const fetchStatsFT = async () => {
      try {
        setLoadingFT(true);
        setError(null);
        
        console.log('🔄 Chargement des données FT depuis l\'API...');
        
        // Récupérer le total FT en premier
        const totalFT = await fetchTotalFT();
        setTotalFTFromAPI(totalFT);
        
        // Récupérer les autres données en parallèle
        const [statutRes, moisStatutRes] = await Promise.all([
          fetch('http://localhost:3000/api/ft/stats/statut'),
          fetch('http://localhost:3000/api/ft/stats/mois-statut')
        ]);

        let statutData: any = null;
        let moisStatutData: any = null;

        if (statutRes.ok) {
          statutData = await statutRes.json();
          console.log('📊 Données statut reçues:', statutData);
        }

        if (moisStatutRes.ok) {
          moisStatutData = await moisStatutRes.json();
          console.log('📊 Données mois-statut reçues:', moisStatutData);
        }

        // Utiliser le total FT de l'API comme source principale
        if (statutData?.success && statutData.data) {
          setStatsFTParStatut(statutData.data);
          
          const completedFT = statutData.data.find((item: StatsFTParStatut) => item.statut === 'Complété')?.nombre_ft || 0;
          const inProgressFT = statutData.data.find((item: StatsFTParStatut) => item.statut === 'En cours')?.nombre_ft || 0;
          
          const generalStats: StatsFT = {
            total_ft_etablis: totalFT, // Utiliser le total de l'API
            ft_dossiers_complets: safeNumber(completedFT),
            ft_dossiers_manquants: safeNumber(inProgressFT),
            pourcentage_complets: totalFT > 0 ? safeNumber(((completedFT / totalFT) * 100).toFixed(2)) : 0,
            pourcentage_manquants: totalFT > 0 ? safeNumber(((inProgressFT / totalFT) * 100).toFixed(2)) : 0,
            ft_en_cours: safeNumber(inProgressFT),
            ft_completes: safeNumber(completedFT),
            total_ft_api: totalFT // Stocker aussi séparément
          };
          
          setStatsFT(generalStats);
        } else {
          // Données par défaut avec le total de l'API
          const generalStats: StatsFT = {
            total_ft_etablis: totalFT,
            ft_dossiers_complets: 0,
            ft_dossiers_manquants: 0,
            pourcentage_complets: 0,
            pourcentage_manquants: 0,
            ft_en_cours: 0,
            ft_completes: 0,
            total_ft_api: totalFT
          };
          setStatsFT(generalStats);
        }

        if (moisStatutData?.success && moisStatutData.data) {
          setStatsMoisStatut(moisStatutData.data);
        }

        // Notifier le parent que les données sont mises à jour
        if (onDataUpdate) {
          onDataUpdate();
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques FT:", error);
        setError('Erreur de chargement des statistiques FT');
        
        // Données par défaut en cas d'erreur
        const generalStats: StatsFT = {
          total_ft_etablis: 0,
          ft_dossiers_complets: 0,
          ft_dossiers_manquants: 0,
          pourcentage_complets: 0,
          pourcentage_manquants: 0,
          ft_en_cours: 0,
          ft_completes: 0,
          total_ft_api: 0
        };
        setStatsFT(generalStats);
        setTotalFTFromAPI(0);
      } finally {
        setLoadingFT(false);
      }
    };

    // Recharger les données FT quand l'année change
    useEffect(() => {
      if (selectedAnneeFT) {
        fetchStatsFT();
      }
    }, [selectedAnneeFT]);

    // Actualisation automatique toutes les 30 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStatsFT();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    if (loadingFT) {
        return <LoadingSpinner message="Chargement des statistiques FT..." />;
    }

    // Préparer les données pour les graphiques
    const dataStatutChart = statsFTParStatut.map(stat => ({
        name: stat.statut,
        value: safeNumber(stat.nombre_ft),
        pourcentage: safeNumber(stat.pourcentage_nombre),
        color: 
            stat.statut === 'Complété' ? '#10B981' :
            stat.statut === 'En cours' ? '#F59E0B' : '#3B82F6'
    }));

    const lineChartData = prepareLineChartData(statsMoisStatut, selectedAnneeFT);

    // Utilisation de safeNumber pour garantir que ce sont des nombres
    const totalFT = safeNumber(statsFT?.total_ft_etablis);
    const dossiersComplets = safeNumber(statsFT?.ft_dossiers_complets);
    const dossiersEnCours = safeNumber(statsFT?.ft_dossiers_manquants);
    const tauxCompletion = safeNumber(statsFT?.pourcentage_complets);

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

            {/* Indicateurs clés - SANS FOND BLEU */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Total FT depuis l'API spécifique */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total F.T. (API)</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {totalFTFromAPI.toLocaleString()}
                            </p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Total F.T.</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {totalFT.toLocaleString()}
                            </p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Dossiers Complétés</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {dossiersComplets.toLocaleString()}
                            </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Dossiers En Cours</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {dossiersEnCours.toLocaleString()}
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-orange-600" />
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm">Taux de Complétion</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {tauxCompletion.toFixed(1)}%
                            </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Évolution mensuelle */}
                <div className="xl:col-span-2">
                    <ChartCard 
                        title="Évolution Mensuelle des F.T." 
                        height={340}
                        actions={
                            <div className="flex items-center space-x-2">
                                <select 
                                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white"
                                    value={selectedAnneeFT}
                                    onChange={(e) => setSelectedAnneeFT(Number(e.target.value))}
                                >
                                    {[2022, 2023, 2024, 2025].map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <div className="flex items-center space-x-2 bg-blue-50 rounded-lg px-3 py-1">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">{selectedAnneeFT}</span>
                                </div>
                            </div>
                        }
                    >
                        {lineChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart 
                                    data={lineChartData} 
                                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="moisFormatted" 
                                        stroke="#64748b" 
                                        fontSize={11} 
                                        tickMargin={10}
                                    />
                                    <YAxis stroke="#64748b" fontSize={11} />
                                    <Tooltip content={<CustomLineTooltip />} />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="Complété" 
                                        stroke={modernColors.secondary} 
                                        strokeWidth={3} 
                                        dot={{ fill: modernColors.secondary, strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="En cours" 
                                        stroke={modernColors.accent} 
                                        strokeWidth={3} 
                                        dot={{ fill: modernColors.accent, strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyState 
                                message="Aucune donnée d'évolution temporelle disponible" 
                                icon={TrendingUp}
                            />
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
                                    {statsFTParStatut.reduce((sum, item) => sum + safeNumber(item.nombre_ft), 0).toLocaleString()}
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
                                                    <span className="font-semibold text-gray-900">{entry.value.toLocaleString()}</span>
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
                {/* Résumé des statuts */}
                <ChartCard 
                    title="Détails des Statuts" 
                    height={300}
                >
                    <div className="space-y-4">
                        {dataStatutChart.map((statut, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statut.color }} />
                                    <span className="text-sm font-medium text-gray-700">{statut.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold text-gray-900">{statut.value.toLocaleString()}</span>
                                    <span className="text-xs text-gray-500 block">
                                        {statut.pourcentage}% du total
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>

                {/* Résumé général */}
                <ChartCard 
                    title="Résumé Général" 
                    height={300}
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-700">F.T. Complétées</span>
                            <span className="text-lg font-bold text-green-600">
                                {dossiersComplets.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-700">F.T. En Cours</span>
                            <span className="text-lg font-bold text-orange-600">
                                {dossiersEnCours.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                            <span className="text-sm font-medium text-gray-700">Taux Complétion</span>
                            <span className="text-lg font-bold text-blue-600">
                                {tauxCompletion.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                            <span className="text-sm font-semibold text-gray-700">Total F.T. (API)</span>
                            <span className="text-lg font-bold text-gray-900">
                                {totalFTFromAPI.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </ChartCard>
            </div>           
        </div>
    );
};

export default SectionFT;