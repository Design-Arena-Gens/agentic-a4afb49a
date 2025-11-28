export type PurchaseActionState = {
  success: boolean;
  message?: string;
};

export const initialPurchaseState: PurchaseActionState = {
  success: false,
};
