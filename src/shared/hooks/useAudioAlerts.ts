
import { useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { playAlertBeep } from '../lib/audio';

const BRAN_CAPACITY = 60000;
const BRAN_THRESHOLD = 0.8; // 80%
const BRAN_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

const FLOUR_CAPACITY = 120;
const FLOUR_THRESHOLD = 0.85; // 85%
const FLOUR_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8 hours

export const useAudioAlerts = (onAlert: (title: string, message: string) => void) => {
  const { stock } = useData();
  const lastBranBeep = useRef<number>(Number(localStorage.getItem('last_bran_beep') || 0));
  const lastFlourBeep = useRef<number>(Number(localStorage.getItem('last_flour_beep') || 0));

  useEffect(() => {
    const checkAlerts = () => {
      const now = Date.now();
      if (!stock) return;

      // Check Bran Stock (80%)
      const branStockValue = stock.branStock || 0;
      const branOccupancy = branStockValue / BRAN_CAPACITY;
      if (branOccupancy >= BRAN_THRESHOLD) {
        if (now - lastBranBeep.current >= BRAN_INTERVAL_MS) {
          console.log("Playing Bran Stock Alert (80%)");
          playAlertBeep();
          onAlert("Estoque de Farelo Crítico", "A ocupação do estoque de farelo atingiu 80%.");
          lastBranBeep.current = now;
          localStorage.setItem('last_bran_beep', now.toString());
        }
      } else {
        // Reset if below threshold
        if (lastBranBeep.current !== 0) {
          lastBranBeep.current = 0;
          localStorage.setItem('last_bran_beep', '0');
        }
      }

      // Check Flour Stock (85%, excluding glue)
      const com = stock.common || 0;
      const esp = stock.special || 0;
      const int = stock.whole || 0;
      const flourOccupancyBags = com + esp + int;
      const flourOccupancy = flourOccupancyBags / FLOUR_CAPACITY;
      if (flourOccupancy >= FLOUR_THRESHOLD) {
        if (now - lastFlourBeep.current >= FLOUR_INTERVAL_MS) {
          console.log("Playing Flour Stock Alert (85%)");
          playAlertBeep();
          onAlert("Estoque de Farinha Crítico", "A ocupação do estoque de farinha atingiu 85%.");
          lastFlourBeep.current = now;
          localStorage.setItem('last_flour_beep', now.toString());
        }
      } else {
        // Reset if below threshold
        if (lastFlourBeep.current !== 0) {
          lastFlourBeep.current = 0;
          localStorage.setItem('last_flour_beep', '0');
        }
      }
    };

    // Check every minute
    const interval = setInterval(checkAlerts, 60000);
    
    // Initial check
    checkAlerts();

    return () => clearInterval(interval);
  }, [stock]);
};
