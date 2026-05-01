import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Home from '../src/app/page'

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', { level: 1 })
    screen.getByRole('link', { name: /create free profile/i })

    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Find people who get your references')
  })

  it('renders the hero CTA links', () => {
    render(<Home />)

    const signupLink = screen.getByRole('link', { name: /create free profile/i })
    expect(signupLink).toHaveAttribute('href', '/signup')

    const faqLink = screen.getByRole('link', { name: /faq/i })
    expect(faqLink).toHaveAttribute('href', '/faq')
  })
})