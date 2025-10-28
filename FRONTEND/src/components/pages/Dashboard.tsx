import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart,
    PieChart,
    Pie,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    CartesianGrid
} from 'recharts';
import {
    Car,
    CheckCircle,
    Users,
    Euro,
    MoreVertical,
    Download,
    Filter,
    AlertTriangle,
    Clock,
    Truck,
    FileText,
    Home,
    MapPin,
} from 'lucide-react';

// Interfaces
interface SituationStat { statisituation: string; nombre: number; }
interface ServiceEnvoyeurStat { nom_commune: string; nombre: number; }
interface ChartData { name: string; value: number; }
type ContentView = 'DescenteSurTerrain' | 'DemandeFN' | 'DemandePC' | 'AutorisationCamion';

// Couleurs des charts
const chartColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#A8DADC', '#E63946', '#2A9D8F'];

// Nettoyage noms situations
const cleanSituationName = (name: string): string => {
    switch (name) {
        case 'Régularisée, chèque percue, paiement en cours': return 'Régularisée/Paiement en cours';
        case 'Construction sur des Ouvrages Publiques': return 'Construction Ouvrages Publics';
        case 'Convocation/Mise en demeure pour paiement': return 'Convocation/Mise en demeure';
        case 'En attente Compléments de dossiers': return 'En attente Compléments';
        case 'Projet d\'arrêté de scellage': return 'Projet Scellage';
        case 'Aucune manif pour le Proprio': return 'Aucune Manifestation (Proprio)';
        case 'Total général': return 'Total général';
        default: return name;
    }
};

// Tooltip personnalisés
const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-gray-600">
            <span className="font-medium">{payload[0].value}</span> dossiers
          </p>
        </div>
      );
    }
    return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                <p className="font-semibold text-gray-800">Commune: {data.name}</p>
                <p className="text-gray-600">Nombre de dossiers: <span className="font-medium">{data.value}</span></p>
                <p className="text-xs text-gray-400">({(data.percent * 100).toFixed(1)}% du total)</p>
            </div>
        );
    }
    return null;
};

// ChartCard
const ChartCard = ({ title, children, actions, height = 300 }: any) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center space-x-2">
          {actions}
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div style={{ height: `${height}px` }}>{children}</div>
    </div>
);

// Label personnalisé pour Pie
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-semibold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const Dashboard: React.FC = () => {
    const [situationsData, setSituationsData] = useState<SituationStat[]>([]);
    const [totalSituations, setTotalSituations] = useState<number>(0);
    const [serviceEnvoyeurData, setServiceEnvoyeurData] = useState<ChartData[]>([]);
    const [totalServiceEnvoyeur, setTotalServiceEnvoyeur] = useState<number | 'N/A'>('N/A');
    const [descentesParMois, setDescentesParMois] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingDescentes, setLoadingDescentes] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<ContentView>('DescenteSurTerrain');

    // StatsCard
    const stats = [
        { title: 'Descente sur terrain', value: totalServiceEnvoyeur.toString(), icon: MapPin, color: 'blue', change: '+5%', view: 'DescenteSurTerrain' as ContentView },
        { title: 'Demande FN', value: '450', icon: FileText, color: 'orange', change: '-2%', view: 'DemandeFN' as ContentView },
        { title: 'Demande PC', value: totalSituations.toString(), icon: Home, color: 'green', change: '+12%', view: 'DemandePC' as ContentView },
        { title: 'Autorisation Camion', value: '89', icon: Truck, color: 'purple', change: '+23%', view: 'AutorisationCamion' as ContentView }
    ];

    const StatsCard = ({ title, value, icon: Icon, color, change, view }: any) => (
        <div 
            className={`bg-white rounded-lg border p-6 transition-all cursor-pointer ${activeView === view ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:shadow-md'}`}
            onClick={() => setActiveView(view)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{title}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
              <span className={`text-sm ${change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>{change} vs mois dernier</span>
            </div>
            <div className={`p-3 rounded-full ${color === 'blue' ? 'bg-blue-100' : color === 'orange' ? 'bg-orange-100' : color === 'green' ? 'bg-green-100' : 'bg-purple-100'}`}>
              <Icon className={`w-6 h-6 ${color === 'blue' ? 'text-blue-500' : color === 'orange' ? 'text-orange-500' : color === 'green' ? 'text-green-500' : 'text-purple-500'}`} />
            </div>
          </div>
          <button className="mt-4 text-blue-500 text-sm font-semibold hover:text-blue-700 focus:outline-none" onClick={(e) => { e.stopPropagation(); setActiveView(view); }}>Voir plus →</button>
        </div>
    );

    // Composant pour afficher les statistiques de descente avec surfaces
    const StatsDescenteComponent = () => {
      // Données simulées pour les surfaces par type de zone (en km²)
      const surfacesParZone = [
        { type: 'Zone constructible', surface: 8.5, couleur: '#4BC0C0' },
        { type: 'Zone non constructible', surface: 12.3, couleur: '#FF6384' },
        { type: 'Zone résidentielle', surface: 6.2, couleur: '#36A2EB' },
        { type: 'Zone commerciale', surface: 3.1, couleur: '#FFCE56' },
        { type: 'Zone industrielle', surface: 4.7, couleur: '#9966FF' },
        { type: 'Équipement public', surface: 2.8, couleur: '#FF9F40' },
        { type: 'Voirie existante', surface: 5.4, couleur: '#C9CBCF' }
      ];
    
      const surfaceTotale = surfacesParZone.reduce((total, zone) => total + zone.surface, 0);
    
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Rapport de Surfaces (km²)</h3>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Surface totale */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Surface totale inspectée</p>
                  <p className="text-2xl font-bold text-blue-800 mt-1">{surfaceTotale.toFixed(1)} km²</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-full">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-blue-500">
                <span className="font-semibold">+8%</span> vs mois dernier
              </div>
            </div>
    
            {/* Graphique des surfaces par type de zone */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-4">Répartition par type de zone</h4>
              <div className="space-y-3">
                {surfacesParZone.map((zone, index) => {
                  const pourcentage = (zone.surface / surfaceTotale) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-gray-600">{zone.type}</span>
                        <span className="text-gray-500">{zone.surface} km² ({pourcentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${pourcentage}%`,
                            backgroundColor: zone.couleur
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
    
            {/* Statistiques détaillées */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Détail des surfaces</h4>
              <div className="space-y-2">
                {surfacesParZone.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: zone.couleur }}
                      />
                      <span className="text-xs text-gray-600">{zone.type}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {zone.surface} km²
                    </span>
                  </div>
                ))}
              </div>
            </div>
    
            {/* Indicateurs clés */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-green-600 text-xs font-medium">Zone constructible</p>
                <p className="text-lg font-bold text-green-800 mt-1">
                  {((surfacesParZone.find(z => z.type === 'Zone constructible')?.surface || 0) / surfaceTotale * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                <p className="text-orange-600 text-xs font-medium">Zone résidentielle</p>
                <p className="text-lg font-bold text-orange-800 mt-1">
                  {((surfacesParZone.find(z => z.type === 'Zone résidentielle')?.surface || 0) / surfaceTotale * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Fetch situations
    useEffect(() => {
        const fetchSituations = async () => {
            try {
                const response = await axios.get<SituationStat[]>("http://localhost:3000/api/statsituations");
                const rawData = response.data;
                const totalEntry = rawData.find(d => d.statisituation === 'Total général');
                setTotalSituations(totalEntry ? totalEntry.nombre : 0);
                const filteredData = rawData.filter(d => d.statisituation !== 'Total général').map(d => ({ ...d, statisituation: cleanSituationName(d.statisituation), nombre: Number(d.nombre) }));
                setSituationsData(filteredData);
                setError(null);
            } catch (err) {
                console.error("Erreur lors de la récupération des statisituations :", err);
                setError("Impossible de charger les données de situation. Vérifiez la connexion à l'API.");
            }
        };
        fetchSituations();
    }, []);

    // Fetch service envoyeur
    useEffect(() => {
        const fetchServiceEnvoyeur = async () => {
            try {
                const response = await axios.get<ServiceEnvoyeurStat[]>("http://localhost:3000/api/statcommunes");
                const rawData = response.data;
                const totalEntry = rawData.find(d => d.nom_commune === 'Total général');
                setTotalServiceEnvoyeur(totalEntry ? Number(totalEntry.nombre) : 'N/A');
                const filteredData: ChartData[] = rawData.filter(d => d.nom_commune !== 'Total général').map(d => ({ name: d.nom_commune, value: Number(d.nombre) }));
                setServiceEnvoyeurData(filteredData);
            } catch (err) { console.error("Erreur lors de la récupération des services envoyeurs :", err); }
            finally { setLoading(false); }
        };
        fetchServiceEnvoyeur();
    }, []);

    // Fetch descentes par mois
    useEffect(() => {
        const fetchDescentesParMois = async () => {
            try {
                const response = await axios.get("http://localhost:3000/api/stat-descentes/descentes-par-mois?annee=2025");
                const rawData = response.data;
                const chartData: ChartData[] = rawData.map((d: any) => ({
                    name: new Date(d.mois).toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
                    value: Number(d.nombre_dossiers)
                }));
                setDescentesParMois(chartData);
            } catch (err) { console.error("Erreur lors de la récupération des descentes par mois :", err); }
            finally { setLoadingDescentes(false); }
        };
        fetchDescentesParMois();
    }, []);

    // Render content view
    const renderContentView = (view: ContentView) => {
        if (loading) return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                <Clock className="w-10 h-10 animate-spin mb-4" />
                <p>Chargement des données...</p>
            </div>
        );

        if (view === 'DescenteSurTerrain') {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Colonne de gauche - Graphiques (3/4 de largeur) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* 1. Bar Chart - Situations */}
                        <ChartCard title="Situations en cours" height={400} actions={<button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg">Total: {totalSituations}</button>}>
                            {error ? (
                                <div className="flex flex-col items-center justify-center h-full text-red-500 border border-red-300 bg-red-50 p-4 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 mb-2" />
                                    <p>{error}</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={situationsData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="statisituation" angle={-45} textAnchor="end" height={80} stroke="#666" fontSize={11} />
                                        <YAxis stroke="#666" fontSize={12} domain={[0, 'dataMax + 10']} />
                                        <Tooltip content={<CustomBarTooltip />} />
                                        <Bar dataKey="nombre" radius={[4,4,0,0]}>
                                            {situationsData.map((entry, index) => (<Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        {/* 2. Pie Chart - Service Envoyeur */}
                        <ChartCard title="Nombre de service envoyeur (Par Commune)" height={400} actions={<button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg">Total: {totalServiceEnvoyeur}</button>}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={serviceEnvoyeurData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={renderCustomizedLabel} labelLine={false}>
                                        {serviceEnvoyeurData.map((entry, index) => (<Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* 3. Bar Chart - Descente par mois */}
                        <ChartCard title="Descente par mois (2025)" height={400} actions={<button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg">Total: {descentesParMois.reduce((sum,d)=>sum+d.value,0)}</button>}>
                            {loadingDescentes ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    <Clock className="w-10 h-10 animate-spin mb-4" />
                                    <p>Chargement des descentes...</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={descentesParMois} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#666" fontSize={11} />
                                        <YAxis stroke="#666" fontSize={12} domain={[0, 'dataMax + 10']} />
                                        <Tooltip content={<CustomBarTooltip />} />
                                        <Bar dataKey="value" radius={[4,4,0,0]}>
                                            {descentesParMois.map((entry,index)=><Cell key={`cell-${index}`} fill={chartColors[index%chartColors.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* Colonne de droite - Statistiques de descente (1/4 de largeur) */}
                    <div className="lg:col-span-1">
                        <StatsDescenteComponent />
                    </div>
                </div>
            );
        }

        // Autres vues
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center h-96 flex items-center justify-center">
                <div className="text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
                    <h3 className="text-xl font-semibold mb-2">Contenu "{view}"</h3>
                    <p>Les graphiques pour cette section seront implémentés ici.</p>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
                    <div className="flex items-center space-x-3">
                        <button className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Download className="w-4 h-4" /><span>Exporter</span>
                        </button>
                        <button className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4" /><span>Filtrer</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat,index)=><StatsCard key={index} {...stat} />)}
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-6 mt-8">
                Analyse détaillée : {stats.find(s => s.view === activeView)?.title}
            </h2>

            {/* Contenu dynamique */}
            {renderContentView(activeView)}
        </div>
    );
};

// Composant Calendar manquant - à ajouter
const Calendar = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export default Dashboard;