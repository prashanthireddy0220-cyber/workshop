const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const generateTicketPDF = async (ticketData, registrationData, eventData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Colors
      const navy = '#0F172A';
      const ieeeBlue = '#1E2952';
      const ieeeOrange = '#EA580C';
      const grayText = '#475569';

      // Header background banner
      doc.rect(40, 40, 515, 100).fill(ieeeBlue);

      // Header Text
      doc.fillColor('#FFFFFF')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('KARE IEEE EDUCATION SOCIETY', 60, 60);

      doc.fontSize(14)
         .font('Helvetica')
         .text(eventData.eventName || 'Intelligent Yield Prediction & AI/ML Workshop', 60, 90);

      doc.fontSize(10)
         .text('OFFICIAL EVENT ENTRY TICKET', 60, 112);

      // Body Section
      doc.fillColor(navy)
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(registrationData.fullName, 60, 170);

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor(grayText)
         .text(`Email: ${registrationData.email}`, 60, 195)
         .text(`Department: ${registrationData.department} | Year: ${registrationData.year}`, 60, 212)
         .text(`Student ID: ${registrationData.studentId}`, 60, 229)
         .text(`College: ${registrationData.college}`, 60, 246);

      // Ticket Box Info
      doc.rect(60, 275, 475, 80).fillAndStroke('#F8FAFC', '#E2E8F0');

      doc.fillColor(ieeeOrange)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('REGISTRATION DETAILS', 80, 290);

      doc.fillColor(navy)
         .fontSize(10)
         .font('Helvetica')
         .text(`Registration ID: ${registrationData.registrationId}`, 80, 310)
         .text(`Ticket ID: ${ticketData.ticketId}`, 80, 326)
         .text(`Date & Time: ${eventData.date} | ${eventData.startTime}`, 300, 310)
         .text(`Venue: ${eventData.venue}`, 300, 326);

      // QR Code Generation
      const qrDataUrl = await QRCode.toDataURL(ticketData.qrToken, { width: 180, margin: 1 });
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');

      doc.image(qrBuffer, 207, 375, { width: 180, height: 180 });

      doc.fontSize(10)
         .fillColor(grayText)
         .font('Helvetica-Oblique')
         .text('Scan this QR code at the venue gate for entry check-in.', 140, 570, { align: 'center' });

      // Verification Badge
      doc.rect(180, 600, 235, 30).fill('#DCFCE7');
      doc.fillColor('#166534')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('✓ PAYMENT VERIFIED & APPROVED', 180, 609, { width: 235, align: 'center' });

      // Footer
      doc.fillColor('#94A3B8')
         .fontSize(8)
         .font('Helvetica')
         .text('KARE IEEE Education Society © 2026. All rights reserved.', 40, 780, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

const generateCertificatePDF = async (certificateData, registrationData, eventData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const navy = '#0F172A';
      const ieeeBlue = '#1E2952';
      const ieeeOrange = '#EA580C';

      // Decorative Borders
      doc.rect(20, 20, 762, 555).lineWidth(4).stroke(ieeeBlue);
      doc.rect(28, 28, 746, 539).lineWidth(1.5).stroke(ieeeOrange);

      // Header Banner
      doc.fillColor(ieeeBlue)
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('KARE IEEE EDUCATION SOCIETY', 40, 75, { align: 'center' });

      doc.fillColor(ieeeOrange)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING', 40, 110, { align: 'center' });

      // Title
      doc.fillColor(navy)
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('CERTIFICATE OF PARTICIPATION', 40, 160, { align: 'center' });

      doc.fillColor('#64748B')
         .fontSize(12)
         .font('Helvetica')
         .text('THIS IS PROUDLY PRESENTED TO', 40, 215, { align: 'center' });

      // Participant Name
      doc.fillColor(ieeeOrange)
         .fontSize(26)
         .font('Helvetica-Bold')
         .text(registrationData.fullName.toUpperCase(), 40, 245, { align: 'center' });

      doc.fillColor(navy)
         .fontSize(12)
         .font('Helvetica')
         .text(`of ${registrationData.college}`, 40, 285, { align: 'center' });

      doc.fontSize(12)
         .font('Helvetica')
         .text(
           `for actively participating in the National Workshop on "${eventData.eventName || 'Intelligent Yield Prediction & AI/ML Workshop'}" held on ${eventData.date} at ${eventData.venue}.`,
           100,
           315,
           { align: 'center', width: 602 }
         );

      // Certificate Metadata
      doc.fontSize(10)
         .fillColor('#64748B')
         .text(`Certificate ID: ${certificateData.certificateId}`, 100, 420)
         .text(`Registration ID: ${registrationData.registrationId}`, 520, 420);

      // Signatures
      doc.strokeColor('#CBD5E1').lineWidth(1);
      doc.line(100, 480, 260, 480).stroke();
      doc.line(540, 480, 700, 480).stroke();

      doc.fillColor(navy)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('Dr. Faculty Convenor', 100, 490, { width: 160, align: 'center' })
         .text('IEEE Student Chair', 540, 490, { width: 160, align: 'center' });

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#64748B')
         .text('KARE IEEE Education Society', 100, 506, { width: 160, align: 'center' })
         .text('KARE IEEE Student Branch', 540, 506, { width: 160, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateTicketPDF, generateCertificatePDF };
