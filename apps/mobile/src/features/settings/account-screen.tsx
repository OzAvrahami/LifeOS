import { V2Icon } from '@/components/v2-icon';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import { clearUserQueryCache } from '@/features/auth/session-query-cache';
import { radius, spacing, typography as legacyTypography, v2Typography } from '@/theme/tokens';
import { useTheme, type Palette } from '@/theme/theme-provider';
import { V2Button, V2Text } from '@/components/v2';
import { createAuthCallbackUrl } from '@/features/auth/auth-navigation';
import { authErrorMessage } from '@/features/auth/auth-errors';

import { authDisplayName } from './more-screen';
import { SettingsCard } from './settings.components';
import { V2SettingsPage as SettingsPage, V2SettingsHeading as SettingsSectionLabel } from './v2-settings';
const typography = { ...legacyTypography, family: { ...v2Typography.family, medium: v2Typography.family.semibold } };

export function AccountScreen({ onBack, onSignedOut }: { onBack: () => void; onSignedOut: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { signOut, requestPasswordReset, user } = useAuth();
  const [resetPending, setResetPending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
      clearUserQueryCache(queryClient);
      onSignedOut();
    } catch {
      setError('לא הצלחנו להתנתק. אפשר לנסות שוב.');
      setSigningOut(false);
      setConfirming(false);
    }
  };

  return (
    <>
      <SettingsPage
        footer={(
          <>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityLabel="התנתקות" accessibilityRole="button" onPress={() => setConfirming(true)} style={styles.signOutButton}>
              <V2Icon color={colors.warningAction} name="log-out" size={20} />
              <Text style={styles.signOutText}>התנתקות</Text>
            </Pressable>
          </>
        )}
        onBack={onBack}
        title="חשבון"
      >
        <SettingsSectionLabel>פרטים</SettingsSectionLabel>
        <SettingsCard>
          <View style={[styles.detailRow, styles.detailDivider]}>
            <Text style={styles.detailLabel}>שם</Text>
            <Text selectable style={styles.detailValue}>{authDisplayName(user?.user_metadata)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>אימייל</Text>
            <Text selectable style={[styles.detailValue, styles.email]}>{user?.email ?? '—'}</Text>
          </View>
        </SettingsCard>
        <Text style={styles.hint}>החשבון שלך נפרד מההרשאות ליומנים חיצוניים.</Text>
        <SettingsSectionLabel>סיסמה</SettingsSectionLabel>
        <V2Button secondary busy={resetPending} disabled={!user?.email || resetSent} title="שליחת קישור לאיפוס סיסמה" onPress={async () => {
          if (resetPending || !user?.email) return;
          setResetPending(true); setError(null);
          try { await requestPasswordReset(user.email, createAuthCallbackUrl('recovery')); setResetSent(true); }
          catch (caught) { setError(authErrorMessage(caught, 'reset')); }
          finally { setResetPending(false); }
        }} />
        {resetSent ? <V2Text accessibilityRole="alert" muted>אם הכתובת קיימת אצלנו, נשלח קישור לאיפוס. כדאי לבדוק גם בתיקיית הספאם.</V2Text> : null}
      </SettingsPage>
      <Modal animationType="fade" onRequestClose={() => setConfirming(false)} transparent visible={confirming}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="ביטול התנתקות" accessibilityRole="button" onPress={() => setConfirming(false)} style={styles.backdrop} />
          <View accessibilityLabel="אישור התנתקות" style={styles.confirmation}>
            <View style={styles.confirmationIcon}><V2Icon color={colors.warningAction} name="log-out" size={25} /></View>
            <Text style={styles.confirmationTitle}>להתנתק מ־LifeOS?</Text>
            <Text style={styles.confirmationBody}>תמיד אפשר להתחבר שוב עם אותו חשבון. המידע שלך נשמר.</Text>
            <Pressable accessibilityRole="button" accessibilityState={{ busy: signingOut }} disabled={signingOut} onPress={() => void confirmSignOut()} style={styles.confirmButton}>
              <Text style={styles.confirmText}>{signingOut ? 'מתנתק…' : 'התנתקות'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={signingOut} onPress={() => setConfirming(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>ביטול</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  detailRow: { alignItems: 'center', flexDirection: 'row-reverse', gap: spacing.sm, minHeight: 56 },
  detailDivider: { borderBottomColor: colors.divider, borderBottomWidth: StyleSheet.hairlineWidth },
  detailLabel: { color: colors.textSubtle, fontFamily: typography.family.semibold, fontSize: typography.size.meta, width: 56 },
  detailValue: { color: colors.textSoft, flex: 1, fontFamily: typography.family.semibold, fontSize: typography.size.button, textAlign: 'left' },
  email: { fontFamily: typography.family.medium, fontSize: typography.size.body, writingDirection: 'ltr' },
  hint: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: 12.5, marginHorizontal: spacing.xxs, marginTop: spacing.xs, textAlign: 'right' },
  signOutButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: '#EAD9CF', borderRadius: 15, borderWidth: 1, flexDirection: 'row-reverse', gap: 9, height: 54, justifyContent: 'center' },
  signOutText: { color: colors.warningAction, fontFamily: typography.family.bold, fontSize: typography.size.button },
  error: { color: colors.warningText, fontFamily: typography.family.semibold, fontSize: typography.size.label, marginBottom: spacing.sm, textAlign: 'right' },
  modalRoot: { flex: 1, justifyContent: 'center', paddingHorizontal: 22 },
  backdrop: { backgroundColor: 'rgba(28, 25, 18, 0.42)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  confirmation: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 22, paddingVertical: 26 },
  confirmationIcon: { alignItems: 'center', backgroundColor: colors.warningBadge, borderRadius: spacing.md, height: 52, justifyContent: 'center', width: 52 },
  confirmationTitle: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 21, marginTop: spacing.md, writingDirection: 'rtl' },
  confirmationBody: { color: colors.textSubtle, fontFamily: typography.family.regular, fontSize: typography.size.meta, lineHeight: 21, marginTop: spacing.sm, textAlign: 'center', writingDirection: 'rtl' },
  confirmButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.warningBadge, borderRadius: radius.md, height: 50, justifyContent: 'center', marginTop: 22 },
  confirmText: { color: colors.warningAction, fontFamily: typography.family.extraBold, fontSize: typography.size.button },
  cancelButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.completedSurface, borderRadius: radius.md, height: 50, justifyContent: 'center', marginTop: spacing.xs },
  cancelText: { color: colors.textSoft, fontFamily: typography.family.bold, fontSize: typography.size.button },
});
