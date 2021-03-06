const mongoose = require("mongoose");
const travelplanSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      reuqired: [true, "Please add a name"],
      trim: true,
      maxLength: [50, "planName can not be more than 50 characters"],
    },
    image: {
      type: String,
      default: "no-image.jpg",
    },

    planDescription: {
      type: String,
      trim: true,
    },
    startDate: String,
    endDate: String,

    travelMembers: {
      type: [Number],
    },
    initiator: {
      type: Number,
    },
    travelGroup: {
      type: String,
    },
    likes: {
      type: [Number],
    },
    dislikes: {
      type: [Number],
    },
    status: {
      type: Number,
      default: 0,
    },
    destinationAddress: [
      {
        placeId: String,
        title: String,
        address: String,
        lat: Number,
        lng: Number,
      },
    ],

    departureAddress: {
      placeId: String,
      title: String,
      address: String,
      lat: Number,
      lng: Number,
    },
  },
  {
    timestamps: true,
  }
);

//Reverse populate departure address with virtuals
// travelplanSchema.virtual('departureAddress', {
//     ref: 'Address',
//     localField: '_id',
//     foreignField: 'travelPlan',

//     justOne: false,
//     options:{addressType: 'Departure'}

// });

//Reverse populate destination addresses with virtuals
// travelplanSchema.virtual('destinationAddresses', {
//     ref: 'Address',
//     localField: '_id',
//     foreignField: 'travelPlan',
//     justOne: false,
//     options:{addressType: 'Destination'}

// });

//Reverse populate destination addresses with virtuals
// travelplanSchema.virtual('comments', {
//     ref: 'Comment',
//     localField: '_id',
//     foreignField: 'travelPlan',
//     justOne: false,
//     options: {sort:{createdAt: - 1}}
// })

module.exports = mongoose.model("Travelplan", travelplanSchema);
