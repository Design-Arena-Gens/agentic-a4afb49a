export type ProductActionState = {
  success: boolean;
  message?: string;
};

export const initialProductState: ProductActionState = {
  success: false,
};
