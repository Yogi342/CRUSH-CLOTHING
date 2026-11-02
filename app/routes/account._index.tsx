import {redirect} from 'react-router';
import type {Route} from './+types/account._index';

export async function loader({context}: Route.LoaderArgs) {
  try {
    const isLoggedIn = await context.customerAccount.isLoggedIn().catch(() => false);
    if (isLoggedIn) {
      return redirect('/account/orders');
    }
  } catch {
    // Keep user on /account sign-in view
  }
  return null;
}

export default function AccountIndex() {
  return null;
}
