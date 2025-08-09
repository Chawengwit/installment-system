
export async function generateContractPDF(installmentData) {
    const { jsPDF } = window.jspdf;
    const { installment, customer, creditCard } = installmentData;

    // Create a hidden element to build the contract HTML
    const contractElement = document.createElement('div');
    contractElement.id = 'contract-container';
    contractElement.style.position = 'absolute';
    contractElement.style.left = '-9999px';
    contractElement.style.width = '800px';
    contractElement.style.padding = '40px';
    contractElement.style.fontFamily = 'Arial, sans-serif';
    contractElement.style.color = '#333';

    const contractHTML = `
        <style>
            #contract-container {
                border: 1px solid #ccc;
                background: #fff;
            }
            .contract-header {
                text-align: center;
                margin-bottom: 40px;
            }
            .contract-header h1 {
                font-size: 28px;
                margin: 0;
            }
            .contract-section {
                margin-bottom: 30px;
            }
            .contract-section h2 {
                font-size: 20px;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            .details-grid p {
                margin: 5px 0;
            }
            .payment-schedule table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .payment-schedule th, .payment-schedule td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            .payment-schedule th {
                background-color: #f2f2f2;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 12px;
                color: #777;
            }
        </style>
        <div class="contract-header">
            <h1>Installment Contract Agreement</h1>
        </div>

        <div class="contract-section">
            <h2>Parties Involved</h2>
            <div class="details-grid">
                <div>
                    <h4>Customer</h4>
                    <p><strong>Name:</strong> ${customer.name}</p>
                    <p><strong>Phone:</strong> ${customer.phone}</p>
                    <p><strong>ID Card:</strong> ${customer.id_card_number}</p>
                </div>
                <div>
                    <h4>Provider</h4>
                    <p><strong>Name:</strong> Your Company Name</p>
                    <p><strong>Contact:</strong> contact@yourcompany.com</p>
                </div>
            </div>
        </div>

        <div class="contract-section">
            <h2>Product Details</h2>
            <p><strong>Name:</strong> ${installment.product_name}</p>
            <p><strong>Serial Number:</strong> ${installment.product_serial_number || 'N/A'}</p>
            <p><strong>Price:</strong> ฿${parseFloat(installment.product_price).toLocaleString()}</p>
            <p><strong>Down Payment:</strong> ฿${parseFloat(installment.down_payment).toLocaleString()}</p>
        </div>

        <div class="contract-section">
            <h2>Installment Terms</h2>
            <p><strong>Total Amount Financed:</strong> ฿${(installment.total_amount - installment.down_payment).toLocaleString()}</p>
            <p><strong>Monthly Payment:</strong> ฿${parseFloat(installment.monthly_payment).toLocaleString()}</p>
            <p><strong>Interest Rate:</strong> ${installment.interest_rate}%</p>
            <p><strong>Term:</strong> ${installment.term_months} months</p>
            <p><strong>Payment Due Day:</strong> Day ${installment.due_date} of each month</p>
        </div>

        <div class="contract-section payment-schedule">
            <h2>Payment Schedule</h2>
            <table>
                <thead>
                    <tr>
                        <th>Term</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>

        <div class="footer">
            <p>This is a legally binding contract. By signing, both parties agree to the terms and conditions outlined above.</p>
        </div>
    `;

    contractElement.innerHTML = contractHTML;
    document.body.appendChild(contractElement);

    try {
        const canvas = await html2canvas(contractElement, {
            scale: 2, // Higher scale for better quality
            useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const newCanvasHeight = pdfWidth / ratio;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, newCanvasHeight);
        pdf.save(`contract-${customer.name.replace(/\s/g, '_')}-${installment.id}.pdf`);

    } catch (error) {
        console.error("Error generating PDF:", error);
        // Fallback or error notification
    } finally {
        // Clean up the hidden element
        document.body.removeChild(contractElement);
    }
}
