import React, { createContext, useContext } from 'react';

export interface FeatureFlags {
  enableStrictNav: boolean;
  enableServerDrivenNav: boolean;
  enableVoiceFab: boolean;
}

const defaultFlags: FeatureFlags = {
  enableStrictNav: true,
  enableServerDrivenNav: false,
  enableVoiceFab: true,
};

const FeatureFlagsContext = createContext<FeatureFlags>(defaultFlags);

export const useFeatureFlags = () => useContext(FeatureFlagsContext);

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode; value?: Partial<FeatureFlags> }> = ({ children, value }) => {
  const merged: FeatureFlags = { ...defaultFlags, ...(value || {}) };
  return (
    <FeatureFlagsContext.Provider value={merged}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}; 