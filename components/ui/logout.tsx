
'use client';

import { useClerk } from '@clerk/nextjs';

export default function LogoutButton() {
  const { signOut } = useClerk();

  const handleLogout = async () => {
    await signOut({
      redirectUrl: '/signin',
    });
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
