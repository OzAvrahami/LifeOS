import { Ionicons } from '@expo/vector-icons';
import { PropsWithChildren, ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, typography } from '@/theme/tokens';
import { useTheme, type Palette } from '@/theme/theme-provider';
import { V2Brand } from '@/components/v2';

export function AuthScreen({
  backLabel = 'חזרה',
  children,
  contentStyle,
  onBack,
}: PropsWithChildren<{
  backLabel?: string;
  contentStyle?: StyleProp<ViewStyle>;
  onBack?: () => void;
}>) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[styles.screenContent, contentStyle]}
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
        >
          {onBack ? (
            <Pressable
              accessibilityLabel={backLabel}
              accessibilityRole="button"
              hitSlop={8}
              onPress={onBack}
              style={styles.backButton}
            >
              <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
            </Pressable>
          ) : null}
          <View style={{ paddingVertical: 24 }}><V2Brand /></View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthHeading({ subtitle, title }: { subtitle: string; title: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.heading}>
      <Text accessibilityRole="header" selectable style={styles.headingTitle}>{title}</Text>
      <Text selectable style={styles.headingSubtitle}>{subtitle}</Text>
    </View>
  );
}

export function AuthTextField({
  error,
  label,
  style,
  ...props
}: TextInputProps & { error?: string; label: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textFaint}
        selectionColor={colors.accent}
        style={[styles.input, props.keyboardType === 'email-address' ? { textAlign: 'left', writingDirection: 'ltr' } : null, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <InlineError message={error} /> : null}
    </View>
  );
}

export function PasswordField({
  error,
  label,
  ...props
}: TextInputProps & { error?: string; label: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.passwordInput, error ? styles.inputError : null]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.textFaint}
          secureTextEntry={!visible}
          selectionColor={colors.accent}
          style={[styles.passwordTextInput, { textAlign: 'left', writingDirection: 'ltr' }]}
          {...props}
        />
        <Pressable
          accessibilityLabel={visible ? 'הסתרת סיסמה' : 'הצגת סיסמה'}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => setVisible((current) => !current)}
        >
          <Ionicons color={colors.textFaint} name={visible ? 'eye-off-outline' : 'eye-outline'} size={21} />
        </Pressable>
      </View>
      {error ? <InlineError message={error} /> : null}
    </View>
  );
}

export function AuthPrimaryButton({
  disabled,
  isLoading,
  loadingLabel,
  onPress,
  title,
}: {
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  onPress: () => void;
  title: string;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const unavailable = disabled || isLoading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!unavailable, busy: !!isLoading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, unavailable ? styles.primaryButtonDisabled : null, { opacity: pressed ? 0.7 : 1 }]}
    >
      {isLoading ? <ActivityIndicator color={colors.textMuted} size="small" /> : null}
      <Text style={[styles.primaryButtonText, unavailable ? styles.disabledButtonText : null]}>
        {isLoading ? loadingLabel ?? title : title}
      </Text>
    </Pressable>
  );
}

export function AuthSecondaryButton({
  disabled,
  onPress,
  title,
}: {
  disabled?: boolean;
  onPress: () => void;
  title: string;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.secondaryButton, disabled ? styles.secondaryButtonDisabled : null, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.secondaryButtonText, disabled ? styles.disabledButtonText : null]}>{title}</Text>
    </Pressable>
  );
}

export function AuthLink({ onPress, title }: { onPress: () => void; title: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <Pressable accessibilityRole="button" hitSlop={6} onPress={onPress}>
      <Text style={styles.link}>{title}</Text>
    </Pressable>
  );
}

export function AuthFormError({ message }: { message: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View accessibilityRole="alert" style={styles.formError}>
      <View style={styles.errorBadge}><Text style={styles.errorBadgeText}>!</Text></View>
      <Text selectable style={styles.formErrorText}>{message}</Text>
    </View>
  );
}

export function InlineError({ message }: { message: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View accessibilityRole="alert" style={styles.inlineError}>
      <View style={styles.inlineErrorBadge}><Text style={styles.inlineErrorBadgeText}>!</Text></View>
      <Text selectable style={styles.inlineErrorText}>{message}</Text>
    </View>
  );
}

export function AuthStateView({
  actions,
  icon,
  subtitle,
  title,
}: {
  actions: ReactNode;
  icon: ReactNode;
  subtitle: ReactNode;
  title: string;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.statePage}>
      <View style={styles.stateCenter}>
        {icon}
        <Text accessibilityRole="header" selectable style={styles.stateTitle}>{title}</Text>
        {typeof subtitle === 'string' ? (
          <Text selectable style={styles.stateSubtitle}>{subtitle}</Text>
        ) : subtitle}
      </View>
      <View style={styles.stateActions}>{actions}</View>
    </View>
  );
}

export function AuthStateIcon({
  name,
  tone = 'accent',
}: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  tone?: 'accent' | 'danger' | 'solid';
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const solid = tone === 'solid';
  return (
    <View style={[
      styles.stateIcon,
      tone === 'danger' ? styles.stateIconDanger : null,
      solid ? styles.stateIconSolid : null,
    ]}>
      <Ionicons color={solid ? colors.onAccent : tone === 'danger' ? colors.warningText : colors.accent} name={name} size={48} />
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  screenContent: {
    flexGrow: 1,
    gap: 0,
    maxWidth: 450,
    paddingBottom: 34,
    paddingHorizontal: 30,
    paddingTop: 14,
    width: '100%',
    alignSelf: 'center',
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.round,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  heading: { gap: 6, paddingTop: 18 },
  headingTitle: {
    color: colors.text,
    fontFamily: typography.family.extraBold,
    fontSize: 30,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  headingSubtitle: {
    color: colors.textMuted,
    fontFamily: typography.family.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  fieldGroup: { gap: 7 },
  fieldLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.bold,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: typography.family.regular,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  passwordInput: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  passwordTextInput: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: 16,
    height: 52,
    padding: 0,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputError: { backgroundColor: colors.warningSurface, borderColor: colors.warningText, borderWidth: 1.5 },
  inlineError: { alignItems: 'center', flexDirection: 'row-reverse', gap: 6 },
  inlineErrorBadge: {
    alignItems: 'center',
    backgroundColor: colors.warningText,
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  inlineErrorBadgeText: { color: colors.onAccent, fontFamily: typography.family.extraBold, fontSize: 11 },
  inlineErrorText: {
    color: colors.warningText,
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  formError: {
    alignItems: 'center',
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningText,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  errorBadge: {
    alignItems: 'center',
    backgroundColor: colors.warningText,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  errorBadgeText: { color: colors.onAccent, fontFamily: typography.family.extraBold, fontSize: 13 },
  formErrorText: {
    color: colors.warningText,
    flex: 1,
    fontFamily: typography.family.semibold,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 15,
    flexDirection: 'row-reverse',
    gap: 10,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: { backgroundColor: colors.surfaceMuted },
  primaryButtonText: { color: colors.onAccent, fontFamily: typography.family.bold, fontSize: 17 },
  disabledButtonText: { color: colors.textMuted },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 15,
    borderWidth: 1.5,
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonDisabled: { backgroundColor: colors.surfaceMuted },
  secondaryButtonText: { color: colors.textSoft, fontFamily: typography.family.semibold, fontSize: 17 },
  link: {
    color: colors.accent,
    fontFamily: typography.family.bold,
    fontSize: 15,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  statePage: { flex: 1, minHeight: 380, gap: 28 },
  stateCenter: { alignItems: 'stretch', gap: 16, justifyContent: 'center' },
  stateTitle: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 26, textAlign: 'center', writingDirection: 'rtl' },
  stateSubtitle: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: 16, lineHeight: 26, maxWidth: 300, textAlign: 'center', writingDirection: 'rtl' },
  stateActions: { gap: 12 },
  stateIcon: { alignItems: 'center', backgroundColor: colors.accentWeak, borderRadius: 24, height: 72, justifyContent: 'center', width: 72, alignSelf: 'flex-end' },
  stateIconDanger: { backgroundColor: colors.warningSurface },
  stateIconSolid: { backgroundColor: colors.accent, height: 104, width: 104 },
});
