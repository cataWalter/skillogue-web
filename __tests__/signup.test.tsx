import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignUp from '../src/app/signup/page'
import { useRouter } from 'next/navigation'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock useAuth hook
const mockSignUp = jest.fn();
jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
  }),
}))

describe('SignUp Page', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    jest.clearAllMocks()
    mockSignUp.mockReset();
    // Mock alert
    window.alert = jest.fn()
  })

  it('renders signup form', () => {
    render(<SignUp />)
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    // Note: Button text might be "Sign Up" or similar, checking role button
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('validates empty fields', async () => {
    render(<SignUp />)
    fireEvent.click(screen.getByRole('button'))
    expect(window.alert).toHaveBeenCalledWith('Please fill in both fields')
  })

  it('validates password strength', async () => {
    render(<SignUp />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'weak' } })
    fireEvent.click(screen.getByRole('button'))
    expect(window.alert).toHaveBeenCalledWith('Please ensure your password meets all the strength requirements.')
  })

  it('validates terms agreement', async () => {
    render(<SignUp />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'StrongP@ssw0rd!' } })
    fireEvent.click(screen.getByRole('button'))
    expect(window.alert).toHaveBeenCalledWith('You must agree to the Terms of Service and Privacy Policy to create an account.')
  })

  it('submits form successfully', async () => {
    mockSignUp.mockResolvedValue({})
    
    render(<SignUp />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'StrongP@ssw0rd!' } })
    
    // Find checkbox and click it
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'StrongP@ssw0rd!')
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('handles signup error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSignUp.mockRejectedValue(new Error('Signup failed'));

    render(<SignUp />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'StrongP@ssw0rd!' } });
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Signup failed');
    });

    consoleSpy.mockRestore()
  });
})