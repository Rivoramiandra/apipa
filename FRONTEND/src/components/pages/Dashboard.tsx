import React from 'react';
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
  Filter
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Véhicules en stock',
      value: '24',
      icon: Car,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Véhicules vendus',
      value: '18',
      icon: CheckCircle,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Clients',
      value: '42',
      icon: Users,
      color: 'yellow',
      change: '+15%'
    },
    {
      title: 'Revenus',
      value: '€245,390',
      icon: Euro,
      color: 'purple',
      change: '+23%'
    }
  ];

  // Données pour le Bar Chart - Situations en cours
  const situationsData = [
    { name: 'AP émis', value: 10 },
    { name: 'Aucune manif pour le Proprio', value: 33 },
    { name: 'Construction sur des Ouvrages Publiques', value: 21 },
    { name: 'Convocation/Mise en demeure', value: 7 },
    { name: 'En attente Compléments', value: 37 },
    { name: 'Préparation AP', value: 10 },
    { name: 'Projet d\'arrêté de scellage', value: 1 },
    { name: 'Régularisée, chèque perçue', value: 62 },
  ];

  // Données pour le Pie Chart - Service envoyeur
  const serviceEnvoyeurData = [
    { name: 'Ambohimangakely', value: 4 },
    { name: 'Ankadikely Ilafy', value: 2 },
    { name: 'Antehiroka', value: 2 },
    { name: 'Commune Ambohimangakely', value: 3 },
    { name: 'Commune Talatamaty', value: 1 },
    { name: 'CUA', value: 44 },
    { name: 'SOCIETE ZITAL', value: 1 },
  ];

  // Données pour le Pie Chart - Catégorie
  const categorieData = [
    { name: 'Irrégulier', value: 16 },
    { name: 'Régulier', value: 22 },
  ];

  // Données pour le Doughnut Chart - Situation PC
  const situationPCData = [
    { name: 'En cours d\'études', value: 5 },
    { name: 'Non traité', value: 27 },
    { name: 'Traité', value: 8 },
  ];

  const chartColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'];

  // Composant de carte de statistiques
  const StatsCard = ({ title, value, icon: Icon, color, change }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          <span className={`text-sm ${change.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
            {change} vs mois dernier
          </span>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
      </div>
    </div>
  );

  // Composant de carte de graphique
  const ChartCard = ({ title, children, actions, height = 300 }: any) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center space-x-2">
          {actions}
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div style={{ height: `${height}px` }}>
        {children}
      </div>
    </div>
  );

  // Tooltip personnalisé
  const CustomTooltip = ({ active, payload, label }: any) => {
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

  // Label personnalisé pour les pie charts
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
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
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filtrer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Situations en cours */}
        <ChartCard 
          title="Situations en cours" 
          height={400}
          actions={
            <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg">
              Total: 181
            </button>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={situationsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#666" 
                fontSize={11}
              />
              <YAxis 
                stroke="#666" 
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                name="Nombre de dossiers"
                radius={[4, 4, 0, 0]}
              >
                {situationsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie Chart - Service envoyeur */}
        <ChartCard 
          title="Nombre de service envoyeur"
          height={400}
          actions={
            <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg">
              Total: 57
            </button>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={serviceEnvoyeurData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {serviceEnvoyeurData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie Chart - Catégorie */}
        <ChartCard 
          title="Nombre de catégorie"
          actions={
            <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg">
              Total: 38
            </button>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categorieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {categorieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ fontSize: '12px', marginTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Doughnut Chart - Situation PC */}
        <ChartCard 
          title="Nombre de situation PC"
          actions={
            <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg">
              Total: 40
            </button>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={situationPCData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {situationPCData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ fontSize: '12px', marginTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;