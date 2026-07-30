const express = require('express');
const router = express.Router();
const { simulatorService } = require('../services');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/demo-data', asyncHandler(async (req, res) => {
  const data = await simulatorService.getDemoData();

  res.json({
    success: true,
    data: {
      message: 'Demo data for simulator',
      ...data
    }
  });
}));

router.get('/available-tags', asyncHandler(async (req, res) => {
  const data = await simulatorService.getDemoData();

  res.json({
    success: true,
    data: {
      available_tags: data.available_tags,
      tags: data.sample_tags.map(t => t.tag_id)
    }
  });
}));

module.exports = router;
