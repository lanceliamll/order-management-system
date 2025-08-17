/**
 * Type for validation rules
 */
export type ValidationRule = (value: any) => string | null;

/**
 * Validation error map
 */
export type ValidationErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Creates a required field validation rule
 * 
 * @param message Optional custom error message
 * @returns Validation rule function
 */
export function required(message: string = 'This field is required'): ValidationRule {
  return (value: any) => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    
    if (Array.isArray(value) && value.length === 0) {
      return message;
    }
    
    return null;
  };
}

/**
 * Creates a minimum length validation rule
 * 
 * @param min Minimum length
 * @param message Optional custom error message
 * @returns Validation rule function
 */
export function minLength(min: number, message?: string): ValidationRule {
  return (value: string) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return null;
  };
}

/**
 * Creates a maximum length validation rule
 * 
 * @param max Maximum length
 * @param message Optional custom error message
 * @returns Validation rule function
 */
export function maxLength(max: number, message?: string): ValidationRule {
  return (value: string) => {
    if (value && value.length > max) {
      return message || `Must be at most ${max} characters`;
    }
    return null;
  };
}

/**
 * Creates a pattern validation rule
 * 
 * @param pattern Regex pattern
 * @param message Optional custom error message
 * @returns Validation rule function
 */
export function pattern(pattern: RegExp, message: string = 'Invalid format'): ValidationRule {
  return (value: string) => {
    if (value && !pattern.test(value)) {
      return message;
    }
    return null;
  };
}

/**
 * Creates an email validation rule
 * 
 * @param message Optional custom error message
 * @returns Validation rule function
 */
export function email(message: string = 'Invalid email address'): ValidationRule {
  return pattern(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    message
  );
}

/**
 * Creates a numeric validation rule
 * 
 * @param message Optional custom error message
 * @returns Validation rule function
 */
export function numeric(message: string = 'Must be a number'): ValidationRule {
  return (value: any) => {
    if (value && isNaN(Number(value))) {
      return message;
    }
    return null;
  };
}

/**
 * Creates a minimum value validation rule
 * 
 * @param min Minimum value
 * @param message Optional custom error message
 * @returns Validation rule function
 */
export function min(min: number, message?: string): ValidationRule {
  return (value: any) => {
    if (value && Number(value) < min) {
      return message || `Must be at least ${min}`;
    }
    return null;
  };
}

/**
 * Creates a maximum value validation rule
 * 
 * @param max Maximum value
 * @param message Optional custom error message
 * @returns Validation rule function
 */
export function max(max: number, message?: string): ValidationRule {
  return (value: any) => {
    if (value && Number(value) > max) {
      return message || `Must be at most ${max}`;
    }
    return null;
  };
}

/**
 * Validates an object against a set of validation rules
 * 
 * @param data Object to validate
 * @param rules Validation rules
 * @returns Validation errors or null if valid
 */
export function validateForm<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, ValidationRule[]>
): ValidationErrors<T> | null {
  const errors: ValidationErrors<T> = {};
  let hasErrors = false;

  for (const field in rules) {
    if (Object.prototype.hasOwnProperty.call(rules, field)) {
      const fieldRules = rules[field];
      const value = data[field];
      
      for (const rule of fieldRules) {
        const error = rule(value);
        
        if (error) {
          errors[field] = error;
          hasErrors = true;
          break;
        }
      }
    }
  }

  return hasErrors ? errors : null;
}
