export type LoginFormState = {
  success: boolean;
  message?: string;
};

export const initialLoginState: LoginFormState = {
  success: false,
};
