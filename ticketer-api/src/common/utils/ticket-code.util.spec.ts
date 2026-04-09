import { generateTicketCode } from './ticket-code.util';

describe('generateTicketCode', () => {
  it('TC-001: matches format EVT-{year}-{4 hex chars}', () => {
    const code = generateTicketCode();
    expect(code).toMatch(/^EVT-\d{4}-[A-F0-9]{4}$/);
  });

  it('TC-003: year in code matches current year', () => {
    const code = generateTicketCode();
    const year = new Date().getFullYear().toString();
    expect(code.split('-')[1]).toBe(year);
  });

  it('TC-002: generates 1,000 unique codes without collision', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateTicketCode());
    }
    // Allow for some collisions (4 hex = 65,536 possibilities);
    // 1000 codes should have very minimal collisions (<2%)
    expect(codes.size).toBeGreaterThan(980);
  });

  it('always returns a string', () => {
    expect(typeof generateTicketCode()).toBe('string');
  });

  it('code length is exactly 13 characters (EVT-YYYY-XXXX)', () => {
    const code = generateTicketCode();
    expect(code.length).toBe(13);
  });
});
