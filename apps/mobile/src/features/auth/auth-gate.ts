export function getAuthGateState({
  hasSession,
  isDevelopmentPreview,
  isLoading,
  isRecovery,
  needsOnboarding = false,
}: {
  hasSession: boolean;
  isDevelopmentPreview: boolean;
  isLoading: boolean;
  isRecovery: boolean;
  needsOnboarding?: boolean;
}) {
  return {
    showLoading: isLoading && !isDevelopmentPreview,
    publicAuthAvailable: !hasSession || isRecovery || isDevelopmentPreview,
    productAvailable: (hasSession && !isRecovery && !needsOnboarding) || isDevelopmentPreview,
  };
}
