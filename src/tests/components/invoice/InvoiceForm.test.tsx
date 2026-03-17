import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    back: vi.fn(),
  }),
}));

describe('InvoiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate required fields', async () => {
    // Setup
    const user = userEvent.setup();
    render(<InvoiceForm />);
    
    // Find form elements
    const formElement = document.querySelector('form')!;
    
    // Act - Submit with empty form
    fireEvent.submit(formElement);
    
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
    render(
      <InvoiceForm
        defaultValues={{
          clientId: '',
          companyId: '',
          issueDate: '2023-06-15',
          dueDate: '2023-06-30',
          status: 'DRAFT',
          items: [
            {
              description: 'Test Item',
              quantity: 1,
              price: 100,
              taxRate: 20,
            },
          ],
        }}
      />
    );
    
    // Find form elements
    const clientSelect = screen.getByLabelText(/клиент/i);
    const companySelect = screen.getByLabelText(/компания/i);
    const formElement = document.querySelector('form')!;
    
    // Fill the form
    await user.selectOptions(clientSelect, '1');
    await user.selectOptions(companySelect, '1');
    
    // Submit the form
    fireEvent.submit(formElement);
    
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
      expect(mockPush).toHaveBeenCalledWith('/invoices/1');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
  
  it('should handle API errors', async () => {
    // Mock API error response
    (api.post as any).mockResolvedValue({
      success: false,
      error: {
        message: 'Невалидни данни',
      },
    });
    
    // Setup
    const user = userEvent.setup();
    render(
      <InvoiceForm
        defaultValues={{
          clientId: '1',
          companyId: '1',
          issueDate: '2023-06-15',
          dueDate: '2023-06-30',
          status: 'DRAFT',
          items: [
            {
              description: 'Test Item',
              quantity: 1,
              price: 100,
              taxRate: 20,
            },
          ],
        }}
      />
    );
    
    // Find form elements and fill with minimal valid data
    const formElement = document.querySelector('form')!;
    
    // Submit the form
    fireEvent.submit(formElement);
    
    // Assert - Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/невалидни данни/i)).toBeInTheDocument();
    });
  });
}); 