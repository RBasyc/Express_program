const mongoose = require('mongoose');
const { User, Lab, LabMember, LabMemberLog } = require('../models/index');

/**
 * Migration Script: Lab Members
 *
 * This script migrates existing user.labName data to the new LabMember system.
 * It is idempotent and safe to run multiple times.
 *
 * Features:
 * - Creates LabMember records for all existing users
 * - Assigns admin role to existing users
 * - Creates audit logs
 * - Skips already migrated users
 * - Handles missing labs gracefully
 */

async function migrateLabMembers() {
    console.log('='.repeat(60));
    console.log('开始迁移实验室成员数据...');
    console.log('='.repeat(60));

    try {
        // Connect to database
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
        await mongoose.connect(mongoUri);
        console.log('✓ 成功连接到数据库');

        // Get all users with labName
        const users = await User.find({ labName: { $exists: true, $ne: null } });
        console.log(`\n找到 ${users.length} 个需要迁移的用户\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const user of users) {
            try {
                // Find the lab
                const lab = await Lab.findOne({ labName: user.labName });

                if (!lab) {
                    console.log(`⚠ 警告: 用户 "${user.nickName}" 的实验室 "${user.labName}" 不存在，跳过`);
                    errorCount++;
                    continue;
                }

                // Check if LabMember already exists
                const existingMember = await LabMember.findOne({
                    userId: user._id,
                    labId: lab._id
                });

                if (existingMember) {
                    console.log(`⊘ 跳过: 用户 "${user.nickName}" 已是实验室 "${lab.labName}" 的成员`);
                    skipCount++;
                    continue;
                }

                // Create LabMember record
                const member = await LabMember.create({
                    userId: user._id,
                    labId: lab._id,
                    role: 'admin',  // Existing users become admins
                    status: 'active',
                    isActive: true,  // Set as active lab
                    joinedAt: user.createdAt
                });

                // Create migration log
                await LabMemberLog.create({
                    memberId: member._id,
                    userId: user._id,
                    labId: lab._id,
                    action: 'role_change',
                    afterRole: 'admin',
                    operatorId: user._id,
                    operatorName: user.nickName,
                    remark: '数据迁移：从user.labName迁移，自动设为管理员'
                });

                console.log(`✓ 成功: 将用户 "${user.nickName}" 添加到实验室 "${lab.labName}"`);
                successCount++;

            } catch (error) {
                console.error(`✗ 错误: 迁移用户 "${user.nickName}" 失败:`, error.message);
                errorCount++;
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('迁移完成！');
        console.log('='.repeat(60));
        console.log(`成功: ${successCount} 个用户`);
        console.log(`跳过: ${skipCount} 个用户（已迁移）`);
        console.log(`错误: ${errorCount} 个用户`);
        console.log('='.repeat(60));

        // Verify migration
        const totalUsers = await User.countDocuments({ labName: { $exists: true, $ne: null } });
        const totalMembers = await LabMember.countDocuments({ status: 'active' });
        console.log(`\n验证结果:`);
        console.log(`  - 原有用户数: ${totalUsers}`);
        console.log(`  - 活跃成员数: ${totalMembers}`);
        console.log(`  - 迁移${totalUsers === totalMembers ? '✓ 成功' : '✗ 失败'}\n`);

        process.exit(0);

    } catch (error) {
        console.error('\n✗ 迁移失败:', error);
        process.exit(1);
    }
}

// Run migration
migrateLabMembers();
