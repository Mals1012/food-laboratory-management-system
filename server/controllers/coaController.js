const COARecord = require('../models/COARecord');
const Batch = require('../models/Batch');
const Test = require('../models/Test');
const Notification = require('../models/Notification');
const { logAudit } = require('../middleware/audit');
const { generateCOANumber } = require('../utils/idGenerators');

// @route   GET /api/coa/:batchId
// @desc    Get existing COA for a batch, or check batch eligibility
// @access  Private
const getCOAByBatch = async (req, res, next) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findOne({
      $or: [{ _id: batchId.match(/^[0-9a-fA-F]{24}$/) ? batchId : null }, { batchId: batchId.toUpperCase() }],
    })
      .populate('createdBy', 'username fullName')
      .populate('approvedBy', 'username fullName role');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: `Batch '${batchId}' not found.`,
      });
    }

    const existingCOA = await COARecord.findOne({ batch: batch._id })
      .populate('issuedBy', 'username fullName role department');

    const tests = await Test.find({ batch: batch._id })
      .populate('analyst', 'username fullName')
      .populate('qaReview.reviewedBy', 'username fullName');

    const isEligible = batch.status === 'Approved';

    res.status(200).json({
      success: true,
      data: {
        coa: existingCOA,
        batch,
        tests,
        isEligible,
        eligibilityReason: isEligible
          ? 'Batch is fully approved and certified for release.'
          : `Batch status is '${batch.status}'. Only batches with status 'Approved' can be issued a Certificate of Analysis.`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/coa/:batchId/generate
// @desc    Generate / Issue Certificate of Analysis for an Approved batch
// @access  Private (Admin, Quality Manager)
const generateCOA = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { notes } = req.body;

    const batch = await Batch.findOne({
      $or: [{ _id: batchId.match(/^[0-9a-fA-F]{24}$/) ? batchId : null }, { batchId: batchId.toUpperCase() }],
    }).populate('approvedBy', 'username fullName role');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: `Batch '${batchId}' not found.`,
      });
    }

    // STRICT REGULATORY ENFORCEMENT: Only Approved batches can have COA issued
    if (batch.status !== 'Approved') {
      return res.status(400).json({
        success: false,
        message: `Regulatory Violation: Cannot issue Certificate of Analysis for batch with status '${batch.status}'. Only 'Approved' batches may receive a valid COA.`,
      });
    }

    const tests = await Test.find({ batch: batch._id });
    if (tests.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate COA: No verified laboratory tests recorded for this batch.',
      });
    }

    // Check for any failing tests
    const hasFails = tests.some((t) => t.overallOutcome === 'Fail' || (t.qaReview && t.qaReview.decision === 'Rejected'));
    if (hasFails) {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate COA: One or more laboratory test results failed regulatory specifications.',
      });
    }

    // Check if an existing COA is already present
    let coa = await COARecord.findOne({ batch: batch._id });
    const certificateNumber = coa ? coa.certificateNumber : generateCOANumber(new Date().getFullYear());

    // Aggregate parameters by test category
    const chemicalResults = [];
    const microResults = [];
    const heavyMetalResults = [];

    tests.forEach((t) => {
      t.parameters.forEach((p) => {
        let specString = 'Conforms';
        if (p.minLimit !== null && p.maxLimit !== null) {
          specString = `${p.minLimit} - ${p.maxLimit} ${p.unit}`;
        } else if (p.minLimit !== null) {
          specString = `Min ${p.minLimit} ${p.unit}`;
        } else if (p.maxLimit !== null) {
          specString = `Max ${p.maxLimit} ${p.unit}`;
        } else if (p.textLimit) {
          specString = p.textLimit;
        }

        const row = {
          parameter: p.name,
          unit: p.unit,
          method: p.standardMethod,
          specification: specString,
          observed: p.observedValue || 'Conforms',
          result: p.status === 'Pass' ? 'PASS' : p.status === 'Fail' ? 'FAIL' : 'CONFORMS',
        };

        if (t.testCategory === 'Chemical Analysis') {
          chemicalResults.push(row);
        } else if (t.testCategory === 'Microbiological Testing') {
          microResults.push(row);
        } else if (t.testCategory === 'Heavy Metals and Contaminants') {
          heavyMetalResults.push(row);
        }
      });
    });

    const coaData = {
      certificateNumber,
      batch: batch._id,
      batchId: batch.batchId,
      productName: batch.productName,
      productCategory: batch.productCategory,
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      storageConditions: `${batch.storageConditions} (${batch.storageTemperature})`,
      sampleInfo: {
        sampleId: `SMP-${batch.batchId}`,
        collectionDate: batch.samplingDate || batch.createdAt,
        sampleLocation: batch.sampleLocation || 'Standard Manufacturing Line',
      },
      testResults: {
        chemical: chemicalResults,
        microbiological: microResults,
        heavyMetals: heavyMetalResults,
      },
      overallVerdict: 'CONFORMS TO FSSAI & CODEX REGULATORY SPECIFICATIONS - APPROVED FOR COMMERCIAL RELEASE',
      issuedBy: req.user._id,
      issuedByName: req.user.fullName,
      issueDate: new Date(),
      accreditationStandard: 'ISO/IEC 17025:2017 Testing Laboratory Accreditation (NABL / ILAC MRA)',
      status: 'Issued',
      notes: notes || 'All laboratory test procedures performed according to validated AOAC and ISO standard test methods.',
    };

    if (coa) {
      Object.assign(coa, coaData);
      await coa.save();
    } else {
      coa = await COARecord.create(coaData);
    }

    await logAudit({
      username: req.user.username,
      userRole: req.user.role,
      userId: req.user._id,
      action: 'COA_GENERATE',
      entityType: 'COA',
      entityId: coa.certificateNumber,
      description: `Issued official Certificate of Analysis ${coa.certificateNumber} for batch ${batch.batchId}.`,
      metadata: { batchId: batch.batchId, certificateNumber: coa.certificateNumber },
    });

    await Notification.create({
      recipientRole: 'All',
      title: `COA Issued: ${coa.certificateNumber}`,
      message: `Official Certificate of Analysis ${coa.certificateNumber} has been issued for Batch ${batch.batchId}.`,
      type: 'success',
      link: `/coa?batchId=${batch.batchId}`,
      entityId: batch.batchId,
    });

    res.status(201).json({
      success: true,
      message: `Certificate of Analysis ${coa.certificateNumber} generated successfully.`,
      data: coa,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCOAByBatch,
  generateCOA,
};
