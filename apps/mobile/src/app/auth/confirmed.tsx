import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthPrimaryButton, AuthScreen, AuthStateIcon, AuthStateView } from '@/features/auth/auth.components';
import { V2Card, V2Text } from '@/components/v2';

export default function ConfirmedRoute() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  return <AuthScreen><AuthStateView icon={<AuthStateIcon name={step === 0 ? 'checkmark' : 'leaf-outline'} />}
    title={step === 0 ? 'החשבון מוכן' : 'מתחילים בקצב שלך'}
    subtitle={step === 0 ? 'הכניסה הושלמה. אפשר להתחיל עם היום שלך.' : 'אפשר לאסוף משימות, לבחור מה מתאים להיום ולאשר את התכנון. הבחירה תמיד שלך.'}
    actions={<>
      {step === 1 ? <V2Card><V2Text variant="heading">היומן שלך, בנפרד</V2Text><V2Text muted>חיבורי Google ו־Apple עדיין אינם זמינים. אפשר להמשיך בלי חיבור ולהוסיף התחייבויות עם השעות שלהן ב־LifeOS.</V2Text></V2Card> : null}
      <AuthPrimaryButton title={step === 0 ? 'בואו נתחיל' : 'להיום שלי'} onPress={() => step === 0 ? setStep(1) : router.replace('/')} />
    </>} /></AuthScreen>;
}
