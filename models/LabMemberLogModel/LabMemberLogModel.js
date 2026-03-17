const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const labMemberLogSchema = new Schema({
    memberId: {
        type: Schema.Types.ObjectId,
        ref: 'LabMember',
        required: true
    },
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
    action: {
        type: String,
        enum: ['apply', 'approve', 'reject', 'leave', 'remove', 'role_change'],
        required: true
    },
    beforeRole: {
        type: String
    },
    afterRole: {
        type: String
    },
    operatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    operatorName: {
        type: String
    },
    remark: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Index for querying user's logs
labMemberLogSchema.index({ userId: 1, createdAt: -1 });

// Index for querying lab's logs
labMemberLogSchema.index({ labId: 1, createdAt: -1 });

module.exports = mongoose.model('LabMemberLog', labMemberLogSchema);
