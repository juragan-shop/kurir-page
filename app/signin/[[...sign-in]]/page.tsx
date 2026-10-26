"use client"
import { SignIn } from '@clerk/nextjs'
import { Suspense } from 'react'


export default function Page() {
  return (
    <div className='flex items-center justify-center min-h-screen bg-slate-50'>
      <Suspense>
        <SignIn
          signUpUrl='/signup'


        />
      </Suspense>
    </div>
  )
}