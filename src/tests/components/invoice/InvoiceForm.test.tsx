import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceForm } from '@/components/invoice/InvoiceForm';
import { api } from '@/lib/api-utils';

// Mock the API utility
vi.mock('@/lib/api-utils', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('InvoiceForm', () => {
  it('should validate required fields', async () => {
    // Setup
    const user = userEvent.setup();
    render(<InvoiceForm />);
    
    // Find form elements
    const submitButton = screen.getByRole('button', { name: /запази|създай/i });
    
    // Act - Submit with empty form
    await user.click(submitButton);
    
    // Assert - Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/клиентът е задължителен/i)).toBeInTheDocument();
      expect(screen.getByText(/фирмата е задължителна/i)).toBeInTheDocument();
    });
  });
  
  it('should successfully submit valid form data', async () => {
    // Mock API response
    (api.post as any).mockResolvedValue({
      success: true,
      data: {
        id: '1',
        invoiceNumber: 'INV-2023-00001',
      },
    });
    
    // Setup
    const user = userEvent.setup();
    render(<InvoiceForm />);
    
    // Find form elements
    const clientSelect = screen.getByLabelText(/клиент/i);
    const companySelect = screen.getByLabelText(/компания/i);
    const issueDateInput = screen.getByLabelText(/дата на издаване/i);
    const dueDateInput = screen.getByLabelText(/падеж/i);
    const addItemButton = screen.getByRole('button', { name: /добави артикул/i });
    const submitButton = screen.getByRole('button', { name: /запази|създай/i });
    
    // Fill the form
    await user.selectOptions(clientSelect, '1');
    await user.selectOptions(companySelect, '1');
    await user.clear(issueDateInput);
    await user.type(issueDateInput, '2023-06-15');
    await user.clear(dueDateInput);
    await user.type(dueDateInput, '2023-06-30');
    
    // Add an item
    await user.click(addItemButton);
    const descriptionInput = screen.getByLabelText(/описание/i);
    const quantityInput = screen.getByLabelText(/количество/i);
    const priceInput = screen.getByLabelText(/цена/i);
    
    await user.type(descriptionInput, 'Test Item');
    await user.clear(quantityInput);
    await user.type(quantityInput, '1');
    await user.clear(priceInput);
    await user.type(priceInput, '100');
    
    // Submit the form
    await user.click(submitButton);
    
    // Assert - Check if API was called with correct data
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/invoices', expect.objectContaining({
        clientId: '1',
        companyId: '1',
        issueDate: '2023-06-15',
        dueDate: '2023-06-30',
        items: expect.arrayContaining([
          expect.objectContaining({
            description: 'Test Item',
            quantity: 1,
            price: 100,
          }),
        ]),
      }));
    });
  });
  
  it('should handle API errors', async () => {
    // Mock API error response
    (api.post as any).mockResolvedValue({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Невалидни данни',
      },
    });
    
    // Setup
    const user = userEvent.setup();
    render(<InvoiceForm />);
    
    // Find form elements and fill with minimal valid data
    const clientSelect = screen.getByLabelText(/клиент/i);
    const companySelect = screen.getByLabelText(/компания/i);
    const issueDateInput = screen.getByLabelText(/дата на издаване/i);
    const dueDateInput = screen.getByLabelText(/падеж/i);
    const addItemButton = screen.getByRole('button', { name: /добави артикул/i });
    const submitButton = screen.getByRole('button', { name: /запази|създай/i });
    
    // Fill the form
    await user.selectOptions(clientSelect, '1');
    await user.selectOptions(companySelect, '1');
    await user.type(issueDateInput, '2023-06-15');
    await user.type(dueDateInput, '2023-06-30');
    
    // Add an item
    await user.click(addItemButton);
    const descriptionInput = screen.getByLabelText(/описание/i);
    const quantityInput = screen.getByLabelText(/количество/i);
    const priceInput = screen.getByLabelText(/цена/i);
    
    await user.type(descriptionInput, 'Test Item');
    await user.type(quantityInput, '1');
    await user.type(priceInput, '100');
    
    // Submit the form
    await user.click(submitButton);
    
    // Assert - Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/невалидни данни/i)).toBeInTheDocument();
    });
  });
}); 