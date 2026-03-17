const User = require('./UserModel/UserModel')
const Inventory = require('./InventoryModel/InventoryModel')
const Lab = require('./LabModel/LabModel')
const Transaction = require('./TransactionModel/TransactionModel')
const ExperimentPlan = require('./ExperimentPlanModel/ExperimentPlanModel')
const ShareRequest = require('./ShareRequestModel/ShareRequestModel')
const LabMember = require('./LabMemberModel/LabMemberModel')
const LabMemberLog = require('./LabMemberLogModel/LabMemberLogModel')

module.exports = {
    User,
    Inventory,
    Lab,
    Transaction,
    ExperimentPlan,
    ShareRequest,
    LabMember,
    LabMemberLog
}