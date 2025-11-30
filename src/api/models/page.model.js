const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, index: true, required: true },
    slug: { type: String, trim: true, index: true, unique: true, required: true },
    content: { type: String, default: '' },
    status: { type: Boolean, default: true },
    meta_title: { type: String, default: '' },
    meta_description: { type: String, default: '' },
    meta_keywords: { type: String, default: '' },
  },
  { timestamps: true }
);

pageSchema.statics = {
  transform(doc) {
    if (!doc) return null;
    return {
      id: doc._id,
      title: doc.title,
      slug: doc.slug,
      content: doc.content,
      is_active: doc.is_active,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },
};

pageSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Page', pageSchema);
