import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { vi } from 'vitest';
import { addDoc } from 'firebase/firestore';

// Mock Firebase
vi.mock('./firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn()
}));

// Mock Spline component to avoid loading 3D assets in tests
vi.mock('@splinetool/react-spline', () => {
  return {
    default: () => <div data-testid="spline-mock" />
  };
});

describe('App', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();

    // Setup window.location mock
    Object.defineProperty(window, 'location', {
      value: {
        assign: vi.fn(),
      },
      writable: true,
    });
  });

  it('renders main layout', () => {
    render(<App />);
    expect(screen.getByText(/WAITAMINUTE/)).toBeInTheDocument();
    expect(screen.getByText(/ARCHITECT YOUR/)).toBeInTheDocument();
  });

  it('opens and closes mobile menu', () => {
    render(<App />);

    const menuButton = screen.getByLabelText('Toggle menu');
    fireEvent.click(menuButton);

    // The links in the mobile menu should become visible
    // We get all links and check if the second occurrence (mobile one) exists
    const packagesLinks = screen.getAllByText('Packages');
    expect(packagesLinks.length).toBeGreaterThan(1);

    // Close menu
    fireEvent.click(menuButton);
  });

  it('opens lead modal when Get Audit is clicked', async () => {
    render(<App />);

    // Click "Get Audit" button (using the first one found, e.g. desktop)
    const getAuditButtons = screen.getAllByText('Get Audit');
    fireEvent.click(getAuditButtons[0]);

    // Wait for the modal to be visible by checking for its content
    await waitFor(() => {
      expect(screen.getByText('Initiate System Audit')).toBeInTheDocument();
    });

    // The modal fields should be present
    expect(screen.getByPlaceholderText('COMMANDER NAME')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('COMM LINK / EMAIL')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('PROJECT SCOPE')).toBeInTheDocument();
  });

  it('validates lead form in the modal', async () => {
    render(<App />);

    // Open modal
    const getAuditButtons = screen.getAllByText('Get Audit');
    fireEvent.click(getAuditButtons[0]);

    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByText('Initiate System Audit')).toBeInTheDocument();
    });

    // Submit form without filling fields
    const submitBtn = screen.getByText('Submit');
    fireEvent.click(submitBtn);

    // Validation messages should appear
    await waitFor(() => {
      expect(screen.getByText('Name is required.')).toBeInTheDocument();
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Project scope is required.')).toBeInTheDocument();
    });

    // Fill in partial data and verify errors disappear selectively
    const nameInput = screen.getByPlaceholderText('COMMANDER NAME');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText('Name is required.')).not.toBeInTheDocument();
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
    });
  });

  it('submits lead form successfully', async () => {
    render(<App />);

    // Open modal
    const getAuditButtons = screen.getAllByText('Get Audit');
    fireEvent.click(getAuditButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Initiate System Audit')).toBeInTheDocument();
    });

    // Fill in data
    const nameInput = screen.getByPlaceholderText('COMMANDER NAME');
    const emailInput = screen.getByPlaceholderText('COMM LINK / EMAIL');
    const scopeInput = screen.getByPlaceholderText('PROJECT SCOPE');

    fireEvent.change(nameInput, { target: { value: 'Test Commander' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(scopeInput, { target: { value: 'Test Project Scope' } });

    // Submit form
    const submitBtn = screen.getByText('Submit');
    fireEvent.click(submitBtn);

    // Verify processing state
    await waitFor(() => {
      expect(submitBtn.innerText).toBe('Processing...');
    });

    // Since we mocked addDoc, it should have been called
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });

    // Verify it redirects
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith('https://calendar.app.google/YQ9z17s9n56J9GwL9');
    });
  });

  it('handles lead form submission error gracefully', async () => {
    // Mock console.error to track calls and avoid cluttering test output
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Force addDoc to throw an error
    const testError = new Error('Firebase connection failed');
    (addDoc as vi.Mock).mockRejectedValueOnce(testError);

    render(<App />);

    // Open modal
    const getAuditButtons = screen.getAllByText('Get Audit');
    fireEvent.click(getAuditButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Initiate System Audit')).toBeInTheDocument();
    });

    // Fill in data
    const nameInput = screen.getByPlaceholderText('COMMANDER NAME');
    const emailInput = screen.getByPlaceholderText('COMM LINK / EMAIL');
    const scopeInput = screen.getByPlaceholderText('PROJECT SCOPE');

    fireEvent.change(nameInput, { target: { value: 'Test Commander' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(scopeInput, { target: { value: 'Test Project Scope' } });

    // Submit form
    const submitBtn = screen.getByText('Submit');
    fireEvent.click(submitBtn);

    // Verify error was logged correctly
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Firebase bypassed:", testError);
    });

    // Verify it STILL redirects despite the error
    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith('https://calendar.app.google/YQ9z17s9n56J9GwL9');
    });

    consoleErrorSpy.mockRestore();
  });
});
