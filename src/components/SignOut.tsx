import React from 'react'
import {getAuth} from 'firebase/auth';
import { useTranslation } from 'react-i18next';

export const SignOut = () => {
const auth = getAuth();
  return (
    <button onClick={()=>{auth.signOut()}}>SignOut</button>
  )
}
