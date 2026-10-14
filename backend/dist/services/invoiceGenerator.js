"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePDF = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const generateInvoicePDF = (order) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({ size: 'A4', margin: 36 });
            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            // ── Palette & Styles ──
            const brandDark = '#0F172A'; // Deep Navy Slate
            const brandAccent = '#2563EB'; // Electric Royal Blue
            const brandCyan = '#0284C7'; // Vibrant Cyan
            const successColor = '#059669'; // Emerald Green
            const surfaceLight = '#F8FAFC'; // Soft Slate 50
            const cardBorder = '#CBD5E1'; // Slate 300
            const subtleBorder = '#E2E8F0'; // Slate 200
            const textPrimary = '#0F172A'; // Slate 900
            const textMuted = '#64748B'; // Slate 500
            const formatCurrency = (val) => `Rs. ${Math.round(val).toLocaleString('en-IN')}`;
            // 1. TOP HEADER BANNER
            doc.rect(36, 36, 523, 72).fill(brandDark);
            doc.rect(36, 105, 523, 3).fill(brandAccent); // Accent underline
            // Company Branding
            doc.fontSize(18).fillColor('#FFFFFF').font('Helvetica-Bold').text('QUICK SOLUTIONS FOR U', 52, 48);
            doc.fontSize(8).fillColor('#94A3B8').font('Helvetica').text('AUTHORIZED SURVEILLANCE SYSTEMS & WATER PURIFIERS', 52, 70);
            doc.fontSize(7.5).fillColor('#CBD5E1').text('quicksolutionsforu.in | Support: +91 98765 43210 | support@quicksolutionsforu.in', 52, 82);
            // Tax Invoice Badge
            doc.fontSize(13).fillColor('#38BDF8').font('Helvetica-Bold').text('TAX INVOICE', 370, 48, { align: 'right', width: 175 });
            doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold').text(`INV-${order.orderNumber}`, 370, 66, { align: 'right', width: 175 });
            doc.fontSize(7.5).fillColor('#94A3B8').font('Helvetica').text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 370, 78, { align: 'right', width: 175 });
            doc.text('Original for Recipient', 370, 90, { align: 'right', width: 175 });
            // 2. INVOICE META RIBBON
            const metaY = 114;
            doc.rect(36, metaY, 523, 20).fillAndStroke(surfaceLight, subtleBorder);
            doc.fontSize(7.5).font('Helvetica-Bold').fillColor(brandDark);
            doc.text(`Order ID: #${order.orderNumber}`, 48, metaY + 6);
            doc.text(`Place of Supply: ${order.shippingAddress?.state || 'Delhi'}`, 180, metaY + 6);
            doc.text(`Payment: ${order.paymentMethod || 'Online'}`, 330, metaY + 6);
            const isPaid = order.paymentInfo?.status === 'Paid' || order.orderStatus === 'Delivered';
            doc.fillColor(isPaid ? successColor : '#D97706').text(`Status: ${isPaid ? 'PAID' : (order.paymentInfo?.status || 'CONFIRMED')}`, 450, metaY + 6, { align: 'right', width: 95 });
            // 3. SELLER & BUYER 2-COLUMN CARDS
            const cardsY = 140;
            const cardW = 255;
            const cardH = 92;
            // Left Card: Seller
            doc.rect(36, cardsY, cardW, cardH).fillAndStroke('#FFFFFF', cardBorder);
            doc.rect(36, cardsY, cardW, 18).fill(surfaceLight);
            doc.fontSize(8).font('Helvetica-Bold').fillColor(brandAccent).text('SOLD BY (SELLER / CONSIGNOR)', 46, cardsY + 5);
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor(textPrimary).text('Quick Solutions For U', 46, cardsY + 24);
            doc.fontSize(7.5).font('Helvetica').fillColor(textMuted);
            doc.text('Plot 42, Tech Park, Main Ring Road, New Delhi 110001', 46, cardsY + 36, { width: cardW - 20 });
            doc.text('GSTIN: 07AAAAA0000A1Z5   |   PAN: AAAAA0000A', 46, cardsY + 48);
            doc.text('Email: support@quicksolutionsforu.in   |   State: 07 - Delhi', 46, cardsY + 60);
            // Right Card: Buyer
            const rightCardX = 304;
            const addr = order.shippingAddress;
            const addressLine = addr?.addressLine || addr?.addressLine1 || '';
            const addressLine2 = addr?.addressLine2 ? `, ${addr.addressLine2}` : '';
            const buyerCityState = `${addr?.city || ''}, ${addr?.state || ''} - ${addr?.pincode || ''}`;
            doc.rect(rightCardX, cardsY, cardW, cardH).fillAndStroke('#FFFFFF', cardBorder);
            doc.rect(rightCardX, cardsY, cardW, 18).fill(surfaceLight);
            doc.fontSize(8).font('Helvetica-Bold').fillColor(brandAccent).text('BILL TO & SHIP TO (BUYER / CONSIGNEE)', rightCardX + 10, cardsY + 5);
            doc.fontSize(8.5).font('Helvetica-Bold').fillColor(textPrimary).text(addr?.fullName || 'Customer', rightCardX + 10, cardsY + 24);
            doc.fontSize(7.5).font('Helvetica').fillColor(textMuted);
            doc.text(`${addressLine}${addressLine2}`, rightCardX + 10, cardsY + 36, { width: cardW - 20, lineBreak: false });
            doc.text(buyerCityState, rightCardX + 10, cardsY + 48);
            doc.text(`Phone: ${addr?.phone || 'N/A'}`, rightCardX + 10, cardsY + 60);
            // 4. ITEM TABLE HEADER
            const tableY = 240;
            doc.rect(36, tableY, 523, 22).fill(brandDark);
            doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF');
            doc.text('#', 44, tableY + 7, { width: 20, align: 'center' });
            doc.text('ITEM DESCRIPTION', 70, tableY + 7, { width: 200 });
            doc.text('HSN/SAC', 275, tableY + 7, { width: 45, align: 'center' });
            doc.text('QTY', 325, tableY + 7, { width: 30, align: 'center' });
            doc.text('RATE (INR)', 360, tableY + 7, { width: 60, align: 'right' });
            doc.text('TAX (18%)', 425, tableY + 7, { width: 55, align: 'right' });
            doc.text('AMOUNT (INR)', 485, tableY + 7, { width: 65, align: 'right' });
            // 5. ITEM ROWS
            let currentY = tableY + 22;
            const items = order.orderItems || [];
            items.forEach((item, idx) => {
                const rowBg = idx % 2 === 0 ? '#FFFFFF' : surfaceLight;
                doc.rect(36, currentY, 523, 26).fillAndStroke(rowBg, subtleBorder);
                const lineTotal = item.price * item.quantity;
                const itemTax = Math.round((lineTotal * 0.18) / 1.18);
                const itemBase = lineTotal - itemTax;
                const unitBase = Math.round(itemBase / item.quantity);
                doc.fontSize(7.5).font('Helvetica').fillColor(textPrimary);
                doc.text((idx + 1).toString(), 44, currentY + 8, { width: 20, align: 'center' });
                // Item Name
                doc.font('Helvetica-Bold').text(item.name || 'Product Item', 70, currentY + 8, { width: 200, height: 14, ellipsis: true });
                // HSN
                doc.font('Helvetica').fillColor(textMuted).text('852580', 275, currentY + 8, { width: 45, align: 'center' });
                // Qty
                doc.font('Helvetica-Bold').fillColor(textPrimary).text(item.quantity.toString(), 325, currentY + 8, { width: 30, align: 'center' });
                // Rate
                doc.font('Helvetica').text(unitBase.toLocaleString('en-IN'), 360, currentY + 8, { width: 60, align: 'right' });
                // Tax
                doc.text(itemTax.toLocaleString('en-IN'), 425, currentY + 8, { width: 55, align: 'right' });
                // Amount
                doc.font('Helvetica-Bold').fillColor(brandDark).text(lineTotal.toLocaleString('en-IN'), 485, currentY + 8, { width: 65, align: 'right' });
                currentY += 26;
            });
            // Fill empty space if table has few items to maintain clean proportions
            const minTableEndY = Math.max(currentY + 10, 360);
            currentY = minTableEndY;
            // 6. SUMMARY & AUDIT SECTION
            const sumBoxW = 230;
            const sumBoxX = 329;
            const leftNoteW = 275;
            // Left Column: Logistics, Terms & Digital Seal
            doc.rect(36, currentY, leftNoteW, 130).fillAndStroke(surfaceLight, cardBorder);
            doc.fontSize(8).font('Helvetica-Bold').fillColor(brandAccent).text('TERMS, WARRANTY & VERIFICATION', 48, currentY + 10);
            doc.fontSize(7).font('Helvetica').fillColor(textMuted);
            doc.text('• Warranty: Standard 1-2 Year Manufacturer Replacement Warranty.', 48, currentY + 24, { width: leftNoteW - 24 });
            doc.text('• Returns: 7-Day Hassle-Free Replacement Policy for transit damages.', 48, currentY + 36, { width: leftNoteW - 24 });
            doc.text('• All taxes are calculated under the Central & State GST Acts, 2017.', 48, currentY + 48, { width: leftNoteW - 24 });
            doc.text(`• Tracking Ref: ${order.trackingNumber ? order.trackingNumber : 'Dispatched via Express Courier'}`, 48, currentY + 60, { width: leftNoteW - 24 });
            // Digitally Verified Stamp Box
            doc.rect(48, currentY + 76, leftNoteW - 24, 42).fillAndStroke('#FFFFFF', subtleBorder);
            doc.fontSize(7.5).font('Helvetica-Bold').fillColor(successColor).text('✓ DIGITALLY VERIFIED TAX INVOICE', 56, currentY + 84);
            doc.fontSize(6.5).font('Helvetica').fillColor(textMuted).text('This is a computer-generated tax document authorized by Quick Solutions For U. Valid without physical signature.', 56, currentY + 96, { width: leftNoteW - 40 });
            // Right Column: Calculation Breakdown
            const subtotal = order.itemsPrice ?? items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
            const taxAmount = order.taxPrice ?? Math.round((subtotal * 0.18) / 1.18);
            const cgst = Math.round(taxAmount / 2);
            const sgst = taxAmount - cgst;
            const shipping = order.shippingPrice ?? 0;
            const discount = order.couponDiscount ?? 0;
            const finalGrand = order.totalPrice ?? (subtotal + shipping - discount);
            let calcRowY = currentY + 4;
            const addCalcRow = (label, value, isBold = false, color = textPrimary) => {
                doc.fontSize(7.5).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fillColor(textMuted).text(label, sumBoxX, calcRowY);
                doc.fillColor(color).text(value, sumBoxX + 110, calcRowY, { width: 110, align: 'right' });
                calcRowY += 14;
            };
            addCalcRow('Taxable Goods Value:', formatCurrency(subtotal - taxAmount));
            addCalcRow('Central GST (CGST @ 9%):', formatCurrency(cgst));
            addCalcRow('State GST (SGST @ 9%):', formatCurrency(sgst));
            addCalcRow('Shipping & Express Delivery:', shipping === 0 ? 'FREE' : formatCurrency(shipping));
            if (discount > 0) {
                addCalcRow('Coupon Promotional Discount:', `- ${formatCurrency(discount)}`, true, successColor);
            }
            // Grand Total Highlight Container
            doc.rect(sumBoxX, calcRowY + 4, sumBoxW, 30).fill(brandAccent);
            doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#FFFFFF').text('GRAND TOTAL (INCL. GST):', sumBoxX + 10, calcRowY + 13);
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#FFFFFF').text(formatCurrency(finalGrand), sumBoxX + 120, calcRowY + 12, { width: 100, align: 'right' });
            // 7. FOOTER CONTACT STRIP
            const footerY = 750;
            doc.rect(36, footerY, 523, 38).fillAndStroke(brandDark, brandDark);
            doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#FFFFFF').text('Thank You for Trusting Quick Solutions For U!', 36, footerY + 10, { align: 'center', width: 523 });
            doc.fontSize(7).font('Helvetica').fillColor('#94A3B8').text('For installation, customer support, or warranty claims, contact us at +91 98765 43210 or support@quicksolutionsforu.in', 36, footerY + 22, { align: 'center', width: 523 });
            doc.end();
        }
        catch (err) {
            reject(err);
        }
    });
};
exports.generateInvoicePDF = generateInvoicePDF;
