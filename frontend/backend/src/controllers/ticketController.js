const Ticket = require('../models/Ticket');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { generateTicketPDF } = require('../services/pdfService');

const getTicketByRegistrationId = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const ticket = await Ticket.findOne({ registrationId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found or payment not yet approved'
      });
    }

    const registration = await Registration.findOne({ registrationId });
    return res.status(200).json({ success: true, ticket, registration });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const downloadTicketPDF = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const ticket = await Ticket.findOne({ registrationId });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found or pending payment verification' });
    }

    const registration = await Registration.findOne({ registrationId });
    const event = (await Event.findOne()) || {
      eventName: 'Intelligent Yield Prediction & AI/ML Workshop',
      date: '2026-09-15',
      venue: 'IEEE Tech Hall, KARE Campus'
    };

    const pdfBuffer = await generateTicketPDF(ticket, registration, event);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Ticket-${ticket.ticketId}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('[Ticket PDF Download Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const verifyTicketToken = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findOne({
      $or: [{ ticketId: ticketId }, { qrToken: ticketId }]
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Invalid or unknown ticket token' });
    }

    const registration = await Registration.findOne({ registrationId: ticket.registrationId });

    return res.status(200).json({
      success: true,
      valid: ticket.status === 'VALID',
      ticket,
      registration
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTicketByRegistrationId,
  downloadTicketPDF,
  verifyTicketToken
};
