'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface PublicCompanySettings {
  displayName: string;
  legalName: string;
  logoUrl: string | null;
  currency: 'INR' | 'USD' | 'AED';
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  fiscalYearStartMonth: number;
  weekStartsOn: 'MONDAY' | 'SUNDAY';
  shiftStart: string;
  shiftEnd: string;
  lateGraceMinutes: number;
}

const DEFAULT_SETTINGS: PublicCompanySettings = {
  displayName: 'Builder Management',
  legalName: 'Builder Management Inc.',
  logoUrl: null,
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  fiscalYearStartMonth: 4,
  weekStartsOn: 'MONDAY',
  shiftStart: '09:00',
  shiftEnd: '18:00',
  lateGraceMinutes: 15,
};

interface CompanySettingsContextType {
  settings: PublicCompanySettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const CompanySettingsContext = createContext<CompanySettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: false,
  refreshSettings: async () => {},
});

export function CompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicCompanySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/public');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSettings(json.data);
        }
      }
    } catch {
      // Fallback to defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <CompanySettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings() {
  return useContext(CompanySettingsContext);
}
