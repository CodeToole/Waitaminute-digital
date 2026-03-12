import { render, screen, fireEvent } from '@testing-library/react';
import App from './src/App';
import { vi } from 'vitest';

vi.mock('./src/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn()
}));

vi.mock('@splinetool/react-spline', () => {
  return {
    default: () => <div data-testid="spline-mock" />
  };
});

describe('App Benchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { assign: vi.fn() },
      writable: true,
    });
  });

  it('measures form submission time', () => {
    render(<App />);
    const getAuditButtons = screen.getAllByText('Get Audit');
    fireEvent.click(getAuditButtons[0]);

    const nameInput = screen.getByPlaceholderText('COMMANDER NAME');
    const emailInput = screen.getByPlaceholderText('COMM LINK / EMAIL');
    const scopeInput = screen.getByPlaceholderText('PROJECT SCOPE');

    (nameInput as HTMLInputElement).value = 'Test Commander';
    (emailInput as HTMLInputElement).value = 'test@example.com';
    (scopeInput as HTMLTextAreaElement).value = 'Test Project Scope';

    const submitBtn = screen.getByText('Submit');

    const start = performance.now();
    for (let i = 0; i < 5000; i++) {
        fireEvent.click(submitBtn);
    }
    const end = performance.now();
    console.log(`Benchmark: 5000 submits took ${end - start}ms`);
  });
});
