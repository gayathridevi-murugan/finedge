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
      corporate_id,
      address_line1,
      city,
      postal_code,
      mode
    } = req.body;

    // Validate required fields
    if (!business_name || !business_type || !owner_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: business_name, business_type, owner_name'
      });
    }

    // Surfboard wants phone numbers split into country code + local number, not a single string.
    const toPhoneNumber = (raw) => {
      let digits = (raw || '').replace(/\D/g, '');
      if (digits.startsWith('46')) digits = digits.slice(2);
      else if (digits.startsWith('0')) digits = digits.slice(1);
      return { code: '46', number: digits };
    };

    // Generate unique local merchant_id
    const merchant_id = `MERCHANT_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const surfboardOnboardingEnabled = !!(
      process.env.SURFBOARD_API_KEY && process.env.SURFBOARD_SECRET_KEY && process.env.SURFBOARD_PARTNER_ID
    );

    if (!surfboardOnboardingEnabled) {
      return res.status(503).json({
        success: false,
        message: 'Surfboard onboarding is not configured (missing SURFBOARD_API_KEY/SURFBOARD_SECRET_KEY/SURFBOARD_PARTNER_ID in backend/.env).'
      });
    }

    // Real Surfboard Merchant Onboarding API: POST /partners/:partnerId/merchants
    // Returns a webKybUrl - a Surfboard-hosted KYB (Know Your Business) page the merchant
    // must be redirected to in order to actually complete onboarding.
    console.log('🔄 Calling Surfboard Merchant Onboarding API...');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const surfboardResponse = await axios.post(
      `${process.env.SURFBOARD_BASE_URL}/partners/${process.env.SURFBOARD_PARTNER_ID}/merchants`,
      {
        country: 'SE',
        organisation: {
          legalName: business_name,
          corporateId: corporate_id
        },
        controlFields: {
          store: {
            name: business_name,
            email: business_email,
            phoneNumber: toPhoneNumber(business_phone),
            address: {
              addressLine1: address_line1,
              city,
              countryCode: 'SE',
              postalCode: postal_code
            }
          },
          redirectUrl: `${frontendUrl}/?onboarding_result=submitted&local_merchant_id=${merchant_id}`,
          generateShortLink: true
        }
      },
      {
        headers: {
          'API-KEY': process.env.SURFBOARD_API_KEY,
          'API-SECRET': process.env.SURFBOARD_SECRET_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    if (surfboardResponse.data?.status === 'ERROR') {
      return res.status(400).json({
        success: false,
        message: surfboardResponse.data.message || 'Surfboard rejected the onboarding request'
      });
    }

    const data = surfboardResponse.data?.data || {};
    const webKybUrl = data.webKybUrl;
    const applicationId = data.applicationId;

    if (!webKybUrl) {
      console.error('Unexpected Surfboard onboarding response shape:', JSON.stringify(surfboardResponse.data));
      return res.status(502).json({
        success: false,
        message: 'Surfboard did not return a webKybUrl to redirect the merchant to.'
      });
    }

    // Create merchant locally as PENDING - real approval happens on Surfboard's hosted KYB page.
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
      surfboard_status: 'REGISTERED',
      metadata: { applicationId, webKybUrl }
    });

    res.json({
      success: true,
      message: 'Surfboard onboarding application created - redirect the merchant to complete KYB verification',
      data: {
        id: merchant.id,
        merchant_id: merchant.merchant_id,
        business_name: merchant.business_name,
        status: merchant.status,
        surfboard_status: merchant.surfboard_status,
        application_id: applicationId,
        web_kyb_url: webKybUrl,
        timestamp: merchant.created_at
      }
    });
  } catch (error) {
    if (error.response) {
      // Real error from Surfboard - surface it as-is rather than hiding it behind a fake success.
      console.error('Surfboard onboarding API error:', error.response.status, JSON.stringify(error.response.data));
      return res.status(502).json({
        success: false,
        message: 'Surfboard onboarding request failed',
        error: error.response.data
      });
    }
    console.error('Merchant onboarding error:', error.message);
    console.error('Error details:', error.errors || error.sql || error.stack);
    res.status(500).json({
      success: false,
      message: 'Merchant onboarding failed',
      error: error.message,
      details: error.errors ? error.errors.map(e => e.message) : undefined
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
