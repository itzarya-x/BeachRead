import React, { createContext, useContext } from "react";

export const FEATURES = {
    ACCOUNT_EDIT: true,
    TWO_FACTOR: false,
    PROVIDER_CONNECT: false,
    DATA_EXPORT: false,
    AI_SETTINGS: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

type FeatureFlagsContextValue = {
    isEnabled: (feature: FeatureKey) => boolean;
    flags: typeof FEATURES;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
    isEnabled: (feature) => FEATURES[feature],
    flags: FEATURES,
});

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
    return (
        <FeatureFlagsContext.Provider
            value={{
                flags: FEATURES,
                isEnabled: feature => FEATURES[feature],
            }}
        >
            {children}
        </FeatureFlagsContext.Provider>
    );
}

export function useFeatures() {
    return useContext(FeatureFlagsContext);
}
