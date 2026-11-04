const Batch = require('../models/Batch');
const Test = require('../models/Test');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/dashboard/stats
// @desc    Get dynamic dashboard metrics, charts, compliance, and activities
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // 1. Batch counts by status
    const [
      totalBatches,
      underTestingBatches,
      approvedBatches,
      quarantinedBatches,
      rejectedBatches,
      expiringSoonBatches,
      expiredBatches,
    ] = await Promise.all([
      Batch.countDocuments(),
      Batch.countDocuments({ status: 'Under Lab Testing' }),
      Batch.countDocuments({ status: 'Approved' }),
      Batch.countDocuments({ status: 'Quarantined' }),
      Batch.countDocuments({ status: 'Rejected' }),
      Batch.countDocuments({
        expiryDate: { $gt: today, $lte: thirtyDaysFromNow },
      }),
      Batch.countDocuments({
        expiryDate: { $lte: today },
      }),
    ]);

    // 2. Test metrics
    const [
      totalTests,
      passedTests,
      failedTests,
      submittedTests,
      inProgressTests,
    ] = await Promise.all([
      Test.countDocuments(),
      Test.countDocuments({ overallOutcome: 'Pass' }),
      Test.countDocuments({ overallOutcome: 'Fail' }),
      Test.countDocuments({ overallOutcome: 'Submitted' }),
      Test.countDocuments({ overallOutcome: { $in: ['In Progress', 'Pending'] } }),
    ]);

    // Analytical Compliance & Release Percentages
    const testCompliancePercentage =
      totalTests > 0 ? Math.round((passedTests / (passedTests + failedTests || 1)) * 100) : 100;
    const batchReleasePercentage =
      totalBatches > 0 ? Math.round((approvedBatches / totalBatches) * 100) : 0;

    // 3. Status Distribution for Charts
    const batchStatusDistribution = [
      { name: 'Approved', count: approvedBatches, fill: '#16a34a' },
      { name: 'Under Lab Testing', count: underTestingBatches, fill: '#2563eb' },
      { name: 'Quarantined', count: quarantinedBatches, fill: '#d97706' },
      { name: 'Rejected', count: rejectedBatches, fill: '#dc2626' },
      {
        name: 'Registered',
        count: await Batch.countDocuments({ status: 'Registered' }),
        fill: '#64748b',
      },
    ];

    const testOutcomeDistribution = [
      { name: 'Passed', value: passedTests, fill: '#16a34a' },
      { name: 'Under Review', value: submittedTests, fill: '#f59e0b' },
      { name: 'In Progress', value: inProgressTests, fill: '#3b82f6' },
      { name: 'Failed', value: failedTests, fill: '#dc2626' },
    ];

    // 4. Category breakdown for Chemical vs Microbiological vs Heavy Metals
    const [chemicalCount, microCount, heavyMetalCount] = await Promise.all([
      Test.countDocuments({ testCategory: 'Chemical Analysis' }),
      Test.countDocuments({ testCategory: 'Microbiological Testing' }),
      Test.countDocuments({ testCategory: 'Heavy Metals and Contaminants' }),
    ]);

    const [chemicalPassed, microPassed, heavyMetalPassed] = await Promise.all([
      Test.countDocuments({ testCategory: 'Chemical Analysis', overallOutcome: 'Pass' }),
      Test.countDocuments({ testCategory: 'Microbiological Testing', overallOutcome: 'Pass' }),
      Test.countDocuments({ testCategory: 'Heavy Metals and Contaminants', overallOutcome: 'Pass' }),
    ]);

    const categoryPerformance = [
      {
        category: 'Chemical Analysis',
        total: chemicalCount,
        passed: chemicalPassed,
        failed: chemicalCount - chemicalPassed,
        rate: chemicalCount > 0 ? Math.round((chemicalPassed / chemicalCount) * 100) : 0,
      },
      {
        category: 'Microbiological',
        total: microCount,
        passed: microPassed,
        failed: microCount - microPassed,
        rate: microCount > 0 ? Math.round((microPassed / microCount) * 100) : 0,
      },
      {
        category: 'Heavy Metals',
        total: heavyMetalCount,
        passed: heavyMetalPassed,
        failed: heavyMetalCount - heavyMetalPassed,
        rate: heavyMetalCount > 0 ? Math.round((heavyMetalPassed / heavyMetalCount) * 100) : 0,
      },
    ];

    // 5. Monthly Batch Registration Trends (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = today.getMonth();
    const monthlyTrends = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), currentMonthIdx - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const registered = await Batch.countDocuments({
        createdAt: { $gte: start, $lte: end },
      });
      const approved = await Batch.countDocuments({
        status: 'Approved',
        approvalDate: { $gte: start, $lte: end },
      });

      monthlyTrends.push({
        month: months[start.getMonth()],
        year: start.getFullYear(),
        batchesRegistered: registered,
        batchesApproved: approved,
      });
    }

    // 6. Recent Activities from Audit Logs
    const recentActivities = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(10);

    // 7. Expiry Monitoring Widget items (top 6 expiring earliest)
    const expiringBatchesList = await Batch.find({
      expiryDate: { $lte: thirtyDaysFromNow },
    })
      .sort({ expiryDate: 1 })
      .limit(6);

    const expiryWidgetItems = expiringBatchesList.map((b) => {
      const diff = Math.ceil((new Date(b.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        _id: b._id,
        batchId: b.batchId,
        productName: b.productName,
        category: b.productCategory,
        expiryDate: b.expiryDate,
        remainingDays: diff,
        isExpired: diff <= 0,
        isWarning: diff > 0 && diff <= 15,
        status: b.status,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBatches,
          underTestingBatches,
          approvedBatches,
          quarantinedBatches: quarantinedBatches + rejectedBatches,
          expiringSoon: expiringSoonBatches,
          expired: expiredBatches,
        },
        performance: {
          testCompliancePercentage,
          batchReleasePercentage,
          passedTests,
          failedTests,
          testsUnderReview: submittedTests,
          inProgressTests,
          totalTests,
        },
        charts: {
          batchStatusDistribution,
          testOutcomeDistribution,
          categoryPerformance,
          monthlyTrends,
        },
        recentActivities,
        expiryWidget: expiryWidgetItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
