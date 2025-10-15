import Listing from "../models/listing.model.js";
import { logListingAdded, logItemExpired } from "../lib/activityService.js";
import { computeFinalPriceWithCommission } from "../lib/utils.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Auto-expire listings that have passed their best-before date and still have capacity
async function autoExpireListings(extraFilter = {}) {
  try {
    // First find the listings that will be expired
    const expiredListings = await Listing.find({
      status: 'AVAILABLE',
      capacityKg: { $gt: 0 },
      expireAfterDays: { $type: 'number', $gt: 0 },
      ...extraFilter,
      $expr: {
        $lt: [
          { $add: [ '$harvestedAt', { $multiply: [ '$expireAfterDays', MS_PER_DAY ] } ] },
          new Date()
        ]
      }
    });

    // Log activity for each expired listing
    for (const listing of expiredListings) {
      await logItemExpired(listing);
    }

    // Then update their status
    await Listing.updateMany(
      {
        status: 'AVAILABLE',
        capacityKg: { $gt: 0 },
        expireAfterDays: { $type: 'number', $gt: 0 },
        ...extraFilter,
        $expr: {
          $lt: [
            { $add: [ '$harvestedAt', { $multiply: [ '$expireAfterDays', MS_PER_DAY ] } ] },
            new Date()
          ]
        }
      },
      { $set: { status: 'REMOVED' } }
    );
  } catch (e) {
    // Do not block requests because of this background-like maintenance
  }
}

export const getAllListings = async (req, res) => {
  try {
    // Expire globally before serving AVAILABLE listings
    await autoExpireListings();
    const listings = await Listing.find({ status: 'AVAILABLE' })
      .sort({ createdAt: -1 })
      .populate({ path: 'farmer', select: 'fullName email role' });
    const withFinal = listings.map((l) => ({
      ...l.toObject(),
      finalPricePerKg: computeFinalPriceWithCommission(l.pricePerKg)
    }));
    return res.status(200).json(withFinal);
  } catch (error) {
    console.log("Error in getAllListings: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const getAllListingsAll = async (req, res) => {
  try {
    await autoExpireListings();
    const listings = await Listing.find({})
      .sort({ createdAt: -1 })
      .populate({ path: 'farmer', select: 'fullName email role' });
    const withFinal = listings.map((l) => ({
      ...l.toObject(),
      finalPricePerKg: computeFinalPriceWithCommission(l.pricePerKg)
    }));
    return res.status(200).json(withFinal);
  } catch (error) {
    console.log("Error in getAllListingsAll: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const getMyListings = async (req, res) => {
  try {
    const userId = req.user._id;
    await autoExpireListings({ farmer: userId });
    const listings = await Listing.find({ farmer: userId }).sort({ createdAt: -1 });
    const withFinal = listings.map((l) => ({
      ...l.toObject(),
      finalPricePerKg: computeFinalPriceWithCommission(l.pricePerKg)
    }));
    return res.status(200).json(withFinal);
  } catch (error) {
    console.log("Error in getMyListings: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const createListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cropName, pricePerKg, capacityKg, details, harvestedAt, expireAfterDays, images } = req.body || {};

    if (!cropName || pricePerKg == null || capacityKg == null || !harvestedAt) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Required fields missing" } });
    }

    const nameStr = String(cropName).trim();
    const validName = /^[A-Za-z0-9 ]+$/.test(nameStr);
    const priceNum = Number(pricePerKg);
    const capacityNum = Number(capacityKg);
    const validPrice = Number.isFinite(priceNum) && priceNum >= 0;
    const validCapacity = Number.isInteger(capacityNum) && capacityNum >= 0;
    const harvestedDate = new Date(harvestedAt);
    const expireDaysNum = expireAfterDays != null ? Number(expireAfterDays) : null;
    const today = new Date();
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const isFuture = harvestedDate > endOfToday;

    if (!validName) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Crop name must contain letters and numbers only' } });
    }
    if (!validPrice) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Price must be a non-negative number' } });
    }
    if (!validCapacity) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Capacity must be a non-negative integer' } });
    }
    if (!(harvestedDate instanceof Date) || isNaN(harvestedDate.getTime())) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid harvested date' } });
    }
    if (isFuture) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Harvested date cannot be in the future' } });
    }
    if (expireDaysNum != null) {
      if (!Number.isInteger(expireDaysNum) || expireDaysNum < 1) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'expireAfterDays must be a positive integer' } });
      }
    }

    let imageUrls = [];
    if (Array.isArray(images) && images.length) {
      const limited = images.slice(0, 4);
      
      // Validate images before upload
      const validImages = limited.filter(img => {
        if (!img || typeof img !== 'string') return false;
        // Check if it's a valid base64 data URL
        if (!img.startsWith('data:image/')) return false;
        // Check file size (base64 is ~33% larger than binary, so 5MB limit = ~6.7MB base64)
        const sizeInBytes = (img.length * 3) / 4;
        if (sizeInBytes > 5 * 1024 * 1024) {
          console.log('Image too large, skipping:', sizeInBytes / 1024 / 1024, 'MB');
          return false;
        }
        return true;
      });
      
      try {
        const haveCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
        if (haveCloudinary) {
          const { v2: cloudinary } = await import('cloudinary');
          const uploads = await Promise.all(
            validImages.map((img) => cloudinary.uploader.upload(img, {
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' }, // Resize large images
                { quality: 'auto' } // Optimize quality
              ]
            }))
          );
          imageUrls = uploads.map(u => u.secure_url);
        } else {
          imageUrls = validImages;
        }
      } catch (e) {
        console.log('Image upload error:', e.message || e.toString() || 'Unknown error');
        console.log('Full error object:', e);
        // continue without images instead of failing
        imageUrls = [];
      }
    }

    const listing = await Listing.create({
      farmer: userId,
      cropName: nameStr,
      pricePerKg: priceNum,
      capacityKg: capacityNum,
      details: details ? String(details).trim() : "",
      harvestedAt: harvestedDate,
      expireAfterDays: expireDaysNum,
      images: imageUrls,
      status: 'AVAILABLE',
    });

    // Log activity for listing creation
    await logListingAdded(listing);

    return res.status(201).json(listing);
  } catch (error) {
    console.log("Error in createListing: ", error.message);
    return res.status(500).json({ error: { code: "SERVER_ERROR", message: "Internal server error" } });
  }
};

export const updateListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { cropName, pricePerKg, capacityKg, details, harvestedAt, expireAfterDays, images, status } = req.body || {};

    const listing = await Listing.findOne({ _id: id, farmer: userId });
    if (!listing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } });
    }

    if (cropName != null) {
      const nameStr = String(cropName).trim();
      if (!/^[A-Za-z0-9 ]+$/.test(nameStr)) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Crop name must contain letters and numbers only' } });
      }
      listing.cropName = nameStr;
    }
    if (pricePerKg != null) {
      const priceNum = Number(pricePerKg);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Price must be a non-negative number' } });
      }
      listing.pricePerKg = priceNum;
    }
    if (capacityKg != null) {
      const capacityNum = Number(capacityKg);
      if (!Number.isInteger(capacityNum) || capacityNum < 0) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Capacity must be a non-negative integer' } });
      }
      listing.capacityKg = capacityNum;
    }
    if (details != null) listing.details = String(details).trim();
    if (harvestedAt != null) {
      const harvestedDate = new Date(harvestedAt);
      if (!(harvestedDate instanceof Date) || isNaN(harvestedDate.getTime())) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid harvested date' } });
      }
      const today = new Date();
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      if (harvestedDate > endOfToday) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Harvested date cannot be in the future' } });
      }
      listing.harvestedAt = harvestedDate;
    }
    if (expireAfterDays != null) {
      const expireDaysNum = Number(expireAfterDays);
      if (!Number.isInteger(expireDaysNum) || expireDaysNum < 1) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'expireAfterDays must be a positive integer' } });
      }
      listing.expireAfterDays = expireDaysNum;
    }
    if (status != null) listing.status = String(status).toUpperCase();

    if (Array.isArray(images)) {
      const limited = images.slice(0, 4);
      let imageUrls = [];
      
      // Validate images before upload
      const validImages = limited.filter(img => {
        if (!img || typeof img !== 'string') return false;
        // Check if it's a valid base64 data URL
        if (!img.startsWith('data:image/')) return false;
        // Check file size (base64 is ~33% larger than binary, so 5MB limit = ~6.7MB base64)
        const sizeInBytes = (img.length * 3) / 4;
        if (sizeInBytes > 5 * 1024 * 1024) {
          console.log('Image too large, skipping:', sizeInBytes / 1024 / 1024, 'MB');
          return false;
        }
        return true;
      });
      
      try {
        const haveCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
        if (haveCloudinary) {
          const { v2: cloudinary } = await import('cloudinary');
          const uploads = await Promise.all(
            validImages.map((img) => cloudinary.uploader.upload(img, {
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' }, // Resize large images
                { quality: 'auto' } // Optimize quality
              ]
            }))
          );
          imageUrls = uploads.map(u => u.secure_url);
        } else {
          imageUrls = validImages;
        }
      } catch (e) {
        console.log('Image upload error:', e.message || e.toString() || 'Unknown error');
        console.log('Full error object:', e);
      }
      if (imageUrls.length) listing.images = imageUrls;
    }

    await listing.save();
    return res.status(200).json(listing);
  } catch (error) {
    console.log('Error in updateListing: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const listing = await Listing.findOneAndDelete({ _id: id, farmer: userId });
    if (!listing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log('Error in deleteListing: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};

export const adminDeleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByIdAndDelete(id);
    if (!listing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Listing not found' } });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log('Error in adminDeleteListing: ', error.message);
    return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
  }
};


