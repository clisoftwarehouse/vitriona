'use client';

import { BusinessForm } from './business-form';
import { createBusinessAction } from '@/modules/businesses/server/actions/create-business.action';

export function CreateBusinessWrapper() {
  return <BusinessForm mode='create' onSubmitAction={createBusinessAction} />;
}
