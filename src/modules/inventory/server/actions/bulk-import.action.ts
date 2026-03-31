'use server';

import { eq, and } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db/drizzle';
import { products, businesses } from '@/db/schema';
import { generateSlug } from '@/modules/businesses/lib/slug';
import { generateSku } from '@/modules/products/lib/generate-sku';

interface BulkProductRow {
  name: string;
  description?: string;
  price: string;
  sku?: string;
  stock?: number;
  category?: string;
  type?: 'product' | 'service';
}

const MAX_BULK_IMPORT_ROWS = 500;

export async function bulkImportProductsAction(businessId: string, rows: BulkProductRow[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    if (rows.length > MAX_BULK_IMPORT_ROWS) {
      return { error: `Máximo ${MAX_BULK_IMPORT_ROWS} productos por importación` };
    }

    const [business] = await db
      .select({ id: businesses.id, slug: businesses.slug })
      .from(businesses)
      .where(and(eq(businesses.id, businessId), eq(businesses.userId, session.user.id)))
      .limit(1);
    if (!business) return { error: 'No autorizado' };

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.name?.trim()) {
        skipped++;
        continue;
      }

      const isService = row.type === 'service';

      await db.insert(products).values({
        businessId,
        name: row.name.trim(),
        slug: generateSlug(row.name.trim()),
        description: row.description?.trim() || null,
        price: row.price || '0',
        sku: row.sku?.trim() || generateSku(business.slug),
        stock: isService ? null : (row.stock ?? 0),
        type: row.type ?? 'product',
        trackInventory: !isService,
        status: 'active',
      });

      created++;
    }

    return { success: true, created, skipped };
  } catch {
    return { error: 'Error al importar productos.' };
  }
}
