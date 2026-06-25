import CourseCategory from '../models/CourseCategory.js';

export const getCategories = async (req, res, next) => {
  try {
    const { regulationId } = req.query;
    let filter = {};
    if (regulationId && regulationId !== 'undefined' && regulationId !== 'null') {
      // Return regulation-specific categories AND global (shared) categories
      filter = { $or: [{ regulationId }, { regulationId: null }] };
    }
    const categories = await CourseCategory.find(filter).sort({ order: 1, code: 1 });
    return res.status(200).json({ categories });
  } catch (error) {
    return next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { code, name, ugc, order, regulationId } = req.body;
    const scopedRegulationId = (regulationId && regulationId !== 'undefined' && regulationId !== 'null')
      ? regulationId
      : null;
    const existing = await CourseCategory.findOne({ code, regulationId: scopedRegulationId });
    if (existing) {
      return res.status(400).json({ message: 'Course Category with this code already exists for this regulation.' });
    }
    const category = new CourseCategory({ code, name, ugc, order: order || 0, regulationId: scopedRegulationId });
    await category.save();
    return res.status(201).json({ category, message: 'Course Category created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, ugc, order, regulationId } = req.body;
    const scopedRegulationId = (regulationId && regulationId !== 'undefined' && regulationId !== 'null')
      ? regulationId
      : null;

    // Check if another category is using the same code in the same regulation scope
    const existing = await CourseCategory.findOne({ code, regulationId: scopedRegulationId, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'Another Course Category with this code already exists for this regulation.' });
    }

    const updateFields = { code, name, ugc, order };
    if (regulationId !== undefined) updateFields.regulationId = scopedRegulationId;

    const category = await CourseCategory.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Course Category not found.' });
    }

    return res.status(200).json({ category, message: 'Course Category updated successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await CourseCategory.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: 'Course Category not found.' });
    }
    return res.status(200).json({ message: 'Course Category deleted successfully.' });
  } catch (error) {
    return next(error);
  }
};
