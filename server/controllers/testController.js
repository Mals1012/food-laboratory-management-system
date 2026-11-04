const Test = require('../models/Test');
const Batch = require('../models/Batch');
const ProductSpecification = require('../models/ProductSpecification');
const Notification = require('../models/Notification');
const { logAudit } = require('../middleware/audit');
const { generateTestId } = require('../utils/idGenerators');

// Helper to evaluate a parameter against specification limits
const evaluateParameter = (param) => {
  const { minLimit, maxLimit, textLimit, observedValue } = param;
  if (observedValue === null || observedValue === undefined || observedValue === '') {
    return 'Pending';
  }

  // If numeric comparison is possible
  const numVal = parseFloat(observedValue);
  if (!isNaN(numVal) && (minLimit !== null || maxLimit !== null)) {
    if (minLimit !== null && numVal < minLimit) return 'Fail';
    if (maxLimit !== null && numVal > maxLimit) return 'Fail';
    return 'Pass';
  }

  // If string comparison (e.g. Absent / Negative)
  if (textLimit) {
    const cleanObserved = String(observedValue).trim().toLowerCase();
    const cleanTarget = String(textLimit).trim().toLowerCase();
    if (cleanObserved.includes('absent') || cleanObserved.includes('negative') || cleanObserved === cleanTarget) {
      return 'Pass';
    }
    if (cleanObserved.includes('present') || cleanObserved.includes('positive') || cleanObserved.includes('detected')) {
      return 'Fail';
    }
  }

  return 'Pass';
};

// @route   GET /api/tests
// @desc    Get all tests with search, category filter, outcome filter
// @access  Private
const getTests = async (req, res, next) => {
  try {
    const {
      search,
      category,
      outcome,
      batchId,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { testId: { $regex: search, $options: 'i' } },
        { batchId: { $regex: search, $options: 'i' } },
        { sampleDescription: { $regex: search, $options: 'i' } },
        { analystName: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.testCategory = category;
    }

    if (outcome && outcome !== 'All') {
      query.overallOutcome = outcome;
    }

    if (batchId) {
      query.batchId = batchId.toUpperCase();
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [tests, total] = await Promise.all([
      Test.find(query)
        .populate('batch', 'batchId productName productCategory status')
        .populate('analyst', 'username fullName role department')
        .populate('qaReview.reviewedBy', 'username fullName role department')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Test.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: tests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/tests/:id
// @desc    Get test by ID
// @access  Private
const getTestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await Test.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { testId: id.toUpperCase() }],
    })
      .populate('batch')
      .populate('analyst', 'username fullName role department')
      .populate('qaReview.reviewedBy', 'username fullName role department');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Laboratory test record not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/tests
// @desc    Create / register a new laboratory test
// @access  Private (Admin, Lab Manager, Lab Analyst)
const createTest = async (req, res, next) => {
  try {
    const { batchId, testCategory, sampleDescription, parameters, analystName, notes } = req.body;

    if (!batchId || !testCategory) {
      return res.status(400).json({
        success: false,
        message: 'Batch ID and Test Category are required.',
      });
    }

    const batch = await Batch.findOne({ batchId: batchId.toUpperCase() });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: `Batch '${batchId}' does not exist.`,
      });
    }

    // Auto load parameters from ProductSpecification if none provided
    let testParameters = parameters;
    if (!testParameters || testParameters.length === 0) {
      const spec = await ProductSpecification.findOne({
        productCategory: batch.productCategory,
        testCategory,
      });

      if (spec && spec.parameters.length > 0) {
        testParameters = spec.parameters.map((p) => ({
          name: p.name,
          unit: p.unit,
          standardMethod: p.standardMethod,
          minLimit: p.minLimit,
          maxLimit: p.maxLimit,
          textLimit: p.textLimit,
          observedValue: '',
          status: 'Pending',
          remarks: '',
        }));
      } else {
        testParameters = [];
      }
    }

    const testId = generateTestId(testCategory, new Date().getFullYear());

    const newTest = await Test.create({
      testId,
      batch: batch._id,
      batchId: batch.batchId,
      sampleDescription: sampleDescription || `Routine Quality Sample - ${batch.productName}`,
      testCategory,
      sampleCollectionDate: new Date(),
      analyst: req.user._id,
      analystName: analystName || req.user.fullName,
      parameters: testParameters,
      overallOutcome: 'In Progress',
      notes: notes || '',
    });

    // If batch was merely 'Registered', update it to 'Under Lab Testing'
    if (batch.status === 'Registered') {
      batch.status = 'Under Lab Testing';
      await batch.save();
    }

    await logAudit({
      username: req.user.username,
      userRole: req.user.role,
      userId: req.user._id,
      action: 'TEST_CREATE',
      entityType: 'Test',
      entityId: newTest.testId,
      description: `Created new test ${newTest.testId} (${testCategory}) for batch ${batch.batchId}.`,
    });

    res.status(201).json({
      success: true,
      message: `Test record ${newTest.testId} created successfully.`,
      data: newTest,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/tests/:id
// @desc    Update test parameters, save drafts, or submit for QA review
// @access  Private (Admin, Lab Manager, Lab Analyst)
const updateTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parameters, notes, isSubmittingForReview } = req.body;

    const test = await Test.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { testId: id.toUpperCase() }],
    }).populate('batch');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test record not found.',
      });
    }

    if (test.overallOutcome === 'Pass' || test.overallOutcome === 'Fail') {
      // If already finalized by QA, only Admin can edit
      if (req.user.role !== 'Admin') {
        return res.status(400).json({
          success: false,
          message: 'This test has already been reviewed and finalized by QA. Cannot edit.',
        });
      }
    }

    if (notes !== undefined) test.notes = notes;

    if (parameters && Array.isArray(parameters)) {
      test.parameters = parameters.map((param) => {
        const status = evaluateParameter(param);
        return {
          ...param,
          status,
        };
      });
    }

    let actionType = 'TEST_UPDATE';
    let actionDesc = `Updated parameters for test ${test.testId}.`;

    if (isSubmittingForReview) {
      test.overallOutcome = 'Submitted';
      test.analysisCompletionDate = new Date();
      actionType = 'TEST_SUBMIT';
      actionDesc = `Analyst ${req.user.fullName} submitted test ${test.testId} for Quality Manager review.`;

      // Notify Quality Managers
      await Notification.create({
        recipientRole: 'Quality Manager',
        title: 'Test Submitted for QA Review',
        message: `Test ${test.testId} (${test.testCategory}) for Batch ${test.batchId} has been submitted for review.`,
        type: 'warning',
        link: `/qa-review?testId=${test.testId}`,
        entityId: test.testId,
      });
    } else {
      if (test.overallOutcome === 'Pending') {
        test.overallOutcome = 'In Progress';
      }
    }

    await test.save();

    await logAudit({
      username: req.user.username,
      userRole: req.user.role,
      userId: req.user._id,
      action: actionType,
      entityType: 'Test',
      entityId: test.testId,
      description: actionDesc,
    });

    res.status(200).json({
      success: true,
      message: isSubmittingForReview
        ? `Test ${test.testId} submitted for QA review successfully.`
        : 'Test progress saved successfully.',
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PATCH /api/tests/:id/review
// @desc    QA Review (Approve or Reject test outcome) & auto-sync batch status
// @access  Private (Admin, Quality Manager)
const reviewTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, comments } = req.body; // decision: 'Approved' | 'Rejected'

    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be either 'Approved' or 'Rejected'.",
      });
    }

    const test = await Test.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { testId: id.toUpperCase() }],
    }).populate('batch');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test record not found.',
      });
    }

    const hasFailedParam = test.parameters.some((p) => p.status === 'Fail');

    // If decision is Approved, overall outcome is 'Pass' unless parameter failed
    if (decision === 'Approved') {
      if (hasFailedParam) {
        return res.status(400).json({
          success: false,
          message:
            'Cannot approve test because one or more parameters failed specification limits. Must Reject or request re-testing.',
        });
      }
      test.overallOutcome = 'Pass';
    } else {
      test.overallOutcome = 'Fail';
    }

    test.qaReview = {
      reviewedBy: req.user._id,
      reviewerName: req.user.fullName,
      reviewDate: new Date(),
      decision,
      comments: comments || (decision === 'Approved' ? 'Conforms to quality specifications.' : 'Rejected due to out of specification results.'),
    };

    await test.save();

    await logAudit({
      username: req.user.username,
      userRole: req.user.role,
      userId: req.user._id,
      action: decision === 'Approved' ? 'QA_APPROVE' : 'QA_REJECT',
      entityType: 'Test',
      entityId: test.testId,
      description: `QA Manager ${req.user.fullName} ${decision.toLowerCase()} test ${test.testId} (${test.testCategory}).`,
      metadata: { decision, comments, batchId: test.batchId },
    });

    // Synchronize linked batch status!
    const batch = await Batch.findById(test.batch._id);
    if (batch) {
      const allBatchTests = await Test.find({ batch: batch._id });
      const anyTestFailed = allBatchTests.some(
        (t) => t.overallOutcome === 'Fail' || (t.qaReview && t.qaReview.decision === 'Rejected')
      );

      if (anyTestFailed) {
        batch.status = 'Quarantined';
        batch.quarantineReason = `Quarantined due to failed laboratory test (${test.testId} - ${test.testCategory}).`;
        await batch.save();

        await logAudit({
          username: req.user.username,
          userRole: req.user.role,
          userId: req.user._id,
          action: 'BATCH_STATUS_CHANGE',
          entityType: 'Batch',
          entityId: batch.batchId,
          description: `Batch ${batch.batchId} automatically placed in QUARANTINE due to test failure.`,
        });

        await Notification.create({
          recipientRole: 'All',
          title: `CRITICAL: Batch ${batch.batchId} Quarantined`,
          message: `Batch ${batch.batchId} has been Quarantined due to failed test ${test.testId}.`,
          type: 'danger',
          link: `/batches/${batch.batchId}`,
          entityId: batch.batchId,
        });
      } else {
        // Check if all required tests are completed and passed
        const allTestsPassed =
          allBatchTests.length > 0 &&
          allBatchTests.every((t) => t.overallOutcome === 'Pass' && t.qaReview && t.qaReview.decision === 'Approved');

        if (allTestsPassed) {
          batch.status = 'Approved';
          batch.approvedBy = req.user._id;
          batch.approvalDate = new Date();
          await batch.save();

          await logAudit({
            username: req.user.username,
            userRole: req.user.role,
            userId: req.user._id,
            action: 'BATCH_STATUS_CHANGE',
            entityType: 'Batch',
            entityId: batch.batchId,
            description: `Batch ${batch.batchId} automatically APPROVED after all analytical tests passed QA review.`,
          });

          await Notification.create({
            recipientRole: 'All',
            title: `Batch ${batch.batchId} Approved for Release`,
            message: `All laboratory tests for Batch ${batch.batchId} have passed QA sign-off. Batch is Approved.`,
            type: 'success',
            link: `/batches/${batch.batchId}`,
            entityId: batch.batchId,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Test ${test.testId} successfully ${decision.toLowerCase()}.`,
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  reviewTest,
};
