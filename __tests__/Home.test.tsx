import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Home from '../src/app/page'

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', { level: 1 })
    screen.getByRole('link', { name: /get started/i })

    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('Connect by Passion')
  })

  it('renders a section heading before feature card headings', () => {
    render(<Home />)

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /core features/i,
      })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /passion-based matching/i,
      })
    ).toBeInTheDocument()
  })
})