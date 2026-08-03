const express = require('express');
const { GroupSession, GroupMember, Order, Payment, Product } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Create a new group shopping session with members
router.post('/create', async (req, res) => {
  try {
    const { groupName, memberCount, members: memberNames } = req.body;

    const total = parseInt(memberCount, 10) || (Array.isArray(memberNames) ? memberNames.length : 0);
    if (total < 1) {
      return res.status(400).json({ success: false, error: 'memberCount must be at least 1' });
    }

    const groupSession = await GroupSession.create({
      group_name: groupName || `Group-${Date.now()}`,
      total_members: total,
      status: 'ACTIVE'
    });

    // Create group members with sequential numbering, honouring any names supplied
    const members = [];
    for (let i = 1; i <= total; i++) {
      const supplied = Array.isArray(memberNames) ? memberNames[i - 1] : null;
      const member = await GroupMember.create({
        group_session_id: groupSession.id,
        member_number: i,
        member_name: (supplied && String(supplied).trim()) || `Person ${i}`,
        status: i === 1 ? 'SHOPPING' : 'WAITING',
        payment_status: 'UNPAID'
      });
      members.push(member);
    }

    res.json({
      success: true,
      data: {
        groupSessionId: groupSession.id,
        groupName: groupSession.group_name,
        totalMembers: groupSession.total_members,
        status: groupSession.status,
        members: members.map(m => ({
          id: m.id,
          number: m.member_number,
          name: m.member_name,
          status: m.status,
          paymentStatus: m.payment_status
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add members to group session
router.post('/:groupSessionId/members', async (req, res) => {
  try {
    const { groupSessionId } = req.params;
    const { members } = req.body; // Array of {name, items: []}

    const addedMembers = await Promise.all(
      members.map(member =>
        GroupMember.create({
          group_session_id: groupSessionId,
          member_name: member.name,
          status: 'PENDING',
          payment_status: 'UNPAID'
        })
      )
    );

    res.json({
      success: true,
      data: {
        members: addedMembers.map(m => ({
          id: m.id,
          name: m.member_name,
          status: m.status,
          paymentStatus: m.payment_status
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Assign products to group members
router.post('/:groupSessionId/assign-products', async (req, res) => {
  try {
    const { groupSessionId } = req.params;
    const { memberAssignments } = req.body; // {memberId: [productIds]}

    const assignments = [];
    for (const [memberId, productIds] of Object.entries(memberAssignments)) {
      for (const productId of productIds) {
        const assignment = await GroupMember.findByPk(memberId);
        if (assignment) {
          assignment.assigned_products = productIds;
          await assignment.save();
          assignments.push(assignment);
        }
      }
    }

    res.json({
      success: true,
      data: { assignments }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get group session details with members and totals
router.get('/:groupSessionId', async (req, res) => {
  try {
    const { groupSessionId } = req.params;

    const groupSession = await GroupSession.findByPk(groupSessionId);
    if (!groupSession) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const members = await GroupMember.findAll({
      where: { group_session_id: groupSessionId }
    });

    // Calculate totals for each member
    const membersWithTotals = await Promise.all(
      members.map(async member => {
        let memberTotal = 0;
        let assignedProducts = [];

        if (member.assigned_products && Array.isArray(member.assigned_products)) {
          const products = await Product.findAll({
            where: { id: member.assigned_products }
          });
          memberTotal = products.reduce((sum, p) => sum + p.price, 0);
          assignedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price
          }));
        }

        return {
          id: member.id,
          name: member.member_name,
          assignedProducts,
          memberTotal,
          status: member.status,
          paymentStatus: member.payment_status,
          paymentId: member.surfboard_payment_id
        };
      })
    );

    const groupTotal = membersWithTotals.reduce((sum, m) => sum + m.memberTotal, 0);
    const paidMembers = membersWithTotals.filter(m => m.paymentStatus === 'PAID').length;
    const pendingMembers = membersWithTotals.filter(m => m.paymentStatus === 'UNPAID').length;

    res.json({
      success: true,
      data: {
        groupSessionId: groupSession.id,
        groupName: groupSession.group_name,
        status: groupSession.status,
        members: membersWithTotals,
        groupTotal,
        paidMembers,
        pendingMembers,
        totalMembers: groupSession.total_members
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate split for group (equal or item-based)
router.post('/:groupSessionId/calculate-split', async (req, res) => {
  try {
    const { groupSessionId } = req.params;
    const { splitMethod } = req.body; // 'equal' or 'item-based'

    const members = await GroupMember.findAll({
      where: { group_session_id: groupSessionId }
    });

    let split = {};

    if (splitMethod === 'equal') {
      const groupTotal = await calculateGroupTotal(groupSessionId);
      const amountPerPerson = groupTotal / members.length;
      members.forEach(m => {
        split[m.id] = {
          memberId: m.id,
          memberName: m.member_name,
          amount: amountPerPerson,
          method: 'EQUAL'
        };
      });
    } else if (splitMethod === 'item-based') {
      // Each member pays for their assigned products
      for (const member of members) {
        let memberTotal = 0;
        if (member.assigned_products && Array.isArray(member.assigned_products)) {
          const products = await Product.findAll({
            where: { id: member.assigned_products }
          });
          memberTotal = products.reduce((sum, p) => sum + p.price, 0);
        }
        split[member.id] = {
          memberId: member.id,
          memberName: member.member_name,
          amount: memberTotal,
          method: 'ITEM_BASED'
        };
      }
    }

    res.json({
      success: true,
      data: { split, splitMethod }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Process payment for group member
router.post('/:groupSessionId/member/:memberNumber/pay', async (req, res) => {
  try {
    const { groupSessionId, memberNumber } = req.params;
    const { amount, paymentMethod, surfboardPaymentId } = req.body;

    const member = await GroupMember.findOne({
      where: {
        group_session_id: groupSessionId,
        member_number: parseInt(memberNumber)
      }
    });

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    // Create payment record
    const payment = await Payment.create({
      order_id: member.order_id || null,
      amount,
      currency: 'INR',
      payment_method: paymentMethod || 'SURFBOARD',
      status: 'CAPTURED',
      surfboard_payment_id: surfboardPaymentId,
      transaction_id: surfboardPaymentId
    });

    // Update member payment status
    member.payment_status = 'PAID';
    member.payment_amount = amount;
    member.surfboard_payment_id = surfboardPaymentId;
    member.status = 'COMPLETED';
    await member.save();

    // Check if all members are paid
    const groupMembers = await GroupMember.findAll({
      where: { group_session_id: groupSessionId }
    });
    const allPaid = groupMembers.every(m => m.payment_status === 'PAID');

    // If all members paid, update group session status
    if (allPaid) {
      const groupSession = await GroupSession.findByPk(groupSessionId);
      if (groupSession) {
        groupSession.status = 'COMPLETED';
        groupSession.split_status = 'FULLY_PAID';
        await groupSession.save();
      }
    }

    res.json({
      success: true,
      data: {
        memberId: member.id,
        paymentId: payment.id,
        status: 'PAID',
        allMembersPaid: allPaid
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete group order once all members paid
router.post('/:groupSessionId/complete', async (req, res) => {
  try {
    const { groupSessionId } = req.params;

    const groupSession = await GroupSession.findByPk(groupSessionId);
    if (!groupSession) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const members = await GroupMember.findAll({
      where: { group_session_id: groupSessionId }
    });

    // Check if all members are paid
    const allPaid = members.every(m => m.payment_status === 'PAID');
    if (!allPaid) {
      return res.status(400).json({
        success: false,
        error: 'Not all members have paid'
      });
    }

    // Create order for group
    const groupTotal = await calculateGroupTotal(groupSessionId);
    const order = await Order.create({
      customer_id: null,
      status: 'COMPLETED',
      total_amount: groupTotal,
      payment_status: 'PAID',
      group_session_id: groupSessionId
    });

    // Update group session status
    groupSession.status = 'COMPLETED';
    groupSession.order_id = order.id;
    await groupSession.save();

    res.json({
      success: true,
      data: {
        groupSessionId,
        orderId: order.id,
        status: 'COMPLETED',
        totalAmount: groupTotal,
        membersCount: members.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to calculate group total
async function calculateGroupTotal(groupSessionId) {
  const members = await GroupMember.findAll({
    where: { group_session_id: groupSessionId }
  });

  let total = 0;
  for (const member of members) {
    if (member.assigned_products && Array.isArray(member.assigned_products)) {
      const products = await Product.findAll({
        where: { id: member.assigned_products }
      });
      total += products.reduce((sum, p) => sum + p.price, 0);
    }
  }

  return total;
}

module.exports = router;
