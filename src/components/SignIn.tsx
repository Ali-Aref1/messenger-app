import React from 'react'
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

export const SignIn = () => {
  const { t } = useTranslation();
    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        const auth = getAuth();
        signInWithPopup(auth, provider);
    }
  return (
    <button onClick={signInWithGoogle}>{t('sign_in')}</button>
  )
}
