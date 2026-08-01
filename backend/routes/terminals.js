const express = require('express');
const router = express.Router();
const { Terminal, Merchant } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Register a new terminal for a merchant
router.post('/register', async (req, res) => {
  try {
    const {
      merchant_id,
      terminal_name,
      terminal_type,
      location,
      nfc_reader_id,
      security_gate_id
    } = req.body;

    if (!merchant_id) {
      return res.status(400).json({
        success: false,
        message: 'merchant_id is required'
      });
    }

    // Verify merchant exists
    const merchant = await Merchant.findOne({
      where: { merchant_id }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Check if merchant is approved
    if (merchant.status !== 'APPROVED' && merchant.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Merchant must be approved before registering terminals'
      });
    }

    // Generate terminal ID
    const terminal_id = `TERMINAL_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create terminal in database
    const terminal = await Terminal.create({
      terminal_id,
      merchant_id: merchant.id,
      terminal_name: terminal_name || `Terminal ${terminal_id.slice(-8)}`,
      terminal_type: terminal_type || 'NFC_SELF_CHECKOUT',
      location,
      nfc_reader_id,
      security_gate_id,
      status: 'ONLINE',
      last_online_at: new Date()
    });

    res.json({
      success: true,
      message: 'Terminal registered successfully',
      data: {
        id: terminal.id,
        terminal_id: terminal.terminal_id,
        merchant_id: merchant.merchant_id,
        terminal_name: terminal.terminal_name,
        terminal_type: terminal.terminal_type,
        status: terminal.status,
        location: terminal.location,
        created_at: terminal.created_at
      }
    });
  } catch (error) {
    console.error('Terminal registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Terminal registration failed',
      error: error.message
    });
  }
});

// Get terminal status and information
router.get('/:terminal_id', async (req, res) => {
  try {
    const { terminal_id } = req.params;

    const terminal = await Terminal.findOne({
      where: { terminal_id },
      include: [
        {
          model: Merchant,
          as: 'merchant',
          attributes: ['merchant_id', 'business_name', 'status']
        }
      ]
    });

    if (!terminal) {
      return res.status(404).json({
        success: false,
        message: 'Terminal not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: terminal.id,
        terminal_id: terminal.terminal_id,
        merchant: {
          id: terminal.merchant.id,
          merchant_id: terminal.merchant.merchant_id,
          business_name: terminal.merchant.business_name
        },
        terminal_name: terminal.terminal_name,
        terminal_type: terminal.terminal_type,
        status: terminal.status,
        location: terminal.location,
        nfc_reader_id: terminal.nfc_reader_id,
        security_gate_id: terminal.security_gate_id,
        ip_address: terminal.ip_address,
        total_transactions: terminal.total_transactions,
        total_revenue: parseFloat(terminal.total_revenue),
        last_online_at: terminal.last_online_at,
        created_at: terminal.created_at,
        updated_at: terminal.updated_at
      }
    });
  } catch (error) {
    console.error('Get terminal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get terminal status',
      error: error.message
    });
  }
});

// Update terminal status (online/offline)
router.patch('/:terminal_id/status', async (req, res) => {
  try {
    const { terminal_id } = req.params;
    const { status, ip_address } = req.body;

    if (!['ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be ONLINE, OFFLINE, ERROR, or MAINTENANCE'
      });
    }

    const terminal = await Terminal.findOne({
      where: { terminal_id }
    });

    if (!terminal) {
      return res.status(404).json({
        success: false,
        message: 'Terminal not found'
      });
    }

    await terminal.update({
      status,
      ip_address: ip_address || terminal.ip_address,
      last_online_at: status === 'ONLINE' ? new Date() : terminal.last_online_at
    });

    res.json({
      success: true,
      message: 'Terminal status updated',
      data: {
        terminal_id: terminal.terminal_id,
        status: terminal.status,
        last_online_at: terminal.last_online_at
      }
    });
  } catch (error) {
    console.error('Update terminal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update terminal status',
      error: error.message
    });
  }
});

// List terminals for a merchant
router.get('/merchant/:merchant_id', async (req, res) => {
  try {
    const { merchant_id } = req.params;

    const merchant = await Merchant.findOne({
      where: { merchant_id }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    const terminals = await Terminal.findAll({
      where: { merchant_id: merchant.id },
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        merchant_id: merchant.merchant_id,
        terminals: terminals.map(t => ({
          id: t.id,
          terminal_id: t.terminal_id,
          terminal_name: t.terminal_name,
          terminal_type: t.terminal_type,
          status: t.status,
          location: t.location,
          total_transactions: t.total_transactions,
          total_revenue: parseFloat(t.total_revenue),
          last_online_at: t.last_online_at,
          created_at: t.created_at
        })),
        total: terminals.length
      }
    });
  } catch (error) {
    console.error('List terminals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list terminals',
      error: error.message
    });
  }
});

module.exports = router;
