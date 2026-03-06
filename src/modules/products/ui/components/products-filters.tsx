'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { productStatusOptions } from '@/modules/products/ui/schemas/product.schemas';
import { Select, SelectItem, SelectValue, SelectContent, SelectTrigger } from '@/components/ui/select';

interface Category {
  id: string;
  name: string;
}

interface ProductsFiltersProps {
  categories: Category[];
}

export function ProductsFilters({ categories }: ProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className='flex flex-wrap gap-3'>
      <Input
        placeholder='Buscar producto...'
        defaultValue={searchParams.get('search') ?? ''}
        onChange={(e) => updateParam('search', e.target.value)}
        className='w-full sm:max-w-xs'
      />
      <Select defaultValue={searchParams.get('status') ?? 'all'} onValueChange={(v) => updateParam('status', v)}>
        <SelectTrigger className='w-full sm:w-40'>
          <SelectValue placeholder='Estado' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Todos</SelectItem>
          {productStatusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {categories.length > 0 && (
        <Select
          defaultValue={searchParams.get('categoryId') ?? 'all'}
          onValueChange={(v) => updateParam('categoryId', v)}
        >
          <SelectTrigger className='w-full sm:w-44'>
            <SelectValue placeholder='Categoría' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
