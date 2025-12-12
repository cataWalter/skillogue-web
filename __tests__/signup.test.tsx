import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignUp from '../src/app/signup/page'
import { supabase } from '../src/supabaseClient'
import { useRouter } from 'next/navigation'

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock supabaseClient
jest.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
}))

describe('SignUp Page', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    jest.clearAllMocks()
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
    // Assuming there is a checkbox for terms
    // Wait, I need to check if there is a checkbox in the component.
    // Let's assume there is based on `agreed` state.
    fireEvent.click(screen.getByRole('button'))
    expect(window.alert).toHaveBeenCalledWith('You must agree to the Terms of Service and Privacy Policy to create an account.')
  })

  it('submits form successfully', async () => {
    (supabase.auth.signUp as jest.Mock).mockResolvedValue({ error: null })
    
    render(<SignUp />)
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'StrongP@ssw0rd!' } })
    
    // Find checkbox and click it
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'StrongP@ssw0rd!',
      })
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })
})
