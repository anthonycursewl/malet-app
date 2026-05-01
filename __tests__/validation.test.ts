describe('Validation Utils', () => {
  describe('validateEmail', () => {
    const validateEmail = (email: string): { valid: boolean; error?: string } => {
      if (!email.trim()) {
        return { valid: false, error: 'El correo es requerido' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { valid: false, error: 'Formato de correo inválido' };
      }
      return { valid: true };
    };

    it('returns error for empty email', () => {
      expect(validateEmail('').valid).toBe(false);
    });

    it('returns error for whitespace only', () => {
      expect(validateEmail('   ').valid).toBe(false);
    });

    it('returns error for email without @', () => {
      expect(validateEmail('testexample.com').valid).toBe(false);
    });

    it('returns valid for correct email', () => {
      expect(validateEmail('test@example.com').valid).toBe(true);
    });

    it('returns valid for email with subdomain', () => {
      expect(validateEmail('test@mail.example.com').valid).toBe(true);
    });
  });

  describe('validatePassword', () => {
    const validatePassword = (password: string): { valid: boolean; error?: string } => {
      if (!password) {
        return { valid: false, error: 'La contraseña es requerida' };
      }
      if (password.length < 6) {
        return { valid: false, error: 'Mínimo 6 caracteres' };
      }
      return { valid: true };
    };

    it('returns error for empty password', () => {
      expect(validatePassword('').valid).toBe(false);
    });

    it('returns error for password less than 6 chars', () => {
      expect(validatePassword('12345').valid).toBe(false);
    });

    it('returns valid for password with 6 chars', () => {
      expect(validatePassword('abcdef').valid).toBe(true);
    });

    it('returns valid for password with more than 6 chars', () => {
      expect(validatePassword('password123').valid).toBe(true);
    });
  });
});