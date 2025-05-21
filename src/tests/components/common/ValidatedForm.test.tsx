import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ValidatedClientForm } from '@/components/examples/ValidatedForm';
import { api } from '@/lib/api-utils';

// Mock the API utility
vi.mock('@/lib/api-utils', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('ValidatedClientForm', () => {
  it('should validate required fields', async () => {
    // Setup
    const user = userEvent.setup();
    render(<ValidatedClientForm />);
    
    // Submit the form without filling required fields
    const submitButton = screen.getByRole('button', { name: /запази/i });
    await user.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/името на клиента е задължително/i)).toBeInTheDocument();
      expect(screen.getByText(/адресът е задължителен/i)).toBeInTheDocument();
      expect(screen.getByText(/градът е задължителен/i)).toBeInTheDocument();
    });
  });
  
  it('should submit the form with valid data', async () => {
    // Mock successful API response
    (api.post as any).mockResolvedValue({
      success: true,
      data: { id: '1' },
    });
    
    // Setup
    const user = userEvent.setup();
    render(<ValidatedClientForm />);
    
    // Fill in the required fields
    await user.type(screen.getByPlaceholder(/име на фирма или лице/i), 'Test Client');
    await user.type(screen.getByPlaceholder(/ул\. примерна/i), 'Test Address 123');
    await user.type(screen.getByPlaceholder(/софия/i), 'София');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /запази/i });
    await user.click(submitButton);
    
    // Check if API was called with correct data
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/clients',
        expect.objectContaining({
          name: 'Test Client',
          address: 'Test Address 123',
          city: 'София',
          country: 'BG',
        })
      );
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/клиентът беше създаден успешно/i)).toBeInTheDocument();
    });
  });
  
  it('should handle API errors', async () => {
    // Mock API error response
    (api.post as any).mockResolvedValue({
      success: false,
      error: {
        message: 'Грешка при създаване на клиент',
      },
    });
    
    // Setup
    const user = userEvent.setup();
    render(<ValidatedClientForm />);
    
    // Fill in the required fields
    await user.type(screen.getByPlaceholder(/име на фирма или лице/i), 'Test Client');
    await user.type(screen.getByPlaceholder(/ул\. примерна/i), 'Test Address 123');
    await user.type(screen.getByPlaceholder(/софия/i), 'София');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /запази/i });
    await user.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/грешка при създаване на клиент/i)).toBeInTheDocument();
    });
  });
}); 