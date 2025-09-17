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
    const { name, category, description, image, stockQuantity, price, status } = req.body;
    const item = await InventoryProduct.create({ name, category, description, image, stockQuantity, price, status });
    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, image, stockQuantity, price, status } = req.body;
    const update = {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(image !== undefined && { image }),
      ...(stockQuantity !== undefined && { stockQuantity }),
      ...(price !== undefined && { price }),
      ...(status !== undefined && { status }),
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


