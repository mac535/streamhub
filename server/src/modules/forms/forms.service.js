const { db } = require('../../config/database');

exports.getTemplates = async () => {
  return await db.formTemplate.findMany();
};

exports.createTemplate = async (data) => {
  return await db.formTemplate.create({ data });
};

exports.getForms = async () => {
  return await db.form.findMany();
};

exports.createForm = async (data) => {
  return await db.form.create({
    data: {
      ...data,
      published: false
    }
  });
};

exports.getFormById = async (id) => {
  return await db.form.findFirst({ where: { id } });
};

exports.updateForm = async (id, updates) => {
  try {
    return await db.form.update({
      where: { id },
      data: updates
    });
  } catch (err) {
    return null;
  }
};

exports.submitResponse = async (data) => {
  return await db.formResponse.create({ data });
};

exports.getResponses = async (formId) => {
  return await db.formResponse.findMany({ where: { formId } });
};
