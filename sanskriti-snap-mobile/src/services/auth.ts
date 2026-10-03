import * as Linking from 'expo-linking';
import { useOAuth } from '@clerk/expo';

export function useGoogleSignIn() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  return async () => {
    const { createdSessionId, setActive } = await startOAuthFlow({
      redirectUrl: Linking.createURL('/oauth-native-callback', {
        scheme: 'sanskritisnap',
      }),
    });
    if (!createdSessionId) {
      throw new Error('Google sign-in did not create a session.');
    }
    await setActive?.({ session: createdSessionId });
  };
}
