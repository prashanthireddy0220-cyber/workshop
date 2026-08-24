const Certificate = require('../models/Certificate');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const { generateCertificatePDF } = require('../services/pdfService');

const getCertificateInfo = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registration.findOne({ registrationId });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }

    const attendance = await Attendance.findOne({ registrationId, checkedIn: true });
    if (!attendance) {
      return res.status(400).json({
        success: false,
        eligible: false,
        message: 'Certificate is not available. Attendance must be recorded at the venue first.'
      });
    }

    let certificate = await Certificate.findOne({ registrationId });
    if (!certificate) {
      const certCode = `CERT-KLU-2026-${registrationId.split('-').pop()}`;
      certificate = await Certificate.create({
        certificateId: certCode,
        registrationId,
        userId: registration.userId,
        eventId: registration.eventId,
        certificateUrl: `/api/certificates/${registrationId}/download`,
        generatedAt: Date.now()
      });
    }

    return res.status(200).json({
      success: true,
      eligible: true,
      certificate
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const downloadCertificatePDF = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await Registration.findOne({ registrationId });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration record not found' });
    }

    // Verify Eligibility: Must be attended
    const attendance = await Attendance.findOne({ registrationId, checkedIn: true });
    if (!attendance) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Participation Certificate is only unlocked after venue attendance confirmation.'
      });
    }

    let certificate = await Certificate.findOne({ registrationId });
    if (!certificate) {
      const certCode = `CERT-KLU-2026-${registrationId.split('-').pop()}`;
      certificate = await Certificate.create({
        certificateId: certCode,
        registrationId,
        userId: registration.userId,
        eventId: registration.eventId,
        certificateUrl: `/api/certificates/${registrationId}/download`,
        generatedAt: Date.now()
      });
    }

    const event = (await Event.findOne()) || {
      eventName: 'Intelligent Yield Prediction & AI/ML Workshop',
      date: '2026-09-15',
      venue: 'IEEE Tech Hall, KARE Campus'
    };

    const pdfBuffer = await generateCertificatePDF(certificate, registration, event);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate-${certificate.certificateId}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('[Certificate PDF Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCertificateInfo, downloadCertificatePDF };
