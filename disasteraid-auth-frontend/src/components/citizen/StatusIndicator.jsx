import React from 'react';
import { Wifi, WifiOff, Battery, BatteryCharging, BatteryLow } from 'lucide-react';

/**
 * Network and battery status indicator
 */
const StatusIndicator = ({ 
  networkStrength, 
  batteryLevel, 
  isCharging, 
  isOffline 
}) => {
  const getNetworkColor = () => {
    if (isOffline || networkStrength === 0) return 'text-red-500';
    if (networkStrength < 30) return 'text-orange-500';
    if (networkStrength < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBatteryColor = () => {
    if (isCharging) return 'text-blue-500';
    if (batteryLevel < 20) return 'text-red-500';
    if (batteryLevel < 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getBatteryIcon = () => {
    if (isCharging) return BatteryCharging;
    if (batteryLevel < 20) return BatteryLow;
    return Battery;
  };

  const NetworkIcon = isOffline ? WifiOff : Wifi;
  const BatteryIcon = getBatteryIcon();

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Network Status */}
      <div className="flex items-center space-x-2">
        <NetworkIcon className={`h-5 w-5 ${getNetworkColor()}`} />
        <div>
          <p className="text-xs text-gray-500">Network</p>
          <p className={`text-sm font-semibold ${getNetworkColor()}`}>
            {isOffline ? 'Offline' : `${networkStrength}%`}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-10 w-px bg-gray-300"></div>

      {/* Battery Status */}
      <div className="flex items-center space-x-2">
        <BatteryIcon className={`h-5 w-5 ${getBatteryColor()}`} />
        <div>
          <p className="text-xs text-gray-500">Battery</p>
          <p className={`text-sm font-semibold ${getBatteryColor()}`}>
            {batteryLevel}% {isCharging && '⚡'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatusIndicator;
