const ProductSpecification = require('../models/ProductSpecification');
const { logAudit } = require('../middleware/audit');

// @route   GET /api/specifications
// @desc    Get all product specifications or filter by category
// @access  Private
const getSpecifications = async (req, res, next) => {
  try {
    const { category, testCategory } = req.query;
    const query = {};

    if (category && category !== 'All') {
      query.productCategory = category;
    }
    if (testCategory && testCategory !== 'All') {
      query.testCategory = testCategory;
    }

    const specs = await ProductSpecification.find(query).sort({
      productCategory: 1,
      testCategory: 1,
    });

    res.status(200).json({
      success: true,
      data: specs,
    });
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/specifications/:id
// @desc    Update specification limits (Admin, Quality Manager)
// @access  Private (Admin, Quality Manager)
const updateSpecification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { parameters, regulatoryReference, version } = req.body;

    const spec = await ProductSpecification.findById(id);
    if (!spec) {
      return res.status(404).json({
        success: false,
        message: 'Specification record not found.',
      });
    }

    if (parameters) spec.parameters = parameters;
    if (regulatoryReference) spec.regulatoryReference = regulatoryReference;
    if (version) spec.version = version;

    await spec.save();

    await logAudit({
      username: req.user.username,
      userRole: req.user.role,
      userId: req.user._id,
      action: 'SPEC_UPDATE',
      entityType: 'ProductSpecification',
      entityId: spec._id.toString(),
      description: `Updated specification standards for ${spec.productCategory} - ${spec.testCategory}.`,
    });

    res.status(200).json({
      success: true,
      message: 'Specification limits updated successfully.',
      data: spec,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSpecifications,
  updateSpecification,
};
