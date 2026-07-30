const express = require('express');
const router = express.Router();
const { exitSecurityService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/verify', asyncHandler(async (req, res) => {
  const { order_id } = req.body;

  if (!order_id) {
    return res.status(400).json({
      success: false,
      error: { message: 'order_id is required' }
    });
  }

  const exitVerification = await exitSecurityService.verifyExit(order_id);
  const unpaidItems = exitVerification.unpaid_items ? JSON.parse(exitVerification.unpaid_items) : [];

  res.json({
    success: exitVerification.exit_status === 'APPROVED',
    data: {
      message: exitVerification.exit_status === 'APPROVED' ? 'Exit approved' : 'Exit blocked',
      exit_verification: {
        id: exitVerification.id,
        order_id: exitVerification.order_id,
        exit_status: exitVerification.exit_status,
        gate_status: exitVerification.gate_status,
        unpaid_items: unpaidItems,
        simulation_note: exitVerification.simulation_note,
        created_at: exitVerification.createdAt
      }
    }
  });
}));

router.get('/:order_id', asyncHandler(async (req, res) => {
  const { order_id } = req.params;
  const exitVerification = await exitSecurityService.getExitVerification(order_id);

  if (!exitVerification) {
    return res.status(404).json({
      success: false,
      error: { message: 'Exit verification not found' }
    });
  }

  res.json({
    success: true,
    data: {
      exit_status: exitVerification.exit_status,
      gate_status: exitVerification.gate_status
    }
  });
}));

module.exports = router;
