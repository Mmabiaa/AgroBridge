import { VoiceFab } from '@/components/VoiceFab';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

export const FeatureFlaggedVoiceFab = () => {
  const { enableVoiceFab } = useFeatureFlags();
  if (!enableVoiceFab) return null;
  return <VoiceFab />;
}; 