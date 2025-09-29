import RentalItem from "../models/rentalItem.model.js";
import RentalBooking from "../models/rentalBooking.model.js";
import cloudinary from "../lib/cloudinary.js";

export const createRentalItem = async (req, res) => {
  try {
    const { productName, description, rentalPerDay, images, totalQty } = req.body;

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

// Get availability for a rental item between dates (sum of overlapping bookings subtracted from totalQty)
export const getRentalAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { start, end } = req.query;
    const item = await RentalItem.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (!(startDate instanceof Date) || isNaN(startDate) || !(endDate instanceof Date) || isNaN(endDate) || endDate < startDate) {
      return res.status(400).json({ success: false, message: 'Invalid date range' });
    }

    // Find overlapping confirmed bookings
    const bookings = await RentalBooking.find({
      item: id,
      status: 'CONFIRMED',
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
      ],
    }).select('quantity startDate endDate');

    // For simplicity, return total booked quantity overlapping any day in range
    const totalBooked = bookings.reduce((sum, b) => sum + (b.quantity || 0), 0);
    const available = Math.max(0, (item.totalQty || 0) - totalBooked);

    return res.json({ success: true, data: { totalQty: item.totalQty, availableQty: available } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Create a booking if available
export const createRentalBooking = async (req, res) => {
  try {
    const { id } = req.params; // rental item id
    const { quantity, startDate, endDate, notes } = req.body;
    const item = await RentalItem.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!quantity || quantity < 1 || !(start instanceof Date) || isNaN(start) || !(end instanceof Date) || isNaN(end) || end < start) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    // Compute overlapping bookings quantity
    const overlaps = await RentalBooking.find({
      item: id,
      status: 'CONFIRMED',
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    }).select('quantity');
    const booked = overlaps.reduce((s, b) => s + (b.quantity || 0), 0);
    const available = Math.max(0, (item.totalQty || 0) - booked);
    if (quantity > available) {
      return res.status(400).json({ success: false, message: `Only ${available} available for selected dates` });
    }

    const booking = await RentalBooking.create({
      item: id,
      renter: req.user._id,
      quantity,
      startDate: start,
      endDate: end,
      notes: notes || '',
      status: 'CONFIRMED',
    });

    return res.status(201).json({ success: true, data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRentalItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, description, rentalPerDay, images, totalQty } = req.body;

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


