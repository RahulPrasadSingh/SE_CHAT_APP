import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Auth from '@/pages/auth';
import { apiClient } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn()
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn()
  }
}));

vi.mock('@/store', () => ({
  useAppStore: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe('Auth Component', () => {
  const mockNavigate = vi.fn();
  const mockSetUserInfo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useAppStore.mockReturnValue({ setUserInfo: mockSetUserInfo });
  });

  describe('Rendering', () => {
    it('should render the welcome message and tabs', () => {
      render(<Auth />);
      expect(screen.getByText('Welcome')).toBeInTheDocument();
      expect(screen.getAllByText(/Login/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Sign\s?Up/i)).toBeInTheDocument();
    });

    it('should show the login form by default', () => {
      render(<Auth />);
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Confirm Password')).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should show error when email is empty for login', () => {
      render(<Auth />);
      const loginButton = screen.getAllByText(/Login/i)[1];
      fireEvent.click(loginButton);
      expect(toast.error).toHaveBeenCalledWith('Email is required.');
    });

    it('should show error when password is empty for login', () => {
      render(<Auth />);
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
      const loginButton = screen.getAllByText(/Login/i)[1];
      fireEvent.click(loginButton);
      expect(toast.error).toHaveBeenCalledWith('Password is required.');
    });

    // it('should show error when email is empty for signup', () => {
    //   render(<Auth />);
    //   fireEvent.click(screen.getByText(/Sign\s?Up/i));
    //   const signupButton = screen.getAllByText(/Sign\s?Up/i)[1];
    //   fireEvent.click(signupButton);
    //   expect(toast.error).toHaveBeenCalledWith('Email is required.');
    // });

    // it('should show error when passwords do not match', () => {
    //   render(<Auth />);
    //   fireEvent.click(screen.getByText(/Sign\s?Up/i));
    //   fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    //   fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    //   fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'password456' } });
    //   fireEvent.click(screen.getAllByText(/Sign\s?Up/i)[1]);
    //   expect(toast.error).toHaveBeenCalledWith('Passwords do not match.');
    // });
  });

  describe('API Calls and Navigation', () => {
    it('should call API and navigate on successful login', async () => {
      const mockResponse = { data: { user: { id: 1, profileSetup: true } } };
      apiClient.post.mockResolvedValueOnce(mockResponse);

      render(<Auth />);
      fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
      fireEvent.click(screen.getAllByText(/Login/i)[1]);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith(expect.any(String), { email: 'test@example.com', password: 'password123' }, { withCredentials: true });
        expect(mockSetUserInfo).toHaveBeenCalledWith(mockResponse.data.user);
        expect(mockNavigate).toHaveBeenCalledWith('/chat');
      });
    });

    // it('should call API and navigate on successful signup', async () => {
    //   const mockResponse = { status: 201, data: { user: { id: 1 } } };
    //   apiClient.post.mockResolvedValueOnce(mockResponse);

    //   render(<Auth />);
    //   fireEvent.click(screen.getByText(/Sign\s?Up/i));
    //   fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    //   fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    //   fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'password123' } });
    //   fireEvent.click(screen.getAllByText(/Sign\s?Up/i)[1]);

    //   await waitFor(() => {
    //     expect(apiClient.post).toHaveBeenCalledWith(expect.any(String), { email: 'test@example.com', password: 'password123' }, { withCredentials: true });
    //     expect(mockSetUserInfo).toHaveBeenCalledWith(mockResponse.data.user);
    //     expect(mockNavigate).toHaveBeenCalledWith('/profile');
    //   });
    // });
  });

  // describe('Loading State', () => {
  //   it('should disable login button during API request', async () => {
  //     const mockResponse = { data: { user: { id: 1 } } };
  //     apiClient.post.mockResolvedValueOnce(new Promise(resolve => setTimeout(() => resolve(mockResponse), 1000)));

  //     render(<Auth />);
  //     fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
  //     fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });

  //     const loginButton = screen.getAllByText(/Login/i)[1];
  //     fireEvent.click(loginButton);

  //     await waitFor(() => {
  //       expect(loginButton).toBeDisabled();
  //     });

  //     await waitFor(() => {
  //       expect(loginButton).toBeEnabled();
  //     });
  //   });

  //   it('should show loading text on button during API request', async () => {
  //     const mockResponse = { data: { user: { id: 1 } } };
  //     apiClient.post.mockResolvedValueOnce(new Promise(resolve => setTimeout(() => resolve(mockResponse), 1000)));

  //     render(<Auth />);
  //     fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
  //     fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });

  //     const loginButton = screen.getAllByText(/Login/i)[1];
  //     fireEvent.click(loginButton);

  //     await waitFor(() => {
  //       expect(screen.getByText(/logging in.../i)).toBeInTheDocument();
  //     });
  //   });
  // });
});
