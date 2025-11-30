const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const moment = require('moment-timezone');
/**
 * City Schema
 * @private
 */

const languageSchema = new mongoose.Schema({
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  code: {
    type: String, index: true, trim: true,lowercase:true, default: '',
  },
  label: {
    type: String, index: true, trim: true, default: '',
  },
  status: { type: Boolean, index: true },
  default_language: { type: Boolean, index: true, default: false },
}, {
  timestamps: true,
});


languageSchema.statics = {
  transform() {
    const transformed = {};
    const fields = [
      'id',
      'countryId',
      'code',
      'label',
      'status',
      'createdAt',
    ];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
  transformData(rows) {
    const selectableItems = [];
    let i = 1;
    rows.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item._id,
        country_name: item.countryId.name,
        countryId: item.countryId._id,
        label:item.label,
        code: item.code,
        status: item.status,
        createdAt: moment
          .utc(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format(DEFAULT_DATEFORMAT),
      });
    });
    return selectableItems;
  },
  async defaultLanguage() {
    return await this.findOne({ default_language: 1, status: true }).select('label code  default_language');
  },
};

languageSchema.plugin(mongoosePaginate);

/**
 * @typedef language
 */
module.exports = mongoose.model('Language', languageSchema);