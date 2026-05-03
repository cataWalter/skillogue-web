import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignUp from '../src/app/signup/page'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() },
}))

const mockSignUp = jest.fn();
jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({ signUp: mockSignUp }),
}))

jest.mock('@clerk/nextjs', () => ({
  useSignUp: () => ({ signUp: null, isLoaded: true }),
}))

jest.mock('@clerk/nextjs/legacy', () => ({
  useSignIn: () => ({ signIn: { authenticateWithRedirect: jest.fn() } }),
}))

describe('SignUp Page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    jest.clearAllMocks()
    mockSignUp.mockReset()
  })

  it('renders signup form', () => {
    render(<SignUp />)
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('validates empty fields', async () => {
    render(<SignUp />)
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(toast.error).toHaveBeenCalledWith('Please fill in both fields', { id: 'signup-error' })
  })

  it('validates password strength', async () => {
    render(<SignUp />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'weak' } })
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    expect(toast.error).toHaveBeenCalled()
  })

  it('redirects to verify-email after successful signup', async () => {
    mockSignUp.mockResolvedValue({ requiresEmailVerification: true })
    render(<SignUp />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Strong#1Pass' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'Strong#1Pass')
      expect(mockPush).toHaveBeenCalledWith('/verify-email')
    })
  })

  it('shows an error toast on signup failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    mockSignUp.mockRejectedValue(new Error('Email already exists'))
    render(<SignUp />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Strong#1Pass' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => { expect(toast.error).toHaveBeenCalled() })
    consoleSpy.mockRestore()
  })
})
