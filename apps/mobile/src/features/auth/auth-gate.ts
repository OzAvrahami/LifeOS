export function getAuthGateState({
  hasSession,
  isDevelopmentPreview,
  isLoading,
  isRecovery,
}: {
  hasSession: boolean;
  isDevelopmentPreview: boolean;
  isLoading: boolean;
  isRecovery: boolean;
}) {
  return {
    showLoading: isLoading && !isDevelopmentPreview,
    publicAuthAvailable: !hasSession || isRecovery || isDevelopmentPreview,
    productAvailable: (hasSession && !isRecovery) || isDevelopmentPreview,
  };
}
