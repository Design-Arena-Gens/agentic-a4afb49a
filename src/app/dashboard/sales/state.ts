export type SaleActionState = {
  success: boolean;
  message?: string;
};

export const initialSaleState: SaleActionState = {
  success: false,
};
