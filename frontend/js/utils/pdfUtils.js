import { showNotification } from './AppUtils.js';

/**
 * Escapes HTML special characters to prevent breaking the HTML structure.
 * @param {*} unsafe The input to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

/**
 * Formats a number as a currency string (Thai Baht).
 * @param {number | string} amount The amount to format.
 * @param {string} defaultValue The value to return if amount is invalid.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount, defaultValue = '..........') {
    const number = parseFloat(amount);
    if (isNaN(number)) {
        return defaultValue;
    }
    // Using toLocaleString for formatting, assuming 'th-TH' locale for Baht symbol, though '฿' is hardcoded for consistency.
    return `${number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a date string into a localized, readable format.
 * @param {string} dateString The date string to format.
 * @param {string} defaultValue The value to return if the date string is invalid.
 * @returns {string} The formatted date string.
 */
function formatDate(dateString, defaultValue = '...../...../.....') {
    if (!dateString) return defaultValue;
    try {
        // Using Thai locale for date formatting
        return new Intl.DateTimeFormat('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date(dateString));
    } catch (error) {
        console.error('Error formatting date:', error);
        return defaultValue;
    }
}

/**
 * Calculates the end date of an installment plan.
 * @param {string} startDateString The start date of the plan.
 * @param {number} termMonths The number of months in the term.
 * @returns {string} The calculated end date string, formatted.
 */
function calculateEndDate(startDateString, termMonths) {
    if (!startDateString || !termMonths) return '...../...../.....';
    try {
        const startDate = new Date(startDateString);
        // Add the total months of the term to the start date
        startDate.setMonth(startDate.getMonth() + termMonths);
        return formatDate(startDate.toISOString());
    } catch (error) {
        console.error('Error calculating end date:', error);
        return '...../...../.....';
    }
}


/**
 * Generates a contract PDF from installment data using jsPDF and html2canvas.
 * @param {object} installmentData The data for the installment plan, containing installment and customer details.
 * @param {object} [options] Options for PDF generation.
 * @param {boolean} [options.asBlob=false] If true, returns the PDF as a Blob instead of saving.
 * @returns {Promise<Blob|undefined>}
 */
export async function generateContractPDF(installmentData, { asBlob = false } = {}) {
    const { jsPDF } = window.jspdf;
    const { installment, customer } = installmentData;

    // Create a hidden element to build the contract HTML for canvas conversion
    const contractElement = document.createElement('div');
    contractElement.id = 'contract-container';
    contractElement.style.position = 'absolute';
    contractElement.style.left = '-9999px'; // Position off-screen
    contractElement.style.width = '800px';
    contractElement.style.padding = '40px';
    contractElement.style.fontFamily = 'Arial, sans-serif';
    contractElement.style.color = '#333';

    // --- Prepare data for the contract using helper functions ---
    const buyerName = customer.name || '....................';
    const buyerId = customer.id_card_number || '....................';
    const buyerPhone = customer.phone || '....................';

    const productDescription = installment.product_description || '........................................................................................................................................';
    const productDetails = installment.product_name ?
        `${installment.product_name} ราคา ${formatCurrency(installment.product_price)} บาท` :
        '........................................................................................................................................';

    const downPayment = formatCurrency(installment.down_payment, '..........');
    const monthlyPayment = formatCurrency(installment.monthly_payment, '..........');
    const termMonths = installment.term_months || '..........';

    const startDate = formatDate(installment.start_date);
    const endDate = calculateEndDate(installment.start_date, installment.term_months);
    const today = formatDate(new Date().toISOString());


    const contractHTML = `
        <style>
            .contract {
                font-family: "TH Sarabun New", "Tahoma", sans-serif;
                font-size: 12px;
                line-height: 1.6;
                color: #000;
                max-width: 800px;
                margin: 0 auto;
                padding: 30px;
                background: #fff;
                border: 1px solid #ccc;
            }

            .contract .title {
                font-size: 14px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 12px;
            }

            .contract .meta {
                font-size: 12px;
                margin-bottom: 18px;
                text-align: center;
            }

            .contract .section {
                margin-bottom: 16px;
                text-align: justify;
            }

            .contract strong {
                font-weight: bold;
            }

            .contract ol {
                margin: 8px 0 8px 24px;
                padding: 0;
            }

            .contract li {
                margin-bottom: 6px;
            }

            .contract .sign-row {
                display: flex;
                justify-content: space-between;
                margin-top: 40px;
                gap: 10px;
            }

            .contract .sign-box {
                flex: 1;
                text-align: center;
                padding-top: 40px; /* space for signature line */
                border-top: 1px solid #000;
            }

            @media print {
                body {
                    background: #fff;
                }
                .contract {
                    border: none;
                    padding: 0;
                    max-width: 100%;
                }
            }
        </style>

        <div class="contract" id="contractHtml">
            <div class="title">สัญญาเช่าซื้อขาย</div>
            <div class="meta">สัญญาฉบับนี้จัดทำขึ้น ณ บ้านที่เลข 574 ซอยสายไหม79 เขตสายไหม แขวงสายไหม กทม. เมื่อ ${today}</div>

            <div class="section">
                ข้าพเจ้า ชื่อ-นามสกุล <strong>${escapeHtml(buyerName)}</strong>  เลขที่บัตรประชาชน <strong>${escapeHtml(buyerId)}</strong><br>
                หมายเลขโทรศัพท์ <strong>${escapeHtml(buyerPhone)}</strong>
                ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>“ผู้เช่าซื้อ”</strong> ได้ทำสัญญาขอเช่าซื้อ กับ <strong>นางสาว สิริพร อินต๊ะวัง</strong> ซึ่งต่อไปในสัญญานี้เรียกว่า <strong>“ผู้ขาย”</strong> คู่สัญญาทั้งสองฝ่ายตกลงซื้อขายกันโดยดังมีข้อความต่อไปนี้
            </div>

            <div class="section">
                <strong>ข้อ 1. </strong>ผู้ขายและผู้เช่าซื้อตกลงซื้อขายสินค้า คือ<br>
                ${productDetails.replace(/\n/g, '<br>')}
                <div style="margin-top:8px"><strong>รายละเอียดตัวสินค้า (ถ้ามี)</strong></div>
                ${productDescription.replace(/\n/g, '<br>')}
            </div>

            <div class="section">
                <strong>ข้อ 2. </strong>ผู้เช่าซื้อตกลงซื้อสินค้าดังกล่าว โดยแบ่งชำระราคาออกเป็นงวดละ <strong>${escapeHtml(monthlyPayment)}</strong>บาท จำนวนงวดทั้งหมด <strong>${escapeHtml(termMonths)}</strong> งวด<br>
                เริ่มต้นชำระตั้งแต่วันที่ <strong>${escapeHtml(startDate)}</strong> จนถึง วันที่ <strong>${escapeHtml(endDate)}</strong>.
            </div>

            <div class="section">
                <strong>ข้อ 3. </strong>หากมีการมัดจำ (เงินดาวน์) ในวันทำสัญญาผู้เช่าซื้อได้ชำระค่ามัดจำเป็นจำนวนเงิน <strong>${escapeHtml(downPayment)}</strong> บาท
            </div>

            <div class="section">
                <strong>ข้อ 4. </strong>ผู้ซื้อต้องชำระค่างวด จนถึงงวดสุดท้ายที่ได้ทำการตกลงซื้อขายไว้นั้น หากผู้เช่าซื้อเป็นผู้ผิดนัดชำระเงินดังกล่าว ผู้เช่าซื้อยินยอมดังนี้
                <ol>
                    <li>ส่งมอบสินค้าดังกล่าวคืนแก่ผู้ขายในสภาพพร้อมใช้งาน ผู้เช่าซื้อจะต้องส่งมอบด้วยตนเองหรือผ่านขนส่งโดยต้องรับผิดชอบค่าขนส่งเอง</li>
                    <li>ยินยอมให้ยึดเงินที่ได้ผ่อนชำระมาแล้วทั้งหมด และผู้ขายสามารถขายทอดสินค้าเพื่อนำเงินมาชำระส่วนที่เหลือ</li>
                    <li>หากขายสินค้าแล้ว จำนวนเงินไม่ถึงที่ตกลง ผู้ซื้อยินยอมให้ฟ้องร้องเรียกค่าส่วนต่างได้ และรับผิดชอบในค่าดำเนินการคดี</li>
                </ol>
            </div>

            <div class="section" style="margin-top:18px">
                สัญญานี้ถูกทำขึ้นเป็นสองฉบับมีข้อความถูกต้องตรงกัน คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจเนื้อความของสัญญาแล้ว จึงลงลายมือชื่อพร้อมประทับตรา (ถ้ามี) ไว้ต่อหน้าพยานและเก็บสัญญาไว้ฝ่ายละฉบับ
            </div>

            <div class="sign-row">
                <div class="sign-box">
                    ลงชื่อ ........................................ <br>
                    ผู้ขาย<br>
                    (สิริพร อินต๊ะวัง)
                </div>
                <div class="sign-box">
                    ลงชื่อ ........................................ <br>
                    ผู้เช่าซื้อ<br>
                    (${escapeHtml(buyerName)})
                </div>
                <div class="sign-box">
                    ลงชื่อ ........................................ <br>
                    พยาน<br>
                    (........................................)
                </div>
            </div>
        </div>
    `;

    contractElement.innerHTML = contractHTML;
    document.body.appendChild(contractElement);

    try {
        // Use html2canvas to render the HTML content onto a canvas
        const canvas = await html2canvas(contractElement, {
            scale: 2, // Use a higher scale for better image quality
            useCORS: true
        });

        // Convert canvas to a PNG image
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });

        // Calculate dimensions to fit the image on the PDF page
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const newCanvasHeight = pdfWidth / ratio;

        // Add the image to the PDF and save it
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, newCanvasHeight);

        if (asBlob) {
            return pdf.output('blob');
        } else {
            pdf.save(`contract-${customer.name.replace(/\s/g, '_')}-${installment.id}.pdf`);
        }

    } catch (error) {
        console.error("Error generating PDF:", error);
        showNotification('Failed to generate PDF contract. Please try again.', 'error');
    } finally {
        // Clean up the hidden element from the DOM
        document.body.removeChild(contractElement);
    }
}