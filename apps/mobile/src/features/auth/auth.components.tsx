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

import { colors, radius, typography } from '@/theme/tokens';

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
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthHeading({ subtitle, title }: { subtitle: string; title: string }) {
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
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textFaint}
        selectionColor={colors.accent}
        style={[styles.input, error ? styles.inputError : null, style]}
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
          style={styles.passwordTextInput}
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
  const unavailable = disabled || isLoading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={unavailable}
      onPress={onPress}
      style={[styles.primaryButton, unavailable ? styles.primaryButtonDisabled : null]}
    >
      {isLoading ? <ActivityIndicator color={colors.white} size="small" /> : null}
      <Text style={[styles.primaryButtonText, unavailable && !isLoading ? styles.disabledButtonText : null]}>
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
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.secondaryButton, disabled ? styles.secondaryButtonDisabled : null]}
    >
      <Text style={[styles.secondaryButtonText, disabled ? styles.disabledButtonText : null]}>{title}</Text>
    </Pressable>
  );
}

export function AuthLink({ onPress, title }: { onPress: () => void; title: string }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={6} onPress={onPress}>
      <Text style={styles.link}>{title}</Text>
    </Pressable>
  );
}

export function AuthFormError({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" style={styles.formError}>
      <View style={styles.errorBadge}><Text style={styles.errorBadgeText}>!</Text></View>
      <Text selectable style={styles.formErrorText}>{message}</Text>
    </View>
  );
}

export function InlineError({ message }: { message: string }) {
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
  const solid = tone === 'solid';
  return (
    <View style={[
      styles.stateIcon,
      tone === 'danger' ? styles.stateIconDanger : null,
      solid ? styles.stateIconSolid : null,
    ]}>
      <Ionicons color={solid ? colors.white : tone === 'danger' ? '#C77A5A' : colors.accent} name={name} size={48} />
    </View>
  );
}

const styles = StyleSheet.create({
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
    height: 54,
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
    height: 54,
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
  inputError: { backgroundColor: '#FBF3EF', borderColor: '#DDA588', borderWidth: 1.5 },
  inlineError: { alignItems: 'center', flexDirection: 'row-reverse', gap: 6 },
  inlineErrorBadge: {
    alignItems: 'center',
    backgroundColor: '#C77A5A',
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  inlineErrorBadgeText: { color: colors.white, fontFamily: typography.family.extraBold, fontSize: 11 },
  inlineErrorText: {
    color: '#B5623C',
    flex: 1,
    fontFamily: typography.family.regular,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  formError: {
    alignItems: 'center',
    backgroundColor: '#FAF0EB',
    borderColor: '#E7C6B4',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row-reverse',
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  errorBadge: {
    alignItems: 'center',
    backgroundColor: '#C77A5A',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  errorBadgeText: { color: colors.white, fontFamily: typography.family.extraBold, fontSize: 13 },
  formErrorText: {
    color: '#A8502F',
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
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: { backgroundColor: '#E3DDD0' },
  primaryButtonText: { color: colors.white, fontFamily: typography.family.bold, fontSize: 17 },
  disabledButtonText: { color: '#B0AA9C' },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#DCD6C9',
    borderRadius: 15,
    borderWidth: 1.5,
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonDisabled: { backgroundColor: '#EFEBE1' },
  secondaryButtonText: { color: colors.textSoft, fontFamily: typography.family.semibold, fontSize: 17 },
  link: {
    color: colors.accent,
    fontFamily: typography.family.bold,
    fontSize: 15,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  statePage: { flex: 1, minHeight: 680 },
  stateCenter: { alignItems: 'center', flex: 1, gap: 16, justifyContent: 'center' },
  stateTitle: { color: colors.text, fontFamily: typography.family.extraBold, fontSize: 26, textAlign: 'center', writingDirection: 'rtl' },
  stateSubtitle: { color: colors.textMuted, fontFamily: typography.family.regular, fontSize: 16, lineHeight: 26, maxWidth: 300, textAlign: 'center', writingDirection: 'rtl' },
  stateActions: { gap: 12 },
  stateIcon: { alignItems: 'center', backgroundColor: colors.accentWeak, borderRadius: 52, height: 100, justifyContent: 'center', width: 100 },
  stateIconDanger: { backgroundColor: '#F4E9E2' },
  stateIconSolid: { backgroundColor: colors.accent, height: 104, width: 104 },
});
