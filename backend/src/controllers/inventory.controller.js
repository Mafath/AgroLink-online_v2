import InventoryProduct from "../models/inventory.model.js";

export const listInventory = async (_req, res) => {
  try {
    const items = await InventoryProduct.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
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


