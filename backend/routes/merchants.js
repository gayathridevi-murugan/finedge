const express = require('express');
const router = express.Router();
const { Merchant } = require('../models');
const axios = require('axios');

// Merchant onboarding endpoint
router.post('/onboard', async (req, res) => {
  try {
    const {
      business_name,
      business_type,
      business_email,
      business_phone,
      owner_name,
      owner_email,
      owner_phone,
      bank_name,
      account_number,
      account_holder,
      mode
    } = req.body;

    // Validate required fields
    if (!business_name || !business_type || !owner_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: business_name, business_type, owner_name'
      });
    }

    // Use environment Surfboard merchant ID or generate fallback
    const merchant_id = process.env.SURFBOARD_MERCHANT_ID || `MERCHANT_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create merchant in database
    const merchant = await Merchant.create({
      merchant_id,
      business_name,
      business_type,
      business_email,
      business_phone,
      owner_name,
      owner_email,
      owner_phone,
      bank_name,
      account_holder,
      account_number_last4: account_number ? account_number.slice(-4) : null,
      status: 'PENDING',
      surfboard_status: 'NOT_REGISTERED',
      metadata: {
        onboarded_at: new Date().toISOString(),
        mode: mode || 'DEMO'
      }
    });

    // Call real Surfboard Merchant Onboarding API if credentials provided
    if (process.env.SURFBOARD_API_KEY && process.env.SURFBOARD_SECRET_KEY) {
      try {
        console.log('🔄 Calling real Surfboard Merchant Onboarding API...');
        console.log('Merchant ID:', process.env.SURFBOARD_MERCHANT_ID);

        const surfboardResponse = await axios.post(
          `${process.env.SURFBOARD_BASE_URL}/api/v1/merchants/onboard`,
          {
            merchant_id: process.env.SURFBOARD_MERCHANT_ID,
            business_name,
            business_type,
            business_email,
            owner_name,
            owner_email,
            owner_phone,
            bank_account_last4: account_number ? account_number.slice(-4) : null
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.SURFBOARD_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        console.log('✅ Surfboard API Response:', surfboardResponse.status);

        if (surfboardResponse.data.success || surfboardResponse.status === 200) {
          await merchant.update({
            surfboard_merchant_id: process.env.SURFBOARD_MERCHANT_ID,
            surfboard_status: 'REGISTERED',
            status: 'APPROVED'
          });
          console.log('✅ Merchant approved via Surfboard');
        }
      } catch (error) {
        console.warn('⚠️ Surfboard API call:', error.response?.status, error.message);
        // Store merchant data even if Surfboard call fails
        await merchant.update({
          surfboard_status: 'PENDING_VERIFICATION',
          status: 'PENDING'
        });
      }
    } else {
      console.log('ℹ️ Surfboard credentials not configured, using local merchant record');
    }

    res.json({
      success: true,
      message: 'Merchant onboarded successfully',
      data: {
        id: merchant.id,
        merchant_id: merchant.merchant_id,
        business_name: merchant.business_name,
        status: merchant.status,
        surfboard_status: merchant.surfboard_status,
        timestamp: merchant.created_at
      }
    });
  } catch (error) {
    console.error('Merchant onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Merchant onboarding failed',
      error: error.message
    });
  }
});

// Get merchant status
router.get('/status/:merchant_id', async (req, res) => {
  try {
    const { merchant_id } = req.params;

    const merchant = await Merchant.findOne({
      where: {
        merchant_id: merchant_id
      }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: merchant.id,
        merchant_id: merchant.merchant_id,
        business_name: merchant.business_name,
        status: merchant.status,
        surfboard_merchant_id: merchant.surfboard_merchant_id,
        surfboard_status: merchant.surfboard_status,
        total_terminals: 0, // Will query terminals count in future
        created_at: merchant.created_at,
        updated_at: merchant.updated_at
      }
    });
  } catch (error) {
    console.error('Get merchant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch merchant status',
      error: error.message
    });
  }
});

// List merchants
router.get('/', async (req, res) => {
  try {
    const merchants = await Merchant.findAll({
      limit: 50,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        merchants: merchants.map(m => ({
          id: m.id,
          merchant_id: m.merchant_id,
          business_name: m.business_name,
          status: m.status,
          surfboard_status: m.surfboard_status,
          created_at: m.created_at
        })),
        total: merchants.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list merchants',
      error: error.message
    });
  }
});

module.exports = router;
