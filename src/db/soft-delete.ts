import { isNull } from 'drizzle-orm';

import { users, orders, coupons, products, giftCards, businesses, giftCardRedemptions } from './schema';

export const notDeletedUser = isNull(users.deletedAt);
export const notDeletedBusiness = isNull(businesses.deletedAt);
export const notDeletedProduct = isNull(products.deletedAt);
export const notDeletedOrder = isNull(orders.deletedAt);
export const notDeletedGiftCard = isNull(giftCards.deletedAt);
export const notDeletedCoupon = isNull(coupons.deletedAt);
export const notDeletedGiftCardRedemption = isNull(giftCardRedemptions.deletedAt);
