export interface ValidationResult {
  isValid: boolean;
  message?: string;
  details?: any;
}

export interface CredentialValidator {
  validate(credential: string): Promise<ValidationResult>;
}
