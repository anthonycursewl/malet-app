// Validation tests - Pure TypeScript logic testing
// Run with: node __tests__/validation.test.js

let tests = [];
let passed = 0;
let failed = 0;

function describe(name, fn) {
  console.log(`\nDescribe: ${name}`);
  fn();
}

function it(name, fn) {
  tests.push({ name, fn });
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
    },
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected truthy, got ${actual}`);
    },
    toBeFalsy: () => {
      if (actual) throw new Error(`Expected falsy, got ${actual}`);
    },
  };
}

// Validation functions
const validateEmail = (email) => {
  if (!email.trim()) return { valid: false, error: 'El correo es requerido' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return { valid: false, error: 'Formato de correo inválido' };
  return { valid: true };
};

const validatePassword = (password) => {
  if (!password) return { valid: false, error: 'La contraseña es requerida' };
  if (password.length < 6) return { valid: false, error: 'Mínimo 6 caracteres' };
  return { valid: true };
};

// Tests
describe('Validation', () => {
  describe('validateEmail', () => {
    it('returns error for empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBeFalsy();
    });

    it('returns error for whitespace only', () => {
      const result = validateEmail('   ');
      expect(result.valid).toBeFalsy();
    });

    it('returns error for email without @', () => {
      const result = validateEmail('testexample.com');
      expect(result.valid).toBeFalsy();
    });

    it('returns valid for correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBeTruthy();
    });

    it('returns valid for email with subdomain', () => {
      const result = validateEmail('test@mail.example.com');
      expect(result.valid).toBeTruthy();
    });
  });

  describe('validatePassword', () => {
    it('returns error for empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBeFalsy();
    });

    it('returns error for password less than 6 chars', () => {
      const result = validatePassword('12345');
      expect(result.valid).toBeFalsy();
    });

    it('returns valid for password with 6 chars', () => {
      const result = validatePassword('abcdef');
      expect(result.valid).toBeTruthy();
    });

    it('returns valid for password with more than 6 chars', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBeTruthy();
    });
  });
});

// Run tests
tests.forEach(({ name, fn }) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);