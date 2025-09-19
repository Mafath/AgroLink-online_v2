import RentalItem from "../models/rentalItem.model.js";
import cloudinary from "../lib/cloudinary.js";

export const createRentalItem = async (req, res) => {
  try {
    const { productName, description, rentalPerDay, rentalPerWeek, images, totalQty } = req.body;

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

    const item = await RentalItem.create({
      productName,
      description: description || "",
      rentalPerDay,
      rentalPerWeek,
      images: imageUrls,
      totalQty,
      availableQty: totalQty,
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const listRentalItems = async (_req, res) => {
  try {
    const items = await RentalItem.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRentalItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, description, rentalPerDay, rentalPerWeek, images, totalQty } = req.body;

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
      ...(productName !== undefined && { productName }),
      ...(description !== undefined && { description }),
      ...(rentalPerDay !== undefined && { rentalPerDay }),
      ...(rentalPerWeek !== undefined && { rentalPerWeek }),
      ...(imageUrls !== undefined && { images: imageUrls }),
      ...(totalQty !== undefined && { totalQty, availableQty: totalQty }),
    };
    const item = await RentalItem.findByIdAndUpdate(id, update, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: item });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteRentalItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await RentalItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};


