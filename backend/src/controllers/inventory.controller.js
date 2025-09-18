import InventoryProduct from "../models/inventory.model.js";

export const listInventory = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      category, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query object
    const query = {};
    
    // Add filters
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination and sorting
    const items = await InventoryProduct.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() for better performance

    // Get total count for pagination
    const total = await InventoryProduct.countDocuments(query);

    return res.json({ 
      success: true, 
      data: items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createInventory = async (req, res) => {
  try {
    const { name, category, description, images, stockQuantity, price, status } = req.body;
    
    // Auto-determine status based on stock quantity
    let autoStatus = 'Available';
    if (stockQuantity === 0) {
      autoStatus = 'Out of stock';
    } else if (stockQuantity < 15) {
      autoStatus = 'Low stock';
    }
    
    const item = await InventoryProduct.create({ 
      name, 
      category, 
      description, 
      images, 
      stockQuantity, 
      price, 
      status: autoStatus 
    });
    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, images, stockQuantity, price, status } = req.body;
    
    // Auto-determine status based on stock quantity if stockQuantity is being updated
    let autoStatus = status;
    if (stockQuantity !== undefined) {
      if (stockQuantity === 0) {
        autoStatus = 'Out of stock';
      } else if (stockQuantity < 15) {
        autoStatus = 'Low stock';
      } else {
        autoStatus = 'Available';
      }
    }
    
    const update = {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(images !== undefined && { images }),
      ...(stockQuantity !== undefined && { stockQuantity }),
      ...(price !== undefined && { price }),
      ...(autoStatus !== undefined && { status: autoStatus }),
    };
    const item = await InventoryProduct.findByIdAndUpdate(id, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await InventoryProduct.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getInventoryStats = async (_req, res) => {
  try {
    // Get statistics without fetching all documents
    const stats = await InventoryProduct.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' },
          availableItems: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Available'] }, 1, 0]
            }
          },
          lowStockItems: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Low stock'] }, 1, 0]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Out of stock'] }, 1, 0]
            }
          },
          avgPrice: { $avg: '$price' },
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } }
        }
      }
    ]);

    // Get category distribution
    const categoryStats = await InventoryProduct.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stockQuantity' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent items (last 5)
    const recentItems = await InventoryProduct.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name category status createdAt')
      .lean();

    return res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalItems: 0,
          totalStock: 0,
          availableItems: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          avgPrice: 0,
          totalValue: 0
        },
        categoryDistribution: categoryStats,
        recentItems
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


