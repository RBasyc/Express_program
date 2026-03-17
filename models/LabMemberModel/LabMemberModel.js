const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const labMemberSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    labId: {
        type: Schema.Types.ObjectId,
        ref: 'Lab',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'member', 'pending'],
        default: 'pending'
    },
    applicationReason: {
        type: String,
        maxlength: 500
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectedReason: {
        type: String,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected', 'left'],
        default: 'pending'
    },
    isActive: {
        type: Boolean,
        default: false
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound unique index: one user can have only one record per lab
labMemberSchema.index({ userId: 1, labId: 1 }, { unique: true });

// Index for querying lab members by status
labMemberSchema.index({ labId: 1, status: 1 });

// Index for querying user's labs
labMemberSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('LabMember', labMemberSchema);
