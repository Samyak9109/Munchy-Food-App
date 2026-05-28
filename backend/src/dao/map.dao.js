import storeModel from "../models/store.model.js";

// find stores within X meters of user coordinates
export const getNearbyStoresDAO = async (lng, lat, radiusInKm = 5) =>
  await storeModel.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        distanceField: "distance", // adds distance field to each result
        maxDistance: radiusInKm * 1000, // convert km to meters
        spherical: true,
        query: { isOpen: true }, // only return open stores
      },
    },
    {
      $lookup: {
        from: "partners",
        localField: "partner",
        foreignField: "_id",
        as: "partner",
      },
    },
    { $unwind: "$partner" },
    { $match: { "partner.isActive": true } }, // only active partners
    {
      $project: {
        name: 1,
        address: 1,
        image: 1,
        cuisine: 1,
        rating: 1,
        isOpen: 1,
        distance: 1, // distance in meters
        location: 1,
        "partner.name": 1,
      },
    },
  ]);
