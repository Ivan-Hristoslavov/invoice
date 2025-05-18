// Export invoices as CSV
export async function exportInvoicesToCsv(filters?: {
  companyId?: string;
  clientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<void> {
  // Build the query parameters
  const params = new URLSearchParams({
    format: 'csv',
  });

  if (filters) {
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
  }

  // Call the export API endpoint
  const response = await fetch(`/api/invoices/export?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to export invoices');
  }

  // Get the CSV data
  const csvData = await response.text();
  
  // Create a blob from the CSV data
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  
  // Create a link and trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `invoices-export-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Export invoices as JSON
export async function exportInvoicesToJson(filters?: {
  companyId?: string;
  clientId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<any> {
  // Build the query parameters
  const params = new URLSearchParams({
    format: 'json',
  });

  if (filters) {
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
  }

  // Call the export API endpoint
  const response = await fetch(`/api/invoices/export?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to export invoices');
  }

  // Return the JSON data
  return response.json();
}

// Export a single invoice as PDF
export async function exportInvoiceAsPdf(invoiceId: string): Promise<void> {
  // First, call the API to get the invoice data
  const response = await fetch(`/api/invoices/export-pdf?invoiceId=${invoiceId}`);
  
  if (!response.ok) {
    throw new Error('Failed to export invoice as PDF');
  }
  
  const result = await response.json();

  // Dynamic import to avoid SSR issues
  const { default: jsPDF } = await import('jspdf');
  
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Set some properties
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Add invoice information
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  
  // If it's a Bulgarian invoice (currency BGN), use Bulgarian format
  const isBulgarianInvoice = result.invoice && result.invoice.currency === 'BGN';
  
  if (isBulgarianInvoice) {
    doc.text('ФАКТУРА', pageWidth / 2, 20, { align: 'center' });
    
    // Add "original" stamp if specified
    if (result.invoice.isOriginal) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 150); // Dark blue color
      doc.text('ОРИГИНАЛ', pageWidth - margin - 30, 20);
      doc.setTextColor(0, 0, 0); // Reset to black
    }
  } else {
    doc.text('INVOICE', pageWidth / 2, 20, { align: 'center' });
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${result.invoiceNumber}`, margin, 40);
  doc.text(`Issue Date: ${new Date(result.invoice?.issueDate || new Date()).toLocaleDateString()}`, margin, 50);
  
  if (isBulgarianInvoice) {
    // Add place of issue - required for Bulgarian invoices
    if (result.invoice.placeOfIssue) {
      doc.text(`Място на издаване: ${result.invoice.placeOfIssue}`, margin, 60);
    }
    
    // Add supply date - required for Bulgarian invoices
    if (result.invoice.supplyDate) {
      doc.text(`Дата на данъчно събитие: ${new Date(result.invoice.supplyDate).toLocaleDateString('bg-BG')}`, pageWidth - margin - 120, 50);
    }
    
    // Add payment method - for Bulgarian invoices
    const paymentMethodMap: Record<string, string> = {
      BANK_TRANSFER: 'Банков превод',
      CASH: 'В брой',
      CREDIT_CARD: 'Карта',
      WIRE_TRANSFER: 'Нареждане за превод',
      OTHER: 'Друг метод'
    };
    
    const paymentMethod = paymentMethodMap[result.invoice.paymentMethod] || result.invoice.paymentMethod;
    doc.text(`Начин на плащане: ${paymentMethod}`, pageWidth - margin - 120, 60);
  }
  
  let yPos = 70;
  
  if (result.invoice) {
    // Company info
    if (result.invoice.company) {
      doc.setFont('helvetica', 'bold');
      doc.text('From:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(result.invoice.company.name, margin, yPos + 10);
      
      let companyYPos = yPos + 20;
      
      if (result.invoice.company.address) {
        doc.text(result.invoice.company.address, margin, companyYPos);
        companyYPos += 10;
      }
      
      let companyLine = '';
      if (result.invoice.company.city) companyLine += result.invoice.company.city;
      if (result.invoice.company.state) companyLine += (companyLine ? ', ' : '') + result.invoice.company.state;
      if (result.invoice.company.zipCode) companyLine += (companyLine ? ', ' : '') + result.invoice.company.zipCode;
      
      if (companyLine) {
        doc.text(companyLine, margin, companyYPos);
        companyYPos += 10;
      }
      
      if (result.invoice.company.country) {
        doc.text(result.invoice.company.country, margin, companyYPos);
        companyYPos += 10;
      }
      
      // Bulgarian specific company details
      if (isBulgarianInvoice) {
        if (result.invoice.company.bulstatNumber || result.invoice.company.vatNumber) {
          const idLine = result.invoice.company.bulstatNumber 
            ? `ЕИК/БУЛСТАТ: ${result.invoice.company.bulstatNumber}` 
            : `ЕИК: ${result.invoice.company.registrationNumber || 'N/A'}`;
          doc.text(idLine, margin, companyYPos);
          companyYPos += 10;
        }
        
        if (result.invoice.company.vatRegistered && result.invoice.company.vatRegistrationNumber) {
          doc.text(`ДДС №: ${result.invoice.company.vatRegistrationNumber}`, margin, companyYPos);
          companyYPos += 10;
        }
        
        if (result.invoice.company.mол) {
          doc.text(`МОЛ: ${result.invoice.company.mол}`, margin, companyYPos);
          companyYPos += 10;
        }
      } else {
        if (result.invoice.company.email) {
          doc.text(result.invoice.company.email, margin, companyYPos);
          companyYPos += 10;
        }
        
        if (result.invoice.company.vatNumber) {
          doc.text(`VAT: ${result.invoice.company.vatNumber}`, margin, companyYPos);
          companyYPos += 10;
        }
      }
      
      // Update yPos to the maximum of company section
      yPos = Math.max(yPos, companyYPos);
    }
    
    // Client info
    if (result.invoice.client) {
      doc.setFont('helvetica', 'bold');
      doc.text('To:', pageWidth - margin - 60, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(result.invoice.client.name, pageWidth - margin - 60, yPos + 10);
      
      let clientYPos = yPos + 20;
      
      if (result.invoice.client.address) {
        doc.text(result.invoice.client.address, pageWidth - margin - 60, clientYPos);
        clientYPos += 10;
      }
      
      let clientLine = '';
      if (result.invoice.client.city) clientLine += result.invoice.client.city;
      if (result.invoice.client.state) clientLine += (clientLine ? ', ' : '') + result.invoice.client.state;
      if (result.invoice.client.zipCode) clientLine += (clientLine ? ', ' : '') + result.invoice.client.zipCode;
      
      if (clientLine) {
        doc.text(clientLine, pageWidth - margin - 60, clientYPos);
        clientYPos += 10;
      }
      
      if (result.invoice.client.country) {
        doc.text(result.invoice.client.country, pageWidth - margin - 60, clientYPos);
        clientYPos += 10;
      }
      
      if (result.invoice.client.email) {
        doc.text(result.invoice.client.email, pageWidth - margin - 60, clientYPos);
        clientYPos += 10;
      }
      
      // Bulgarian specific client details
      if (isBulgarianInvoice) {
        if (result.invoice.client.bulstatNumber || result.invoice.client.vatNumber) {
          const idLine = result.invoice.client.bulstatNumber 
            ? `ЕИК/БУЛСТАТ: ${result.invoice.client.bulstatNumber}` 
            : `ЕИК: ${result.invoice.client.registrationNumber || 'N/A'}`;
          doc.text(idLine, pageWidth - margin - 60, clientYPos);
          clientYPos += 10;
        }
        
        if (result.invoice.client.vatNumber) {
          doc.text(`ДДС №: ${result.invoice.client.vatNumber}`, pageWidth - margin - 60, clientYPos);
          clientYPos += 10;
        }
      } else if (result.invoice.client.vatNumber) {
        doc.text(`VAT: ${result.invoice.client.vatNumber}`, pageWidth - margin - 60, clientYPos);
        clientYPos += 10;
      }
      
      // Update yPos to the maximum of client section
      yPos = Math.max(yPos, clientYPos);
    }
    
    // Add some space
    yPos += 20;
    
    // Items table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 10, pageWidth - 2 * margin, 10, 'F');
    
    doc.setFont('helvetica', 'bold');
    
    if (isBulgarianInvoice) {
      doc.text('Описание', margin + 5, yPos - 2);
      doc.text('Кол.', pageWidth - margin - 100, yPos - 2);
      doc.text('Цена', pageWidth - margin - 70, yPos - 2);
      doc.text('Общо', pageWidth - margin - 30, yPos - 2);
    } else {
      doc.text('Description', margin + 5, yPos - 2);
      doc.text('Qty', pageWidth - margin - 100, yPos - 2);
      doc.text('Price', pageWidth - margin - 70, yPos - 2);
      doc.text('Total', pageWidth - margin - 30, yPos - 2);
    }
    
    yPos += 5;
    
    // Items
    if (result.invoice.items && result.invoice.items.length > 0) {
      doc.setFont('helvetica', 'normal');
      
      result.invoice.items.forEach((item: any) => {
        yPos += 10;
        
        doc.text(item.description.substring(0, 40) + (item.description.length > 40 ? '...' : ''), 
          margin + 5, yPos);
        doc.text(item.quantity.toString(), pageWidth - margin - 100, yPos);
        
        const unitPriceText = `${isBulgarianInvoice ? '' : '$'}${parseFloat(item.unitPrice).toFixed(2)}${isBulgarianInvoice ? ' лв.' : ''}`;
        doc.text(unitPriceText, pageWidth - margin - 70, yPos);
        
        const totalText = `${isBulgarianInvoice ? '' : '$'}${parseFloat(item.total).toFixed(2)}${isBulgarianInvoice ? ' лв.' : ''}`;
        doc.text(totalText, pageWidth - margin - 30, yPos);
      });
    }
    
    // Totals
    yPos += 20;
    doc.line(margin, yPos - 10, pageWidth - margin, yPos - 10);
    
    const labelPosition = pageWidth - margin - 70;
    const valuePosition = pageWidth - margin - 30;
    
    if (isBulgarianInvoice) {
      doc.text('Общо:', labelPosition, yPos);
      doc.text(`${parseFloat(result.invoice.subtotal).toFixed(2)} лв.`, valuePosition, yPos);
    } else {
      doc.text('Subtotal:', labelPosition, yPos);
      doc.text(`$${parseFloat(result.invoice.subtotal).toFixed(2)}`, valuePosition, yPos);
    }
    
    yPos += 10;
    if (isBulgarianInvoice) {
      doc.text('ДДС:', labelPosition, yPos);
      doc.text(`${parseFloat(result.invoice.taxAmount).toFixed(2)} лв.`, valuePosition, yPos);
    } else {
      doc.text('Tax:', labelPosition, yPos);
      doc.text(`$${parseFloat(result.invoice.taxAmount).toFixed(2)}`, valuePosition, yPos);
    }
    
    if (result.invoice.discount) {
      yPos += 10;
      if (isBulgarianInvoice) {
        doc.text('Отстъпка:', labelPosition, yPos);
        doc.text(`${parseFloat(result.invoice.discount).toFixed(2)} лв.`, valuePosition, yPos);
      } else {
        doc.text('Discount:', labelPosition, yPos);
        doc.text(`$${parseFloat(result.invoice.discount).toFixed(2)}`, valuePosition, yPos);
      }
    }
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    if (isBulgarianInvoice) {
      doc.text('Крайна сума:', labelPosition, yPos);
      doc.text(`${parseFloat(result.invoice.total).toFixed(2)} лв.`, valuePosition, yPos);
    } else {
      doc.text('Total:', labelPosition, yPos);
      doc.text(`$${parseFloat(result.invoice.total).toFixed(2)}`, valuePosition, yPos);
    }
    
    // Add amount due if different from total
    if (result.invoice.amountDue && result.invoice.amountDue < result.invoice.total) {
      yPos += 10;
      if (isBulgarianInvoice) {
        doc.text('Платено:', labelPosition, yPos);
        doc.text(`${(parseFloat(result.invoice.total) - parseFloat(result.invoice.amountDue)).toFixed(2)} лв.`, valuePosition, yPos);
        
        yPos += 10;
        doc.text('Остава:', labelPosition, yPos);
        doc.text(`${parseFloat(result.invoice.amountDue).toFixed(2)} лв.`, valuePosition, yPos);
      } else {
        doc.text('Amount Paid:', labelPosition, yPos);
        doc.text(`$${(parseFloat(result.invoice.total) - parseFloat(result.invoice.amountDue)).toFixed(2)}`, valuePosition, yPos);
        
        yPos += 10;
        doc.text('Amount Due:', labelPosition, yPos);
        doc.text(`$${parseFloat(result.invoice.amountDue).toFixed(2)}`, valuePosition, yPos);
      }
    }
    
    // Bulgarian legal notes - required by law
    if (isBulgarianInvoice) {
      yPos += 30;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.text('Съгласно чл. 6, ал. 1 от Закона за счетоводството, чл. 114 от ЗДДС', margin, yPos);
      yPos += 10;
      doc.text('Документът е валиден без печат и подпис.', margin, yPos);
    }
  }
  
  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  let footerText = 'Thank you for your business!';
  if (isBulgarianInvoice) {
    footerText = 'Благодарим Ви, че избрахте нас!';
  }
  doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: 'center' });
  
  // Save the PDF
  doc.save(`Invoice-${result.invoiceNumber}.pdf`);
} 