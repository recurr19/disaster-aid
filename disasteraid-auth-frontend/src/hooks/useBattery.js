import { useState, useEffect } from 'react';

/**
 * Custom hook for battery status monitoring
 */
export const useBattery = () => {
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('getBattery' in navigator)) {
      setSupported(false);
      return;
    }

    navigator.getBattery().then((battery) => {
      setBatteryLevel(Math.round(battery.level * 100));
      setIsCharging(battery.charging);

      const handleLevelChange = () => {
        setBatteryLevel(Math.round(battery.level * 100));
      };

      const handleChargingChange = () => {
        setIsCharging(battery.charging);
      };

      battery.addEventListener('levelchange', handleLevelChange);
      battery.addEventListener('chargingchange', handleChargingChange);

      return () => {
        battery.removeEventListener('levelchange', handleLevelChange);
        battery.removeEventListener('chargingchange', handleChargingChange);
      };
    });
  }, []);

  return { batteryLevel, isCharging, supported };
};
