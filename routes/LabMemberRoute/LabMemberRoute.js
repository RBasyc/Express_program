const express = require('express');
const LabMemberRoute = express.Router();
const LabMemberController = require('../../controller/LabMemberController/LabMemberController.js');

// Get user's laboratories
LabMemberRoute.get('/my-labs', LabMemberController.getMyLabs);

// Get current active lab
LabMemberRoute.get('/current', LabMemberController.getCurrent);

// Switch active lab
LabMemberRoute.put('/current/:labId', LabMemberController.switchLab);

// Apply to join lab
LabMemberRoute.post('/apply', LabMemberController.applyToLab);

// Get pending members (admin only)
LabMemberRoute.get('/pending/:labId', LabMemberController.getPendingMembers);

// Approve application (admin only)
LabMemberRoute.put('/approve/:memberId', LabMemberController.approveApplication);

// Reject application (admin only)
LabMemberRoute.put('/reject/:memberId', LabMemberController.rejectApplication);

// Get lab members (admin only)
LabMemberRoute.get('/:labId/members', LabMemberController.getLabMembers);

// Change member role (admin only)
LabMemberRoute.put('/:memberId/role', LabMemberController.changeRole);

// Remove member (admin only)
LabMemberRoute.delete('/:memberId', LabMemberController.removeMember);

// Leave lab
LabMemberRoute.post('/leave/:labId', LabMemberController.leaveLab);

// Get member logs (admin only)
LabMemberRoute.get('/:labId/logs', LabMemberController.getLogs);

// Add user as lab admin directly (for lab creator)
LabMemberRoute.post('/add-admin', LabMemberController.addAdminDirectly);

module.exports = LabMemberRoute;
