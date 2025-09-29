// =============================================================================
// CLSX UTILITIES - For Conditional CSS Classes
// =============================================================================

type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: any }
  | ClassValue[];

// Utility for conditional class names
export function clsx(...inputs: ClassValue[]): string {
  let i, len, input, type;
  let classes = '';
  let hasOwn = Object.prototype.hasOwnProperty;

  for (i = 0, len = inputs.length; i < len; i++) {
    input = inputs[i];
    if (input == null) continue;

    type = typeof input;

    if (type === 'string' || type === 'number') {
      classes += ' ' + input;
    } else if (Array.isArray(input)) {
      classes += ' ' + clsx(...input);
    } else if (type === 'object') {
      for (let key in input) {
        if (hasOwn.call(input, key) && input[key]) {
          classes += ' ' + key;
        }
      }
    }
  }

  return classes.substring(1);
}

// Re-export clsx as cn for consistent usage
export const cn = clsx;