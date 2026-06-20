import CourseCategory from '../models/CourseCategory.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await CourseCategory.find().sort({ code: 1 });
    return res.status(200).json({ categories });
  } catch (error) {
    return next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { code, name, ugc } = req.body;
    const existing = await CourseCategory.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: 'Course Category with this code already exists.' });
    }
    const category = new CourseCategory({ code, name, ugc });
    await category.save();
    return res.status(201).json({ category, message: 'Course Category created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, ugc } = req.body;
    
    // Check if another category is using the same code
    const existing = await CourseCategory.findOne({ code, _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: 'Another Course Category with this code already exists.' });
    }

    const category = await CourseCategory.findByIdAndUpdate(
      id,
      { code, name, ugc },
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
