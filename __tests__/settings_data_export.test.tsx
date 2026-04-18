import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataExportPage from '../src/app/settings/data-export/page';
import { getUserData } from '../src/app/actions/export-data';
import { toast } from 'react-hot-toast';

jest.mock('../src/app/actions/export-data', () => ({
  getUserData: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('DataExportPage', () => {
  const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

  beforeAll(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn(() => 'blob:test'),
      writable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(() => undefined),
      writable: true,
    });
  });

  afterAll(() => {
    clickSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (getUserData as jest.Mock).mockResolvedValue({ profile: { id: 'user-1' } });
  });

  it('renders export details and downloads data when requested', async () => {
    render(<DataExportPage />);

    expect(screen.getByRole('heading', { name: 'Export Your Data' })).toBeInTheDocument();
    expect(screen.getByText('Before you export')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download My Data' }));

    await waitFor(() => {
      expect(getUserData).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Data export started');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('shows an error toast when exporting data fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (getUserData as jest.Mock).mockRejectedValueOnce(new Error('export failed'));

    render(<DataExportPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Download My Data' }));

    await waitFor(() => {
      expect(getUserData).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Export failed:', expect.any(Error));
      expect(toast.error).toHaveBeenCalledWith('Failed to export data');
    });

    consoleErrorSpy.mockRestore();
  });
});