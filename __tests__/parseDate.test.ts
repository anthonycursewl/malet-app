describe('parseDate', () => {
  const parseDate = (date: string | Date): string => {
    const initialDate = new Date(date);
    const now = new Date();
    const diffMilliseconds = now.getTime() - initialDate.getTime();

    if (diffMilliseconds < 0) {
      return "en el futuro";
    }

    const diffSeconds = Math.floor(diffMilliseconds / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30.437);
    const diffYears = Math.floor(diffDays / 365.25);

    if (diffMinutes < 1) {
      return "hace un momento";
    } else if (diffMinutes < 60) {
      return `hace ${diffMinutes} minuto${diffMinutes === 1 ? '' : 's'}`;
    } else if (diffHours < 24) {
      return `hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
    } else if (diffDays < 7) {
      return `hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;
    } else if (diffWeeks < 4) {
      return `hace ${diffWeeks} semana${diffWeeks === 1 ? '' : 's'}`;
    } else if (diffMonths < 12) {
      return `hace ${diffMonths} mes${diffMonths === 1 ? '' : 'es'}`;
    } else {
      return `hace ${diffYears} año${diffYears === 1 ? '' : 's'}`;
    }
  };

  it('returns "hace un momento" for recent dates', () => {
    const now = new Date();
    expect(parseDate(now)).toBe('hace un momento');
  });

  it('returns "hace X minuto(s)" for minutes ago', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(parseDate(fiveMinutesAgo)).toBe('hace 5 minutos');
  });

  it('returns "hace X hora(s)" for hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(parseDate(twoHoursAgo)).toBe('hace 2 horas');
  });

  it('returns "hace X día(s)" for days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(parseDate(threeDaysAgo)).toBe('hace 3 días');
  });

  it('returns singular for one unit', () => {
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    expect(parseDate(oneMinuteAgo)).toBe('hace 1 minuto');
    
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    expect(parseDate(oneHourAgo)).toBe('hace 1 hora');
    
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    expect(parseDate(oneDayAgo)).toBe('hace 1 día');
  });

  it('returns "en el futuro" for future dates', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(parseDate(future)).toBe('en el futuro');
  });

  it('handles string date input', () => {
    const dateString = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(parseDate(dateString)).toBe('hace 30 minutos');
  });
});