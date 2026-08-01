const express = require('express');
const router = express.Router();
const { nfcDemoSimulatorService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all available demo scenarios
router.get('/scenarios', asyncHandler(async (req, res) => {
  const scenarios = nfcDemoSimulatorService.getAvailableScenarios();

  res.json({
    success: true,
    data: {
      message: 'Available demo scenarios',
      scenarios: scenarios,
      total_scenarios: scenarios.length
    }
  });
}));

// Get details for a specific scenario
router.get('/scenarios/:scenario_key', asyncHandler(async (req, res) => {
  const { scenario_key } = req.params;
  const details = nfcDemoSimulatorService.getScenarioDetails(scenario_key);

  res.json({
    success: true,
    data: {
      message: 'Scenario details',
      scenario: details
    }
  });
}));

// Get NFC terminal animation sequence for a scenario
router.get('/sequence/:scenario_key', asyncHandler(async (req, res) => {
  const { scenario_key } = req.params;
  const sequence = nfcDemoSimulatorService.generateNFCSequence(scenario_key);

  res.json({
    success: true,
    data: {
      message: 'NFC animation sequence',
      animation: sequence
    }
  });
}));

// Initialize a demo session (creates cart and scans products)
router.post('/initialize', asyncHandler(async (req, res) => {
  const { scenario_key } = req.body;

  if (!scenario_key) {
    return res.status(400).json({
      success: false,
      error: { message: 'scenario_key is required' }
    });
  }

  const session = await nfcDemoSimulatorService.initializeDemoSession(scenario_key);

  res.status(201).json({
    success: true,
    data: {
      message: 'Demo session initialized',
      session: session
    }
  });
}));

// Get combined scenario info and animation (convenience endpoint)
router.post('/start', asyncHandler(async (req, res) => {
  const { scenario_key } = req.body;

  if (!scenario_key) {
    return res.status(400).json({
      success: false,
      error: { message: 'scenario_key is required' }
    });
  }

  const sequence = nfcDemoSimulatorService.generateNFCSequence(scenario_key);
  const session = await nfcDemoSimulatorService.initializeDemoSession(scenario_key);

  res.status(201).json({
    success: true,
    data: {
      message: 'Demo started',
      animation: sequence,
      session: session
    }
  });
}));

module.exports = router;
