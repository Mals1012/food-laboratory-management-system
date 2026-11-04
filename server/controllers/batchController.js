const Batch = require('../models/Batch');
const Test = require('../models/Test');
const COARecord = require('../models/COARecord');
const Notification = require('../models/Notification');
const { logAudit } = require('../middleware/audit');
const { generateBatchId } = require('../utils/idGenerators');

// @route   GET /api/batches
// @desc    Get all batches with search, filters, pagination
// @access  Private
const getBatches = async (req, res, next) => {
  try {
    const {
      search,
      status,
      category,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { batchId: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.productCategory = category;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [batches, total] = await Promise.all([
      Batch.find(query)
        .populate('createdBy', 'username fullName role')
        .populate('approvedBy', 'username fullName role')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Batch.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: batches,
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

// @route   GET /api/batches/:id
// @desc    Get single batch details with associated tests
// @access  Private
const getBatchById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id.toUpperCase() }],
    })
      .populate('createdBy', 'username fullName role department')
      .populate('approvedBy', 'username fullName role department');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found.',
      });
    }

    const tests = await Test.find({ batch: batch._id })
      .populate('analyst', 'username fullName role')
      .populate('qaReview.reviewedBy', 'username fullName role')
      .sort({ createdAt: -1 });

    const coa = await COARecord.findOne({ batch: batch._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        batch,
        tests,
        coa,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/batches
// @desc    Create / register a new batch
// @access  Private (Admin, Lab Manager, Production Staff)
const createBatch = async (req, res, next) => {
  try {
    const {
      productName,
      productCategory,
      manufacturingDate,
      expiryDate,
      storageTemperature,
      storageHumidity,
      storageConditions,
      description,
      quantity,
      unit,
      sampleLocation,
    } = req.body;

    if (!productName || !productCategory || !manufacturingDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Product name, category, manufacturing date, and expiry date are required.',
      });
    }

    const mfg = new Date(manufacturingDate);
    const exp = new Date(expiryDate);
    if (exp <= mfg) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date must be after manufacturing date.',
      });
    }

    let batchId = req.body.batchId ? req.body.batchId.trim().toUpperCase() : null;
    if (!batchId) {
      let isUnique = false;
      while (!isUnique) {
        batchId = generateBatchId(new Date(manufacturingDate).getFullYear() || 2026);
        const existing = await Batch.findOne({ batchId });
        if (!existing) isUnique = true;
      }
    } else {
      const existing = await Batch.findOne({ batchId });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Batch ID '${batchId}' is already registered.`,
        });
      }
    }

    const newBatch = await Batch.create({
      batchId,
      productName: productName.trim(),
      productCategory,
      manufacturingDate: mfg,
      expiryDate: exp,
      storageTemperature: storageTemperature || '4°C ± 2°C',
      storageHumidity: storageHumidity || '< 65% RH',
      storageConditions: storageConditions || 'Ambient (18-25°C)',
      description: description ? description.trim() : '',
      quantity: Number(quantity) || 1000,
      unit: unit || 'kg',
      sampleLocation: sampleLocation || 'Main Plant Sampling Station',
      samplingDate: new Date(),
      status: 'Registered',
      createdBy: req.user._id,
    });

    await logAudit({
      username: req.user.username,
      userRole: req.user.role,
      userId: req.user._id,
      action: 'BATCH_CREATE',
      entityType: 'Batch',
      entityId: newBatch.batchId,
      description: `Registered new batch: ${newBatch.batchId} (${newBatch.productName}, ${newBatch.productCategory}).`,
      metadata: { quantity: newBatch.quantity, unit: newBatch.unit },
    });

    await Notification.create({
      recipientRole: 'Lab Manager',
      title: 'New Food Batch Registered',
      message: `Batch ${newBatch.batchId} (${newBatch.productName}) has been registered and is ready for sample assignment.`,
      type: 'info',
      link: `/batches/${newBatch.batchId}`,
      entityId: newBatch.batchId,
    });

    res.status(201).json({
      success: true,
      message: `Batch ${newBatch.batchId} created successfully.`,
      data: newBatch,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/batches/:id
// @desc    Update batch details
// @access  Private (Admin, Lab Manager, Production Staff)
const updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id.toUpperCase() }],
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found.',
      });
    }

    const {
      productName,
      productCategory,
      manufacturingDate,
      expiryDate,
      storageTemperature,
      storageHumidity,
      storageConditions,
      description,
      quantity,
      unit,
      status,
      quarantineReason,
      notes,
    } = req.body;

    const previousStatus = batch.status;

    if (productName) batch.productName = productName.trim();
    if (productCategory) batch.productCategory = productCategory;
    if (manufacturingDate) batch.manufacturingDate = new Date(manufacturingDate);
    if (expiryDate) batch.expiryDate = new Date(expiryDate);
    if (storageTemperature) batch.storageTemperature = storageTemperature;
    if (storageHumidity) batch.storageHumidity = storageHumidity;
    if (storageConditions) batch.storageConditions = storageConditions;
    if (description !== undefined) batch.description = description;
    if (quantity !== undefined) batch.quantity = Number(quantity);
    if (unit) batch.unit = unit;
    if (quarantineReason !== undefined) batch.quarantineReason = quarantineReason;
    if (notes !== undefined) batch.notes = notes;

    // Status change authorization check
    if (status && status !== previousStatus) {
      // Changing to Approved or Quarantined/Rejected requires Quality Manager or Admin
      if (
        (status === 'Approved' || status === 'Quarantined' || status === 'Rejected') &&
        !['Admin', 'Quality Manager'].includes(req.user.role)
      ) {
        return res.status(403).json({
          success: false,
          message: `Changing batch status to '${status}' requires Quality Manager or Admin authorization.`,
        });
      }

      batch.status = status;
      if (status === 'Approved') {
        batch.approvedBy = req.user._id;
        batch.approvalDate = new Date();
      }

      await logAudit({
        username: req.user.username,
        userRole: req.user.role,
        userId: req.user._id,
        action: 'BATCH_STATUS_CHANGE',
        entityType: 'Batch',
        entityId: batch.batchId,
        description: `Batch status changed from '${previousStatus}' to '${status}'.`,
        metadata: { previousStatus, newStatus: status, quarantineReason },
      });

      await Notification.create({
        recipientRole: 'All',
        title: `Batch ${batch.batchId} Status: ${status}`,
        message: `Batch ${batch.batchId} (${batch.productName}) status was changed to ${status}.`,
        type: status === 'Approved' ? 'success' : status === 'Quarantined' ? 'danger' : 'warning',
        link: `/batches/${batch.batchId}`,
        entityId: batch.batchId,
      });
    } else {
      await logAudit({
        username: req.user.username,
        userRole: req.user.role,
        userId: req.user._id,
        action: 'BATCH_UPDATE',
        entityType: 'Batch',
        entityId: batch.batchId,
        description: `Batch ${batch.batchId} details updated.`,
      });
    }

    await batch.save();

    res.status(200).json({
      success: true,
      message: 'Batch updated successfully.',
      data: batch,
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/batches/:id/traceability
// @desc    Get complete audit & processing timeline traceability for batch
// @access  Private
const getBatchTraceability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const batch = await Batch.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { batchId: id.toUpperCase() }],
    })
      .populate('createdBy', 'username fullName role department')
      .populate('approvedBy', 'username fullName role department');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found.',
      });
    }

    const tests = await Test.find({ batch: batch._id })
      .populate('analyst', 'username fullName role department')
      .populate('qaReview.reviewedBy', 'username fullName role department')
      .sort({ createdAt: 1 });

    const coa = await COARecord.findOne({ batch: batch._id })
      .populate('issuedBy', 'username fullName role department');

    // Build timeline events
    const timeline = [];

    // Step 1: Batch Registration
    timeline.push({
      step: 1,
      title: 'Batch Registration',
      subtitle: `Product: ${batch.productName} (${batch.productCategory})`,
      timestamp: batch.createdAt,
      actor: batch.createdBy ? batch.createdBy.fullName : 'Production Department',
      role: batch.createdBy ? batch.createdBy.role : 'Production Staff',
      status: 'Completed',
      details: {
        batchId: batch.batchId,
        manufacturingDate: batch.manufacturingDate,
        expiryDate: batch.expiryDate,
        quantity: `${batch.quantity} ${batch.unit}`,
        storageConditions: batch.storageConditions,
        storageTemperature: batch.storageTemperature,
      },
      icon: 'PackagePlus',
    });

    // Step 2: Sampling & Laboratory Intake
    timeline.push({
      step: 2,
      title: 'Sample Collection & Lab Intake',
      subtitle: `Sample Location: ${batch.sampleLocation || 'Processing Floor'}`,
      timestamp: batch.samplingDate || batch.createdAt,
      actor: 'Sampling Technician / Lab Intake',
      role: 'Lab Operations',
      status: batch.status === 'Registered' ? 'In Progress' : 'Completed',
      details: {
        samplingDate: batch.samplingDate || batch.createdAt,
        location: batch.sampleLocation,
        storageRequirements: batch.storageTemperature,
      },
      icon: 'FlaskConical',
    });

    // Step 3: Laboratory Testing Execution
    if (tests.length > 0) {
      tests.forEach((test, idx) => {
        timeline.push({
          step: 3,
          title: `Lab Test: ${test.testCategory}`,
          subtitle: `Test ID: ${test.testId} | Sample: ${test.sampleDescription}`,
          timestamp: test.createdAt,
          actor: test.analystName || 'Analyst',
          role: 'Lab Analyst',
          status:
            test.overallOutcome === 'Pass'
              ? 'Passed'
              : test.overallOutcome === 'Fail'
              ? 'Failed'
              : test.overallOutcome === 'Submitted'
              ? 'Submitted for Review'
              : 'In Progress',
          details: {
            testId: test.testId,
            category: test.testCategory,
            outcome: test.overallOutcome,
            parametersCount: test.parameters.length,
            parameters: test.parameters.map((p) => ({
              name: p.name,
              observed: p.observedValue,
              unit: p.unit,
              status: p.status,
            })),
          },
          icon: 'Microscope',
        });
      });
    } else {
      timeline.push({
        step: 3,
        title: 'Laboratory Testing',
        subtitle: 'No tests assigned yet',
        timestamp: null,
        actor: 'Lab Manager',
        role: 'Lab Manager',
        status: 'Pending Assignment',
        details: {},
        icon: 'Microscope',
      });
    }

    // Step 4: Quality Assurance Review & Decision
    const reviewedTests = tests.filter((t) => t.qaReview && t.qaReview.decision);
    if (reviewedTests.length > 0 || batch.status === 'Approved' || batch.status === 'Quarantined') {
      const isApproved = batch.status === 'Approved';
      timeline.push({
        step: 4,
        title: 'QA Review & Batch Release Decision',
        subtitle: isApproved ? 'Batch Approved for Market Release' : `Batch Status: ${batch.status}`,
        timestamp: batch.approvalDate || batch.updatedAt,
        actor: batch.approvedBy ? batch.approvedBy.fullName : 'QA Management Board',
        role: 'Quality Manager',
        status: isApproved ? 'Approved' : batch.status === 'Quarantined' ? 'Quarantined' : 'Under Review',
        details: {
          decision: batch.status,
          approvedBy: batch.approvedBy ? batch.approvedBy.fullName : null,
          approvalDate: batch.approvalDate,
          quarantineReason: batch.quarantineReason || null,
          reviewedCount: reviewedTests.length,
        },
        icon: 'ShieldCheck',
      });
    } else {
      timeline.push({
        step: 4,
        title: 'QA Review & Batch Release',
        subtitle: 'Pending test completion and QA sign-off',
        timestamp: null,
        actor: 'Quality Manager',
        role: 'Quality Manager',
        status: 'Pending',
        details: {},
        icon: 'ShieldCheck',
      });
    }

    // Step 5: Certificate of Analysis (COA)
    if (coa) {
      timeline.push({
        step: 5,
        title: 'Certificate of Analysis (COA) Issued',
        subtitle: `Certificate #${coa.certificateNumber}`,
        timestamp: coa.issueDate,
        actor: coa.issuedByName,
        role: 'Quality Manager',
        status: 'Issued',
        details: {
          certificateNumber: coa.certificateNumber,
          issueDate: coa.issueDate,
          standard: coa.accreditationStandard,
          verdict: coa.overallVerdict,
        },
        icon: 'Award',
      });
    } else {
      timeline.push({
        step: 5,
        title: 'Certificate of Analysis (COA)',
        subtitle: batch.status === 'Approved' ? 'Ready for COA issuance' : 'Awaiting batch approval',
        timestamp: null,
        actor: 'Quality Manager',
        role: 'Quality Manager',
        status: batch.status === 'Approved' ? 'Ready for Generation' : 'Pending Approval',
        details: {},
        icon: 'Award',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        batch,
        tests,
        coa,
        timeline,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/batches/expiring
// @desc    Get expiring batches (within 30 days or already expired)
// @access  Private
const getExpiringBatches = async (req, res, next) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const batches = await Batch.find({
      expiryDate: { $lte: thirtyDaysFromNow },
    })
      .populate('createdBy', 'username fullName')
      .sort({ expiryDate: 1 });

    const expired = [];
    const expiringSoon = [];

    batches.forEach((batch) => {
      const exp = new Date(batch.expiryDate);
      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const item = {
        ...batch.toObject(),
        remainingShelfLifeDays: diffDays,
        isExpired: diffDays <= 0,
        isExpiringSoon: diffDays > 0 && diffDays <= 30,
      };

      if (diffDays <= 0) {
        expired.push(item);
      } else {
        expiringSoon.push(item);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        all: batches,
        expired,
        expiringSoon,
        counts: {
          total: batches.length,
          expired: expired.length,
          expiringSoon: expiringSoon.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  getBatchTraceability,
  getExpiringBatches,
};
