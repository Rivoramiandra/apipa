import React from 'react';
import { User, Car, Package, MapPin } from 'lucide-react';

const ActivityFeed: React.FC = () => {
  const activities = [
    {
      id: 1,
      type: 'purchase',
      user: 'Jean Dupont',
      action: 'a acheté une BMW X5',
      time: 'Il y a 2 heures',
      icon: Car
    },
    {
      id: 2,
      type: 'reservation',
      user: 'Marie Martin',
      action: 'a réservé une Audi A4',
      time: 'Il y a 5 heures',
      icon: User
    },
    {
      id: 3,
      type: 'system',
      user: 'Système',
      action: 'Nouveau véhicule ajouté: Mercedes Classe C',
      time: "Aujourd'hui, 09:45",
      icon: Package
    },
    {
      id: 4,
      type: 'cancelled',
      user: 'Pierre Lambert',
      action: 'a annulé sa réservation',
      time: 'Hier, 16:30',
      icon: MapPin
    }
  ];

  const getIconColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-600';
      case 'reservation':
        return 'bg-blue-100 text-blue-600';
      case 'system':
        return 'bg-purple-100 text-purple-600';
      case 'cancelled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activity.icon;
        
        return (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${getIconColor(activity.type)}`}>
              <Icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-medium text-slate-800">{activity.user}</span>
                <span className="text-slate-600 ml-1">{activity.action}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{activity.time}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;