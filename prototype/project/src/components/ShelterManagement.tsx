import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shelter, SupplyDepot } from '../types';
import { Building2, Package, Phone, MapPin, Users, AlertCircle } from 'lucide-react';

export default function ShelterManagement() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [supplyDepots, setSupplyDepots] = useState<SupplyDepot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shelters' | 'supplies'>('shelters');

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('shelter-management')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shelters' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supply_depots' }, loadData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    try {
      const [sheltersRes, depotsRes] = await Promise.all([
        supabase.from('shelters').select('*').order('name'),
        supabase.from('supply_depots').select('*').order('name'),
      ]);

      setShelters(sheltersRes.data || []);
      setSupplyDepots(depotsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percent = (occupancy / capacity) * 100;
    if (percent >= 90) return 'text-red-600';
    if (percent >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-700';
      case 'full': return 'bg-red-100 text-red-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      case 'evacuated': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Shelter & Supply Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          Monitor shelter capacity and supply depot inventory
        </p>
      </div>

      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('shelters')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'shelters'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Shelters ({shelters.length})
        </button>
        <button
          onClick={() => setActiveTab('supplies')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'supplies'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Supply Depots ({supplyDepots.length})
        </button>
      </div>

      {activeTab === 'shelters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shelters.length === 0 ? (
            <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Shelters Available</h3>
              <p className="text-gray-600">Shelter information will appear here</p>
            </div>
          ) : (
            shelters.map((shelter) => {
              const occupancyPercent = (shelter.current_occupancy / shelter.total_capacity) * 100;
              return (
                <div key={shelter.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{shelter.name}</h3>
                        <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${getStatusColor(shelter.status)}`}>
                          {shelter.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-900">{shelter.address}</p>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-900">{shelter.contact_number}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Capacity</span>
                        <span className={`text-sm font-bold ${getOccupancyColor(shelter.current_occupancy, shelter.total_capacity)}`}>
                          {shelter.current_occupancy} / {shelter.total_capacity}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            occupancyPercent >= 90
                              ? 'bg-red-600'
                              : occupancyPercent >= 75
                              ? 'bg-orange-500'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{occupancyPercent.toFixed(0)}% occupied</p>
                    </div>

                    {shelter.facilities && shelter.facilities.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Facilities</p>
                        <div className="flex flex-wrap gap-1">
                          {shelter.facilities.map((facility) => (
                            <span key={facility} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {facility}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {occupancyPercent >= 90 && (
                      <div className="pt-3 border-t border-red-200 bg-red-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
                        <div className="flex items-center space-x-2 text-red-700">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-semibold">Near capacity - redirect new arrivals</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'supplies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {supplyDepots.length === 0 ? (
            <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Supply Depots Available</h3>
              <p className="text-gray-600">Supply depot information will appear here</p>
            </div>
          ) : (
            supplyDepots.map((depot) => (
              <div key={depot.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{depot.name}</h3>
                    <p className="text-xs text-gray-500">{depot.operating_hours}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-900">{depot.address}</p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-900">{depot.contact_number}</p>
                  </div>

                  {depot.inventory && Object.keys(depot.inventory).length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Current Inventory</p>
                      <div className="space-y-2">
                        {Object.entries(depot.inventory).map(([item, quantity]) => (
                          <div key={item} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 capitalize">{item.replace(/_/g, ' ')}</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {typeof quantity === 'number' ? quantity.toLocaleString() : quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
