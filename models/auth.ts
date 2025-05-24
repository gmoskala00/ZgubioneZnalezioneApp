export type AuthCredentials = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string;
};

export type AuthValidationState = {
  username: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
  phoneNumber: boolean;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type UserData = {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
};
