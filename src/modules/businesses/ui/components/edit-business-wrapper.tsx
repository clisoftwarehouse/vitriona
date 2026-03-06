'use client';

import { BusinessForm } from './business-form';
import type { CreateBusinessFormValues } from '@/modules/businesses/ui/schemas/business.schemas';
import { updateBusinessAction } from '@/modules/businesses/server/actions/update-business.action';

interface EditBusinessWrapperProps {
  businessId: string;
  defaultValues: Partial<CreateBusinessFormValues>;
}

export function EditBusinessWrapper({ businessId, defaultValues }: EditBusinessWrapperProps) {
  const handleSubmit = async (values: CreateBusinessFormValues) => {
    return updateBusinessAction(businessId, values);
  };

  return <BusinessForm mode='edit' defaultValues={defaultValues} onSubmitAction={handleSubmit} />;
}
