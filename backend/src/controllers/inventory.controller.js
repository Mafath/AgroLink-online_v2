import InventoryProduct from "../models/inventory.model.js";
import cloudinary from "../lib/cloudinary.js";

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

    let imageUrls = [];
    if (Array.isArray(images) && images.length) {
      const limited = images.slice(0, 4);
      try {
        const haveCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
        if (haveCloudinary) {
          const uploads = await Promise.all(
            limited.map((img) => cloudinary.uploader.upload(img))
          );
          imageUrls = uploads.map(u => u.secure_url);
        } else {
          imageUrls = limited;
        }
      } catch (e) {
        console.log('Image upload error:', e.message);
        // continue without images instead of failing
        imageUrls = [];
      }
    }
    
    const item = await InventoryProduct.create({ 
      name, 
      category, 
      description, 
      images: imageUrls, 
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

    let imageUrls = undefined;
    if (Array.isArray(images)) {
      const limited = images.slice(0, 4);
      try {
        const haveCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
        if (haveCloudinary) {
          const uploads = await Promise.all(
            limited.map((img) => cloudinary.uploader.upload(img))
          );
          imageUrls = uploads.map(u => u.secure_url);
        } else {
          imageUrls = limited;
        }
      } catch (e) {
        console.log('Image upload error:', e.message);
        // continue without updating images
      }
    }
    
    const update = {
      ...(name !== undefined && { name }),
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(imageUrls !== undefined && { images: imageUrls }),
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


