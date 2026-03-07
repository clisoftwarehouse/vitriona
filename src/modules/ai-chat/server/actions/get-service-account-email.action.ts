'use server';

import { getServiceAccountEmail } from '../lib/calendar';

export async function getServiceAccountEmailAction(): Promise<string | null> {
  return getServiceAccountEmail();
}
